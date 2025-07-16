import { NextResponse } from "next/server";
import dbConnect from "@/lib/database/dbConnect";
import mongoose from "mongoose";
import { Recipient } from "@/models/Recipients";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const id = await params.id;
    console.log("Updating acknowledgment for recipient:", id);

    // Update recipient with acknowledgedAt, creating the field if it doesn't exist
    const recipient = await Recipient.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(id),
        $or: [
          { acknowledgedAt: null },
          { acknowledgedAt: { $exists: false } }
        ]
      },
      {
        $set: { 
          acknowledgedAt: new Date(),
          status: "Acknowledged"
        }
      },
      { 
        new: true,
        upsert: false // Don't create new document if not found
      }
    );

    if (!recipient) {
      console.log("Recipient not found or already acknowledged");
      return NextResponse.json(
        { message: "Recipient not found or already acknowledged" },
        { status: 404 }
      );
    }
    
    //for sending acknowledgement to mail
    try{
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/v1/recipients/${id}/mail/acknowledge`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9`
        }
      });
    }
    catch(error){
      console.error("Error updating recipient acknowledgment:", error);
    }

    console.log("Successfully updated acknowledgment for recipient:", id);
    return NextResponse.json({ 
      success: true,
      data: recipient 
    });
  } catch (error) {
    console.error("Error updating recipient acknowledgment:", error);
    return NextResponse.json(
      { error: "Failed to update recipient acknowledgment" },
      { status: 500 }
    );
  }
} 