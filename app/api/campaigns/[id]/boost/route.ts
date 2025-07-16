import { NextResponse } from "next/server";
import dbConnect from "@/lib/database/dbConnect";
import Campaign from "@/models/Campaign";
import List from "@/models/Lists";
import Recipients from "@/models/Recipients";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const { targetCount } = await request.json();
    const parentCampaignId = params.id;

    // 1. Get parent campaign with recipients
    const parentCampaign = await Campaign.findById(parentCampaignId);
    if (!parentCampaign) {
      return NextResponse.json(
        { error: "Parent campaign not found" },
        { status: 404 }
      );
    }

    // Get recipients for parent campaign
    const recipients = await Recipients.find({ campaignId: parentCampaignId });
    if (!recipients || recipients.length === 0) {
      return NextResponse.json(
        { error: "No recipients found in parent campaign" },
        { status: 400 }
      );
    }

    // 2. Create child campaign by copying parent campaign data
    const childCampaign = new Campaign({
      companyId: parentCampaign.companyId,
      creatorId: parentCampaign.creatorId,
      name: parentCampaign.name + " (Boost)",
      description: parentCampaign.description,
      goal: parentCampaign.goal,
      url: parentCampaign.url,
      includeQr: parentCampaign.includeQr,
      budget: parentCampaign.budget,
      settings: parentCampaign.settings,
      giftRules: parentCampaign.giftRules,
      dateRange: parentCampaign.dateRange,
      status: "list building",
      bundleIds: parentCampaign.bundleIds,
      giftIds: parentCampaign.giftIds,
      parentCampaignId: parentCampaignId
    });

    await childCampaign.save();

    // 3. Update parent campaign with child campaign ID
    parentCampaign.childCampaignIds = parentCampaign.childCampaignIds || [];
    parentCampaign.childCampaignIds.push(childCampaign._id);
    parentCampaign.status = "list building";
    await parentCampaign.save();

    // 4. Create a new list for similar profiles
    const date = new Date();
    const formattedDate = `${date.getDate()}${date.toLocaleString('default', { month: 'short' })}${date.getFullYear().toString().slice(2)} ${date.getHours().toString().padStart(2, '0')}-${date.getMinutes().toString().padStart(2, '0')}`;
    const listName = `${parentCampaign.name} Similar Profile ${formattedDate}`;
    
    const list = new List({
      organizationId: parentCampaign.companyId,
      creatorId: parentCampaign.creatorId,
      name: listName,
      description: `Similar profiles for campaign ${parentCampaign.name}`,
      source: { manual: true },
      status: 'processing',
      tags: ['similar-profiles']
    });

    await list.save();

    // 5. Start lookalike search job
    const linkedinUrls = recipients
      .map(recipient => recipient.linkedinUrl)
      .filter(url => url);

    if (linkedinUrls.length === 0) {
      throw new Error('No LinkedIn profiles found in parent campaign');
    }

    const lookalikesResponse = await fetch(`${request.headers.get('origin')}/api/lists/${list._id}/lookalike`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        linkedinUrls,
        count: targetCount,
        vendor: process.env.NEXT_PUBLIC_USE_OCEAN_SERVICE === 'true' ? 'ocean' : 'linkedin',
        campaignId: childCampaign._id,
        onComplete: {
          updateCampaign: true,
          status: 'ready to launch'
        }
      })
    });

    if (!lookalikesResponse.ok) {
      throw new Error('Failed to start lookalike search');
    }

    return NextResponse.json({
      success: true,
      childCampaignId: childCampaign._id,
      listId: list._id
    });

  } catch (error) {
    console.error('Error in boost campaign:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to boost campaign' },
      { status: 500 }
    );
  }
} 