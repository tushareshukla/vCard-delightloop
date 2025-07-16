import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import mongoose from "mongoose";
import PlaybookRun from "@/models/PlaybookRun";
import Recipient from "@/models/Recipients";
import Gift from "@/models/Gifts";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get("organization_id");

    if (!organizationId) {
      return NextResponse.json(
        { error: "Organization ID is required" },
        { status: 400 }
      );
    }

    await dbConnect();

    // First get all playbook runs
    const playbookRuns = await PlaybookRun.find({
      organization_id: new mongoose.Types.ObjectId(organizationId),
    }).sort({ run_timestamp: -1 });

    // Get all unique recipient IDs from the playbook runs
    const allRecipientIds = playbookRuns.flatMap((run) => run.recipient_ids);

    // Fetch all recipients that have valid playbook runs and proper status
    // Exclude recipients that are part of failed or pending approval workflows
    const recipients = await Recipient.find({
      _id: { $in: allRecipientIds },
      playbookRunId: { $exists: true }, // Must have a playbook run ID
      $or: [
        {
          status: {
            $in: [
              "Processing",
              "GiftSelected",
              "OrderPlaced",
              "InTransit",
              "Delivered",
              "Acknowledged",
            ],
          },
        },
        {
          status: "Pending",
          assignedGiftId: { $exists: true }, // Only include Pending if they have a gift assigned (actual delivery tracking)
        },
      ],
    });

    // Get all unique gift IDs
    const giftIds = recipients
      .map((recipient) => recipient.assignedGiftId)
      .filter((id) => id); // Remove null/undefined

    // Fetch all gifts in one query
    const gifts = await Gift.find({
      _id: { $in: giftIds },
    });

    // Create a map of gifts for easy lookup
    const giftMap = new Map(
      gifts.map((gift) => [
        gift._id.toString(),
        {
          name: gift.name,
          price: gift.price,
          primaryImgUrl: gift.images?.primaryImgUrl,
        },
      ])
    );

    // Attach gift details to recipients
    const recipientsWithGifts = recipients.map((recipient) => {
      const recipientObj = recipient.toObject();
      if (recipient.assignedGiftId) {
        const giftDetails = giftMap.get(recipient.assignedGiftId.toString());
        if (giftDetails) {
          recipientObj.assignedGift = giftDetails;
        }
      }
      return recipientObj;
    });

    return NextResponse.json({
      success: true,
      playbookRuns,
      recipients: recipientsWithGifts,
    });
  } catch (error) {
    console.error("Error in playbook-runs GET:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
