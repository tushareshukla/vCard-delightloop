import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Campaign from "@/models/Campaign";
import Organization from "@/models/Organization";
import mongoose from "mongoose";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    
    const campaign = await Campaign.findById(params.id);
    if (!campaign) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      campaign: {
        name: campaign.name,
        id: campaign._id
      }
    });
  } catch (error) {
    console.error("Error fetching campaign details:", error);
    return NextResponse.json(
      { error: "Failed to fetch campaign details" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    console.log('[Campaign Logo Update API] Processing request for campaign:', params.id);

    // Validate campaign ID
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      console.error('[Campaign Logo Update API] Invalid campaign ID format');
      return NextResponse.json(
        { success: false, error: "Invalid campaign ID format" },
        { status: 400 }
      );
    }

    // Get the request body
    const { organization_id } = await request.json();
    
    if (!organization_id) {
      return NextResponse.json(
        { success: false, error: "Organization ID is required" },
        { status: 400 }
      );
    }

    // Fetch organization to get logo_url
    const organization = await Organization.findById(organization_id);
    if (!organization) {
      return NextResponse.json(
        { success: false, error: "Organization not found" },
        { status: 404 }
      );
    }

    const logoUrl = organization.branding?.logo_url || "";

    // Update campaign with organization's logo
    const updatedCampaign = await Campaign.findByIdAndUpdate(
      params.id,
      {
        $set: {
          'outcomeCard.logoLink': logoUrl,
          'outcomeTemplate.logoLink': logoUrl
        }
      },
      { new: true }
    );

    if (!updatedCampaign) {
      return NextResponse.json(
        { success: false, error: "Campaign not found" },
        { status: 404 }
      );
    }

    console.log('[Campaign Logo Update API] Successfully updated campaign:', {
      campaignId: updatedCampaign._id,
      logoUrl: logoUrl
    });

    return NextResponse.json({
      success: true,
      data: updatedCampaign
    });

  } catch (error) {
    console.error("[Campaign Logo Update API] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update campaign"
      },
      { status: 500 }
    );
  }
} 