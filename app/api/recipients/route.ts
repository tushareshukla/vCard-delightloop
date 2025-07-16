import { NextResponse } from "next/server";
import dbConnect from "@/lib/database/dbConnect";
import Recipient from "@/models/Recipients";
import mongoose from "mongoose";

export async function GET(request: Request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get("campaignId");

    if (!campaignId) {
      return NextResponse.json(
        { error: "Campaign ID is required" },
        { status: 400 }
      );
    }

    const recipients = await Recipient.find({ campaignId });

    return NextResponse.json({
      success: true,
      recipients,
      count: recipients.length,
    });
  } catch (error) {
    console.error("Error handling GET request:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get("campaignId");

    if (!campaignId) {
      return NextResponse.json(
        { error: "Campaign ID is required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { mailId, linkedinUrl, address } = body;

    if (!mailId) {
      return NextResponse.json(
        { error: "mailId is required" },
        { status: 400 }
      );
    }

    // Create an update object with only the fields that are provided
    const updateFields: { linkedinUrl?: string; address?: string } = {};
    if (linkedinUrl) updateFields.linkedinUrl = linkedinUrl;
    if (address) updateFields.address = address;

    const updatedRecipient = await Recipient.findOneAndUpdate(
      { campaignId, mailId },
      { $set: updateFields },
      { new: true, upsert: false }
    );

    if (!updatedRecipient) {
      return NextResponse.json(
        {
          success: false,
          error: "Recipient not found or no updates were made",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Recipient updated successfully",
      recipient: updatedRecipient,
    });
  } catch (error) {
    console.error("Error handling PUT request:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();

    const body = await request.json();

    // Ensure campaignId is converted to ObjectId
    if (body.campaignId) {
      body.campaignId = new mongoose.Types.ObjectId(body.campaignId);
    }

    // Create the recipient
    const recipient = await Recipient.create({
      ...body,
      status: "Processing", // Set default status
    });

    return NextResponse.json({
      success: true,
      message: "Recipient created successfully",
      data: recipient,
    });
  } catch (error) {
    console.error("Error creating recipient:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to create recipient",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
