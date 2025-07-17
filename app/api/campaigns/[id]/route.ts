import { NextRequest, NextResponse } from "next/server";
import Campaign from "@/models/Campaign";
import Recipient from "@/models/Recipients";
import Gift from "@/models/Gifts";
import dbConnect from "@/lib/database/dbConnect";
import { connectToDatabase } from "@/lib/database/connectToDatabase";
import { MongoClient } from "mongodb";
import { ObjectId } from "mongodb";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log("Starting GET campaign request");
    await dbConnect();

    // Fetch campaign
    const campaign = await Campaign.findOne({
      _id: params.id,
    });

    console.log("Campaign found:", campaign ? "yes" : "no");

    if (!campaign) {
      console.log("Campaign not found");
      return NextResponse.json(
        { success: false, error: "Campaign not found" },
        { status: 404 }
      );
    }

    // 2. Get all recipients for this campaign
    const recipients = await Recipient.find({ campaignId: params.id }).select(
      "_id firstName lastName jobTitle companyName address mailId phoneNumber assignedGiftId deliveryDate acknowledgedAt whyGift sendMode status expectedDeliveryDate trackingId"
    );

    // 3. Get unique gift IDs from recipients
    const uniqueGiftIds = [
      ...new Set(
        recipients.filter((r) => r.assignedGiftId).map((r) => r.assignedGiftId)
      ),
    ];

    // 4. Fetch all gifts associated with these recipients
    const gifts = await Gift.find({
      _id: { $in: uniqueGiftIds },
    });

    // Create a map for quick gift lookups
    const giftMap = new Map(gifts.map((gift) => [gift._id.toString(), gift]));

    // 5. Map the gifts to recipients using their actual assigned gifts
    const recipientsWithGifts = recipients.map((recipient) => {
      const recipientObj = recipient.toObject();
      if (recipient.assignedGiftId) {
        const gift = giftMap.get(recipient.assignedGiftId.toString());
        if (gift) {
          return {
            ...recipientObj,
            assignedGift: {
              _id: gift._id,
              name: gift.name,
              price: gift.price,
              primaryImgUrl: gift.images?.primaryImgUrl,
              descShort: gift.descShort,
            },
          };
        }
      }
      return recipientObj;
    });

    // 6. Fetch child campaigns if they exist
    let childCampaigns = [];
    if (campaign.childCampaignIds && campaign.childCampaignIds.length > 0) {
      childCampaigns = await Campaign.find({
        _id: { $in: campaign.childCampaignIds },
      }).select("_id name status");
    }

    // 7. Combine all data
    const campaignData = {
      ...campaign.toObject(),
      recipients: recipientsWithGifts,
      childCampaigns,
      availableGifts: campaign.giftIds
        ? await Gift.find({
            _id: { $in: campaign.giftIds },
          }).select("_id name price images.primaryImgUrl")
        : [],
    };

    return NextResponse.json({
      success: true,
      data: campaignData,
    });
  } catch (error) {
    console.error("Error in GET campaign:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch campaign",
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const { pathname } = new URL(request.url);
    const campaignId = pathname.split("/").pop();

    console.log("Received update request for campaign:", campaignId);

    if (!campaignId) {
      console.error("No campaign ID provided");
      return NextResponse.json(
        { message: "Campaign ID is required" },
        { status: 400 }
      );
    }

    await dbConnect();
    const body = await request.json();
    console.log("Request body:", JSON.stringify(body, null, 2));

    // Get MongoDB connection directly
    const { db } = await connectToDatabase();
    const campaignsCollection = db.collection("campaigns");

    // Create update object with $set operator
    const updateData = {};

    // Process all fields in the request body
    Object.keys(body).forEach((key) => {
      if (key.includes(".")) {
        // For dot notation fields, split and handle nested structure
        const [parent, child] = key.split(".");
        if (!updateData[parent]) updateData[parent] = {};
        updateData[parent][child] = body[key];
      } else if (
        key === "eventStartDate" ||
        key === "deliverByDate" ||
        key === "completedAt"
      ) {
        // Convert dates to Date objects
        updateData[key] = new Date(body[key]);
      } else {
        // Handle regular fields
        updateData[key] = body[key];
      }
    });

    console.log("Final update data:", JSON.stringify(updateData, null, 2));

    // Use direct MongoDB update
    const result = await campaignsCollection.updateOne(
      { _id: new ObjectId(campaignId) },
      { $set: updateData }
    );

    console.log("Update result:", result);

    // Fetch the updated campaign to return
    const updatedCampaign = await campaignsCollection.findOne({
      _id: new ObjectId(campaignId),
    });
    console.log("Campaign updated successfully:", updatedCampaign);

    return NextResponse.json({
      success: true,
      data: updatedCampaign,
    });
  } catch (error) {
    console.error("Error updating campaign:", error);
    return NextResponse.json(
      {
        message: "Error updating campaign",
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

// Helper function to connect to MongoDB directly
async function connectToDatabase() {
  const client = await MongoClient.connect(process.env.MONGODB_URI);
  const db = client.db();
  return { client, db };
}
