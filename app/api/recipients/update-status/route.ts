import dbConnect from "@/lib/database/dbConnect";
import { NextResponse } from "next/server";
import Recipient from "@/models/Recipients";

export async function PUT(request: Request) {
  try {
    await dbConnect();
    const { campaignId, status } = await request.json();
    
    // Update all recipients with matching campaignId EXCEPT those with Acknowledged status
    const result = await Recipient.updateMany(
      { 
        campaignId: campaignId,
        status: { $ne: "Acknowledged" } // Don't update if status is Acknowledged
      },
      { $set: { status: status } }
    );

    return NextResponse.json({
      success: true,
      message: `Updated ${result.modifiedCount} recipients`,
      data: result
    });
  } catch (error) {
    console.error('Error updating recipients:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update recipients' },
      { status: 500 }
    );
  }
} 