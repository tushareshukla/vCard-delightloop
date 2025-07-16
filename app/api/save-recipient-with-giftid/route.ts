import { NextResponse } from "next/server";
import dbConnect from "@/lib/database/dbConnect";
import Recipient from "@/models/Recipients";
import mongoose from "mongoose";

export async function POST(request: Request) {
  try {
    await dbConnect();
    console.log("✅ Database connected");

    const { assignments } = await request.json();
    console.log("📦 Received assignments count:", assignments.length);
    console.log("📝 Sample assignment:", assignments[0]);

    // First verify we can find the recipient
    const sampleId = assignments[0].recipientId;
    const beforeUpdate = await Recipient.findById(sampleId).lean();
    console.log("📝 Before update:", JSON.stringify(beforeUpdate, null, 2));

    // Create bulk operations
    const bulkOps = assignments.map((assignment: any) => ({
      updateOne: {
        filter: {
          _id: new mongoose.Types.ObjectId(assignment.recipientId),
          campaignId: new mongoose.Types.ObjectId(assignment.campaignId),
        },
        update: {
          $set: {
            assignedGiftId: new mongoose.Types.ObjectId(assignment.giftId),
            whyGift: assignment.whyGift,
            sendMode: assignment.sendMode,
            updatedAt: new Date(),
          },
        },
        upsert: false,
      },
    }));

    console.log(
      "🔄 Sample bulk operation:",
      JSON.stringify(bulkOps[0], null, 2)
    );

    // Execute bulk write
    const result = await Recipient.bulkWrite(bulkOps);
    console.log("✨ Bulk write result:", {
      matched: result.matchedCount,
      modified: result.modifiedCount,
      time: new Date().toISOString(),
    });

    // Verify the update directly from the database
    const sampleRecipient = await Recipient.findById(sampleId).lean();

    console.log(
      "🔍 Raw recipient data:",
      JSON.stringify(sampleRecipient, null, 2)
    );
    // console.log("🔍 Sample recipient after update:", {
    //   id: sampleRecipient?._id,
    //   assignedGiftId: sampleRecipient?.assignedGiftId?.toString(),
    //   firstName: sampleRecipient?.firstName,
    //   lastName: sampleRecipient?.lastName,
    //   allKeys: Object.keys(sampleRecipient || {}),
    // });

    // Try a direct update as a test
    const directUpdate = await Recipient.findByIdAndUpdate(
      sampleId,
      {
        $set: {
          assignedGiftId: new mongoose.Types.ObjectId(assignments[0].giftId),
          testField: "This is a test",
        },
      },
      { new: true }
    ).lean();

    console.log(
      "🔍 After direct update:",
      JSON.stringify(directUpdate, null, 2)
    );

    if (!sampleRecipient || !("assignedGiftId" in sampleRecipient)) {
      console.error("❌ Gift assignment failed - assignedGiftId is missing");
      return NextResponse.json(
        {
          success: false,
          message: "Failed to assign gift - verification failed",
          details: {
            recipientId: sampleId,
            beforeUpdate,
            afterBulkWrite: sampleRecipient,
            afterDirectUpdate: directUpdate,
            updatePayload: bulkOps[0],
          },
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Gift assignments saved successfully",
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("❌ Operation failed:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to save gift assignments",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    await dbConnect();
    console.log("✅ Database connected");

    const { recipientId, giftId, campaignId, whyGift, sendMode } = await request.json();
    console.log("📦 Received update for recipient:", recipientId);

    // Update single recipient
    const result = await Recipient.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(recipientId),
        campaignId: new mongoose.Types.ObjectId(campaignId),
      },
      {
        $set: {
          assignedGiftId: new mongoose.Types.ObjectId(giftId),
          whyGift,
          sendMode,
          updatedAt: new Date(),
        },
      },
      { new: true }
    );

    if (!result) {
      return NextResponse.json(
        {
          success: false,
          message: "Recipient not found or update failed",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Gift assignment updated successfully",
      data: result,
    });
  } catch (error) {
    console.error("❌ Operation failed:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to update gift assignment",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
