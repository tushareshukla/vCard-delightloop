import { NextResponse } from "next/server";
import dbConnect from "@/lib/database/dbConnect";
import { Recipient } from "@/models/Recipients";
import mongoose from "mongoose";
import Gift from "@/models/Gifts";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log("GET /api/recipients/[id] - Starting request");
    await dbConnect();
    console.log("Database connected");

    const id = params.id;
    console.log("Recipient ID:", id);

    if (!id) {
      console.log("No recipient ID provided");
      return NextResponse.json(
        { success: false, error: "Recipient ID is required" },
        { status: 400 }
      );
    }

    const recipient = await Recipient.findById(id);
    console.log("Found recipient:", recipient ? "yes" : "no");

    if (!recipient) {
      console.log("Recipient not found");
      return NextResponse.json(
        { success: false, error: "Recipient not found" },
        { status: 404 }
      );
    }

    // If recipient has an assigned gift, fetch the gift details
    const recipientData = recipient.toObject();
    if (recipient.assignedGiftId) {
      console.log("Fetching assigned gift details");
      const gift = await Gift.findById(recipient.assignedGiftId);
      if (gift) {
        recipientData.assignedGift = {
          name: gift.name,
          price: gift.price,
          primaryImgUrl: gift.images?.primaryImgUrl,
          descShort: gift.descShort
        };
      }
    }

    console.log("Successfully fetched recipient data");
    return NextResponse.json({
      success: true,
      data: recipientData
    });
  } catch (error) {
    console.error("Error fetching recipient:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch recipient"
      },
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

    const id = params.id;
    const body = await request.json();

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Recipient ID is required" },
        { status: 400 }
      );
    }

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid recipient ID format" },
        { status: 400 }
      );
    }

    const recipient = await Recipient.findById(id);
    if (!recipient) {
      return NextResponse.json(
        { success: false, error: "Recipient not found" },
        { status: 404 }
      );
    }

    // Update fields that are provided in the request body
    const updateFields: any = {};

    if (body.firstName !== undefined) updateFields.firstName = body.firstName;
    if (body.lastName !== undefined) updateFields.lastName = body.lastName;
    if (body.mailId !== undefined) updateFields.mailId = body.mailId;
    if (body.status !== undefined) updateFields.status = body.status;
    if (body.acknowledgedAt !== undefined) updateFields.acknowledgedAt = body.acknowledgedAt;
    if (body.campaignId !== undefined) updateFields.campaignId = body.campaignId;
    if (body.feedback !== undefined) updateFields.feedback = body.feedback;
    if (body.assignedGiftId !== undefined) updateFields.assignedGiftId = body.assignedGiftId;
    if (body.address !== undefined) updateFields.address = body.address;
    if (body.linkedinUrl !== undefined) updateFields.linkedinUrl = body.linkedinUrl;

    // Update the recipient
    const updatedRecipient = await Recipient.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { new: true, runValidators: true }
    );

    if (!updatedRecipient) {
      return NextResponse.json(
        { success: false, error: "Failed to update recipient" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Recipient updated successfully",
      data: updatedRecipient
    });
  } catch (error) {
    console.error("Error updating recipient:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update recipient"
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
    try {
      await dbConnect();

      const id = params.id;
      const body = await request.json();

      if (!id) {
        return NextResponse.json({ success: false, error: "Recipient ID is required" }, { status: 400 });
      }

      const recipient = await Recipient.findById(id);
      if (!recipient) {
        return NextResponse.json({ success: false, error: "Recipient not found" }, { status: 404 });
      }

      if (body.assignedGiftId) {
        recipient.assignedGiftId = body.assignedGiftId;
      }

      await recipient.save();

      return NextResponse.json({ success: true, message: "Recipient updated successfully" }, { status: 200 });
    } catch (error) {
      console.error("Error updating recipient:", error);
      return NextResponse.json(
        { success: false, error: "Failed to update recipient" },
        { status: 500 }
      );
    }
  }
