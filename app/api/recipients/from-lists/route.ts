import { NextResponse } from "next/server";
import dbConnect from "@/lib/database/dbConnect";
import List from "@/models/Lists";
import Recipient from "@/models/Recipients";
import mongoose from "mongoose";

export async function POST(request: Request) {
    try {
        await dbConnect();

        const { listIds, campaignId } = await request.json();

        if (!listIds || !Array.isArray(listIds) || listIds.length === 0) {
            return NextResponse.json(
                { success: false, error: "List IDs are required" },
                { status: 400 }
            );
        }

        if (!campaignId) {
            return NextResponse.json(
                { success: false, error: "Campaign ID is required" },
                { status: 400 }
            );
        }

        // Get all lists
        const lists = await List.find({
            _id: { $in: listIds }
        });

        // Get all recipient IDs from the lists
        const recipientIds = lists.flatMap(list => 
            list.recipients.map(r => r.recipientId)
        );

        // Get unique recipient IDs
        const uniqueRecipientIds = [...new Set(recipientIds)];

        // Get all recipients
        const recipients = await Recipient.find({
            _id: { $in: uniqueRecipientIds }
        });

        // Create new recipients with the campaign ID
        const recipientsWithCampaignId = recipients.map(recipient => ({
            firstName: recipient.firstName,
            lastName: recipient.lastName,
            mailId: recipient.mailId,
            phoneNumber: recipient.phoneNumber,
            companyName: recipient.companyName,
            jobTitle: recipient.jobTitle,
            linkedinUrl: recipient.linkedinUrl,
            address: recipient.address,
            campaignId: new mongoose.Types.ObjectId(campaignId),
            status: "null",
            expectedDeliveryDate: null,
            deliveryDate: null,
            acknowledgedTime: null,
        }));

        // Insert the new recipients
        const savedRecipients = await Recipient.insertMany(recipientsWithCampaignId);

        return NextResponse.json({
            success: true,
            recipients: savedRecipients,
            count: savedRecipients.length
        });
    } catch (error) {
        console.error("Error fetching recipients from lists:", error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : "Failed to fetch recipients from lists"
            },
            { status: 500 }
        );
    }
} 