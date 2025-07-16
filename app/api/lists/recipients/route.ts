import { NextResponse } from "next/server";
import dbConnect from "@/lib/database/dbConnect";
import List from "@/models/Lists";
import Recipient from "@/models/Recipients";
import mongoose from "mongoose";

export async function GET(request: Request) {
    try {
        await dbConnect();

        // Get listIds from URL params
        const { searchParams } = new URL(request.url);
        const listIds = searchParams.get('listIds')?.split(',') || [];

        if (!listIds.length) {
            return NextResponse.json(
                { success: false, error: "List IDs are required" },
                { status: 400 }
            );
        }

        // Convert string IDs to ObjectIds
        const objectIds = listIds.map(id => new mongoose.Types.ObjectId(id));

        // Get all lists
        const lists = await List.find({
            _id: { $in: objectIds }
        });

        // Get all recipient IDs from the lists
        const recipientIds = lists.flatMap(list =>
            list.recipients.map(r => new mongoose.Types.ObjectId(r.recipientId))
        );

        // Get unique recipient IDs
        const uniqueRecipientIds = [...new Set(recipientIds)];

        // Get all recipients
        const recipients = await Recipient.find({
            _id: { $in: uniqueRecipientIds }
        });

        return NextResponse.json({
            success: true,
            recipients: recipients,
            count: recipients.length
        });

    } catch (error) {
        console.error('Error fetching list recipients:', error);
        return NextResponse.json(
            { success: false, error: "Failed to fetch recipients" },
            { status: 500 }
        );
    }
}
