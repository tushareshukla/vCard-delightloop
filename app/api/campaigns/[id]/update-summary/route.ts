import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/database/dbConnect";
import Campaign from "@/models/Campaign";
import { validateUser } from "@/middleware/authMiddleware";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log("Starting update-summary request for campaign:", params.id);
    await dbConnect();

    // Validate user
    const validation = await validateUser(request);
    if (!validation.success) {
      console.log("User validation failed");
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 401 }
      );
    }

    // Get request body
    const body = await request.json();
    console.log("Request body:", body);

    // Validate request body
    if (!body.field || typeof body.increment !== 'number') {
      return NextResponse.json(
        { success: false, error: "Invalid request body. 'field' and 'increment' are required." },
        { status: 400 }
      );
    }

    // Validate field
    const validFields = ['giftSelected', 'waitingForAddress', 'shipped', 'delivered', 'acknowledged'];
    if (!validFields.includes(body.field)) {
      return NextResponse.json(
        { success: false, error: `Invalid field. Must be one of: ${validFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Find the campaign
    const campaign = await Campaign.findById(params.id);
    if (!campaign) {
      return NextResponse.json(
        { success: false, error: "Campaign not found" },
        { status: 404 }
      );
    }

    // Initialize recipientSummary if it doesn't exist
    if (!campaign.recipientSummary) {
      campaign.recipientSummary = {
        totalCount: 0,
        statusCounts: {
          giftSelected: 0,
          waitingForAddress: 0,
          shipped: 0,
          delivered: 0,
          acknowledged: 0
        }
      };
    }

    // Initialize statusCounts if it doesn't exist
    if (!campaign.recipientSummary.statusCounts) {
      campaign.recipientSummary.statusCounts = {
        giftSelected: 0,
        waitingForAddress: 0,
        shipped: 0,
        delivered: 0,
        acknowledged: 0
      };
    }

    // Initialize the specific field if it doesn't exist
    if (typeof campaign.recipientSummary.statusCounts[body.field] !== 'number') {
      campaign.recipientSummary.statusCounts[body.field] = 0;
    }

    // Update the field
    campaign.recipientSummary.statusCounts[body.field] += body.increment;

    // Ensure the count is not negative
    if (campaign.recipientSummary.statusCounts[body.field] < 0) {
      campaign.recipientSummary.statusCounts[body.field] = 0;
    }

    // Save the campaign
    await campaign.save();

    return NextResponse.json({
      success: true,
      message: `Successfully updated ${body.field} count by ${body.increment}`,
      data: campaign.recipientSummary
    });
  } catch (error) {
    console.error("Error updating campaign summary:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update campaign summary" },
      { status: 500 }
    );
  }
} 