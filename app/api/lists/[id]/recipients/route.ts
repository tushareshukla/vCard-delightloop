import { NextResponse } from "next/server";
import dbConnect from "@/lib/database/dbConnect";
import List from "@/models/Lists";
import Recipient from "@/models/Recipients";
import mongoose from "mongoose";

export async function POST(request: Request, context: any) {
    try {
        await dbConnect();

        const { id } = context.params;
        const { contacts, source } = await request.json();

        if (!id) {
            return NextResponse.json(
                { success: false, error: "List ID is required" },
                { status: 400 }
            );
        }

        // First get the current list to get the current recipients
        const currentList = await List.findById(id);
        if (!currentList) {
            return NextResponse.json(
                { success: false, error: "List not found" },
                { status: 404 }
            );
        }

        // If contacts is empty or null and source is 'similar', just update status
        if ((!contacts || contacts.length === 0) && source === 'similar') {
            const updatedList = await List.findByIdAndUpdate(
                id,
                { $set: { status: 'in-progress' } },
                { new: true }
            );
            
            return NextResponse.json({
                success: true,
                data: {
                    list: updatedList,
                    message: "List status updated to in-progress"
                }
            });
        }

        // Get all existing recipients' emails for this list
        const existingRecipientIds = currentList.recipients.map(r => r.recipientId);
        const existingRecipients = await Recipient.find({
            _id: { $in: existingRecipientIds }
        });
        const existingEmails = new Set(existingRecipients.map(r => r.mailId));

        // Filter out contacts that already exist
        const newContacts = contacts.filter(contact => !existingEmails.has(contact.email));

        if (newContacts.length === 0) {
            return NextResponse.json({
                success: true,
                data: {
                    savedRecipients: 0,
                    list: currentList,
                    message: "All contacts already exist in the list"
                }
            });
        }

        // Save only new contacts as recipients
        const recipientsToCreate = newContacts.map((contact: any) => ({
            firstName: contact.name.split(' ')[0],
            lastName: contact.name.split(' ').slice(1).join(' '),
            mailId: contact.email,
            phoneNumber: contact.phone,
            companyName: contact.company,
            jobTitle: contact.jobtitle,
            linkedinUrl: contact.linkedin,
            campaignId: new mongoose.Types.ObjectId('000000000000000000000000'),
            address: {
                line1: contact.address?.line1 || '',
                line2: contact.address?.line2 || '',
                city: contact.address?.city || contact.city || '',
                state: contact.address?.state || '',
                zip: contact.address?.zip || '',
                country: contact.address?.country || contact.country || ''
            }
        }));
        console.log("Recipients to create:", recipientsToCreate);

        const savedRecipients = await Recipient.insertMany(recipientsToCreate);

        // Update the list with the new recipient IDs and source
        const recipientRefs = savedRecipients.map(recipient => ({
            recipientId: recipient._id,
            addedAt: new Date()
        }));

        const newTotalRecipients = currentList.recipients.length + recipientRefs.length;

        const updatedList = await List.findByIdAndUpdate(
            id,
            {
                $push: { recipients: { $each: recipientRefs } },
                $set: {
                    'source.manual': source === 'manual',
                    'source.csv': source === 'csv',
                    'source.crm.type': source === 'crm' ? 'hubspot' : null,
                    'metrics.totalRecipients': newTotalRecipients,
                    'status': 'active'
                }
            },
            { new: true }
        );

        if (!updatedList) {
            return NextResponse.json(
                { success: false, error: "Failed to update list" },
                { status: 500 }
            );
        }

        // Fetch all recipients for the list to return
        const allRecipients = await Recipient.find({
            _id: { $in: updatedList.recipients.map(r => r.recipientId) }
        });

        return NextResponse.json({
            success: true,
            data: {
                savedRecipients: savedRecipients.length,
                list: updatedList,
                recipients: allRecipients
            }
        });
    } catch (error) {
        console.error("Error saving recipients:", error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : "Failed to save recipients"
            },
            { status: 500 }
        );
    }
}

export async function PUT(request: Request, context: any) {
    try {
        await dbConnect();

        const { id } = context.params;
        const { recipientId, contactData } = await request.json();

        if (!id || !recipientId) {
            return NextResponse.json(
                { success: false, error: "List ID and Recipient ID are required" },
                { status: 400 }
            );
        }

        // First check if the recipient exists in the list
        const list = await List.findById(id);
        if (!list) {
            return NextResponse.json(
                { success: false, error: "List not found" },
                { status: 404 }
            );
        }

        const recipientExists = list.recipients.some(r => r.recipientId.toString() === recipientId);
        if (!recipientExists) {
            return NextResponse.json(
                { success: false, error: "Recipient not found in this list" },
                { status: 404 }
            );
        }

        // Update the recipient
        const updatedRecipient = await Recipient.findByIdAndUpdate(
            recipientId,
            {
                $set: {
                    firstName: contactData.name.split(' ')[0],
                    lastName: contactData.name.split(' ').slice(1).join(' '),
                    mailId: contactData.email,
                    phoneNumber: contactData.phone,
                    companyName: contactData.company,
                    jobTitle: contactData.jobtitle,
                    linkedinUrl: contactData.linkedin,
                    address: {
                        line1: contactData.address?.line1 || '',
                        line2: contactData.address?.line2 || '',
                        city: contactData.address?.city || '',
                        state: contactData.address?.state || '',
                        zip: contactData.address?.zip || '',
                        country: contactData.address?.country || ''
                    }
                }
            },
            { new: true }
        );

        if (!updatedRecipient) {
            return NextResponse.json(
                { success: false, error: "Failed to update recipient" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            data: {
                recipient: updatedRecipient
            }
        });
    } catch (error) {
        console.error("Error updating recipient:", error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : "Failed to update recipient"
            },
            { status: 500 }
        );
    }
}

export async function DELETE(request: Request, context: any) {
    try {
        await dbConnect();

        const { id } = context.params;
        const { recipientIds } = await request.json();

        if (!id) {
            return NextResponse.json(
                { success: false, error: "List ID is required" },
                { status: 400 }
            );
        }

        if (!recipientIds || !Array.isArray(recipientIds) || recipientIds.length === 0) {
            return NextResponse.json(
                { success: false, error: "At least one recipient ID is required" },
                { status: 400 }
            );
        }

        // First get the current list
        const currentList = await List.findById(id);
        if (!currentList) {
            return NextResponse.json(
                { success: false, error: "List not found" },
                { status: 404 }
            );
        }

        // Remove the recipients from the list
        const updatedList = await List.findByIdAndUpdate(
            id,
            {
                $pull: { recipients: { recipientId: { $in: recipientIds } } },
                $set: {
                    'metrics.totalRecipients': currentList.recipients.length - recipientIds.length
                }
            },
            { new: true }
        );

        // Delete the recipients from the Recipients collection
        await Recipient.deleteMany({ _id: { $in: recipientIds } });

        // Fetch remaining recipients for the list
        const remainingRecipients = await Recipient.find({
            _id: { $in: updatedList.recipients.map(r => r.recipientId) }
        });

        return NextResponse.json({
            success: true,
            data: {
                list: updatedList,
                recipients: remainingRecipients,
                deletedCount: recipientIds.length
            }
        });
    } catch (error) {
        console.error("Error deleting recipients:", error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : "Failed to delete recipients"
            },
            { status: 500 }
        );
    }
}