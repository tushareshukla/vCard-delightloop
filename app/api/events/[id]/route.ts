import { NextRequest, NextResponse } from "next/server";
import Event from "@/models/Event";
import dbConnect from "@/lib/database/dbConnect";
import mongoose from "mongoose";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log("🚀 Starting GET single event request");
  try {
    console.log("1. Connecting to database...");
    await dbConnect();
    console.log("✅ Database connected");

    const { id } = params;
    console.log("2. Event ID:", id);

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.error("❌ Invalid event ID format");
      return NextResponse.json(
        {
          success: false,
          error: "Invalid event ID format",
        },
        { status: 400 }
      );
    }

    console.log("3. Fetching event...");
    const event = await Event.findById(id)
      .populate("creatorUserId", "name email")
      .populate("organizationId", "name")
      .populate("campaignIds", "name status");

    if (!event) {
      console.error("❌ Event not found");
      return NextResponse.json(
        {
          success: false,
          error: "Event not found",
        },
        { status: 404 }
      );
    }

    console.log("4. Event fetched:", {
      eventId: event._id,
      name: event.name,
    });

    return NextResponse.json({
      success: true,
      data: {
        event,
      },
    });
  } catch (error) {
    console.error("❌ Error fetching event:", {
      error_message: error instanceof Error ? error.message : "Unknown error",
      error_stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch event",
      },
      { status: 500 }
    );
  }
}
