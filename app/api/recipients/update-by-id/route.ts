import { NextResponse } from "next/server";
import Recipient from "@/models/Recipients";
import dbConnect from "@/lib/database/dbConnect";

export async function PUT(request: Request) {
  try {
    await dbConnect();

    const body = await request.json();
    const { 
      recipientId, 
      status, 
      expectedDeliveryDate, 
      deliveryDate, 
      trackingId 
    } = body;

    if (!recipientId) {
      return NextResponse.json(
        { success: false, message: "Recipient ID is required" },
        { status: 400 }
      );
    }

    // Find and update recipient by ID
    const recipient = await Recipient.findByIdAndUpdate(
      recipientId,
      {
        $set: {
          // Only update if the field is provided
          ...(status && { status }),
          ...(expectedDeliveryDate !== undefined && { expectedDeliveryDate }),
          ...(deliveryDate !== undefined && { deliveryDate }),
          ...(trackingId !== undefined && { trackingId })
        }
      },
      { 
        new: true,
        runValidators: true
      }
    );

    if (!recipient) {
      return NextResponse.json(
        { success: false, message: `Recipient not found with ID: ${recipientId}` },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      data: recipient,
      message: `Successfully updated recipient with ID: ${recipientId}`
    });
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to update recipient" 
      },
      { status: 500 }
    );
  }
} 