import { NextResponse } from 'next/server';
import dbConnect from "@/lib/database/dbConnect";
import { Recipient } from "@/models/Recipients";
import mongoose from "mongoose";

export async function POST(request: Request) {
  try {
    console.log('[Bulk Delete Recipients] Starting bulk deletion process');
    await dbConnect();
    console.log('[Bulk Delete Recipients] Database connected');

    const { recipientIds } = await request.json();
    console.log('[Bulk Delete Recipients] Received request for IDs:', recipientIds);

    if (!Array.isArray(recipientIds) || recipientIds.length === 0) {
      console.log('[Bulk Delete Recipients] Invalid or empty recipient IDs array');
      return NextResponse.json(
        { success: false, error: 'Invalid recipient IDs array' },
        { status: 400 }
      );
    }

    // Convert string IDs to ObjectIds
    const objectIds = recipientIds.map(id => new mongoose.Types.ObjectId(id));

    // Delete multiple recipients
    console.log('[Bulk Delete Recipients] Deleting recipients with IDs:', recipientIds);
    const result = await Recipient.deleteMany({
      _id: { $in: objectIds }
    });

    console.log('[Bulk Delete Recipients] Deletion result:', {
      deletedCount: result.deletedCount,
      acknowledged: result.acknowledged
    });

    if (!result.acknowledged) {
      console.error('[Bulk Delete Recipients] Failed to acknowledge deletion');
      return NextResponse.json(
        { success: false, error: 'Failed to delete recipients' },
        { status: 500 }
      );
    }

    if (result.deletedCount === 0) {
      console.log('[Bulk Delete Recipients] No recipients found with provided IDs');
      return NextResponse.json(
        { success: false, error: 'No recipients found' },
        { status: 404 }
      );
    }

    console.log('[Bulk Delete Recipients] Successfully deleted recipients');
    return NextResponse.json({
      success: true,
      message: 'Recipients deleted successfully',
      deletedCount: result.deletedCount
    });

  } catch (error) {
    console.error('[Bulk Delete Recipients] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete recipients',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 