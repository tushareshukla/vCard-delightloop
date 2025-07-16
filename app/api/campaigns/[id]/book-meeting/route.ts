import { NextRequest, NextResponse } from "next/server";
import { MongoClient, ObjectId } from "mongodb";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: campaignId } = params;
    const body = await request.json();
    const { hostId, slotId, date, recipientId, bookedAt } = body;

    console.log("Booking meeting request:", {
      campaignId,
      hostId,
      slotId,
      date,
      recipientId,
    });

    // Validate required fields
    if (!hostId || !slotId || !date || !recipientId) {
      return NextResponse.json(
        { error: "Missing required fields: hostId, slotId, date, recipientId" },
        { status: 400 }
      );
    }

    // Connect to database using the same method as other APIs
    const { db } = await connectToDatabase();
    const campaignsCollection = db.collection("campaigns");

    // Find the campaign first to validate it exists
    const campaign = await campaignsCollection.findOne({
      _id: new ObjectId(campaignId),
    });

    if (!campaign) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }

    // Check if the slot exists and is not already booked
    const host = campaign.meetingHosts?.find((h: any) => h.hostId === hostId);
    if (!host) {
      return NextResponse.json({ error: "Host not found" }, { status: 404 });
    }

    const scheduleItem = host.schedule?.find((s: any) => s.date === date);
    if (!scheduleItem) {
      return NextResponse.json(
        { error: "Date not found in host schedule" },
        { status: 404 }
      );
    }

    const slot = scheduleItem.slots?.find(
      (slot: any) => slot.slotId === slotId
    );
    if (!slot) {
      return NextResponse.json({ error: "Slot not found" }, { status: 404 });
    }

    if (slot.isBooked) {
      return NextResponse.json(
        { error: "This slot is already booked" },
        { status: 409 }
      );
    }

    // Check if this recipient has already booked any slot in this campaign
    let recipientHasExistingBooking = false;
    for (const host of campaign.meetingHosts || []) {
      for (const schedule of host.schedule || []) {
        for (const existingSlot of schedule.slots || []) {
          if (
            existingSlot.isBooked &&
            existingSlot.recipientId === recipientId
          ) {
            recipientHasExistingBooking = true;
            break;
          }
        }
        if (recipientHasExistingBooking) break;
      }
      if (recipientHasExistingBooking) break;
    }

    if (recipientHasExistingBooking) {
      return NextResponse.json(
        { error: "You have already booked a meeting slot for this campaign" },
        { status: 409 }
      );
    }

    // Update the specific slot to mark it as booked
    const updateResult = await campaignsCollection.updateOne(
      {
        _id: new ObjectId(campaignId),
        "meetingHosts.hostId": hostId,
        "meetingHosts.schedule.date": date,
        "meetingHosts.schedule.slots.slotId": slotId,
      },
      {
        $set: {
          "meetingHosts.$[host].schedule.$[schedule].slots.$[slot].isBooked":
            true,
          "meetingHosts.$[host].schedule.$[schedule].slots.$[slot].recipientId":
            recipientId,
          "meetingHosts.$[host].schedule.$[schedule].slots.$[slot].bookedAt":
            bookedAt || new Date().toISOString(),
        },
      },
      {
        arrayFilters: [
          { "host.hostId": hostId },
          { "schedule.date": date },
          { "slot.slotId": slotId },
        ],
      }
    );

    console.log("Update result:", updateResult);

    if (updateResult.modifiedCount === 0) {
      return NextResponse.json(
        { error: "Failed to book the meeting slot" },
        { status: 500 }
      );
    }

    // Return success response
    return NextResponse.json(
      {
        success: true,
        message: "Meeting booked successfully",
        booking: {
          campaignId,
          hostId,
          slotId,
          date,
          recipientId,
          bookedAt: bookedAt || new Date().toISOString(),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error booking meeting:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Helper function to connect to MongoDB directly
async function connectToDatabase() {
  const client = await MongoClient.connect(process.env.MONGODB_URI!);
  const db = client.db();
  return { client, db };
}
