import { NextResponse } from "next/server";
import Recipient from "@/models/Recipients";
import dbConnect from "@/lib/database/dbConnect";

export async function PUT(request: Request) {
  try {
    await dbConnect();

    const body = await request.json();
    const { campaignId, recipientEmail, status, expectedDeliveryDate, deliveryDate, trackingId } = body;

    // Find and update recipient by campaign ID and email only
    const recipient = await Recipient.findOneAndUpdate(
      { 
        campaignId,
        mailId: recipientEmail
      },
      {
        $set: {
          // Only update delivery-related fields
          status: status || 'Processing',
          expectedDeliveryDate: expectedDeliveryDate || '',
          deliveryDate: deliveryDate || '',
          trackingId: trackingId || ''
        }
      },
      { 
        new: true,
        runValidators: true
      }
    );

    if (!recipient) {
      console.error('Recipient not found:', {
        campaignId,
        recipientEmail
      });
      return NextResponse.json(
        { success: false, message: `Recipient not found with email: ${recipientEmail}` },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      data: recipient,
      message: `Successfully updated delivery details for ${recipientEmail}`
    });
  } catch (error) {
    console.error("Error updating recipient delivery details:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to update recipient" 
      },
      { status: 500 }
    );
  }
} 