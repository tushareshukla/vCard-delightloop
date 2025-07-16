import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/database/dbConnect";
import List from "@/models/Lists";
import mongoose from "mongoose";
import Recipient from "@/models/Recipients";
import { validateUser } from "@/middleware/authMiddleware";

export async function GET() {
  try {
    await dbConnect();

    const lists = await List.find({})
      .sort({ createdAt: -1 })
      .select({
        name: 1,
        description: 1,
        source: 1,
        recipients: 1,
        tags: 1,
        metrics: 1,
        status: 1,
        usage: 1,
        createdAt: 1,
        updatedAt: 1
      });

    return NextResponse.json({ success: true, data: lists });
  } catch (error) {
    console.error("Error fetching lists:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch lists",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("Starting POST request processing");
    await dbConnect();

    // Validate user and get organization details
    const validation = await validateUser(request);
    
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 401 }
      );
    }
    // Check if the request is multipart/form-data
    const contentType = request.headers.get("content-type") || "";
    const isFormData = contentType.includes("multipart/form-data");

    let contacts = [];
    let listData = {};

    if (isFormData) {
      console.log("Processing form data request");
      const formData = await request.formData();
      const file = formData.get("file") as File;
      const listDataJson = formData.get("listData") as string;
      
      if (!file) {
        throw new Error("No file uploaded");
      }

      console.log("File received:", file.name);
      
      // Read file content
      const fileContent = await file.text();
      console.log("File content length:", fileContent.length);

      // Parse CSV content (assuming comma-separated values)
      const rows = fileContent.split("\n").map(row => row.trim());
      const headers = rows[0].split(",").map(header => header.trim().toLowerCase());

      contacts = rows.slice(1).map(row => {
        const values = row.split(",").map(value => value.trim());
        const contact = {};
        headers.forEach((header, index) => {
          contact[header] = values[index] || "";
        });
        return contact;
      });

      listData = JSON.parse(listDataJson);
      console.log("Parsed contacts count:", contacts.length);
    } else {
      // Handle regular JSON request
      const body = await request.json();
      contacts = body.contacts;
      listData = body;
      
      console.log("Received contacts data:", contacts);
    }

    if (!contacts || !Array.isArray(contacts) || contacts.length === 0) {
      throw new Error("No valid contacts data provided");
    }

    // Validate contact data
    contacts.forEach((contact, index) => {
      if (!contact || typeof contact !== 'object') {
        throw new Error(`Invalid contact data at index ${index}`);
      }
      console.log(`Contact ${index}:`, contact);
    });

    // Create recipients
    console.log("Creating recipients");
    const recipients = await Promise.all(
      contacts.map(async (contact, index) => {
        console.log(`Processing contact ${index}:`, contact);
        const recipient = await Recipient.create({
          firstName: contact.firstName || contact.firstname || "",
          lastName: contact.lastName || contact.lastname || "",
          mailId: contact.email || contact.mailId || "",
          phoneNumber: contact.phoneNumber || contact.phone || "",
          companyName: contact.company || contact.companyName || "",
          jobTitle: contact.jobTitle || contact.jobtitle || "",
          linkedinUrl: contact.linkedinUrl || contact.linkedin || contact.hs_linkedin_url || "",
          notes: contact.notes || "",
          campaignId: new mongoose.Types.ObjectId('000000000000000000000000'),
          address:{
            line1: contact.address.line1 || "",
            line2: contact.address.line2 || "",
            city: contact.address.city || "",
            state: contact.address.state || "",
            zip: contact.address.zip || "",
            country: contact.address.country || ""
          }
        });
        console.log("Created recipient:", recipient._id, recipient.firstName);
        return recipient;
      })
    );

    console.log("All recipients created:", recipients.map(r => r._id));

    const { user } = validation;   

    // Create list with all recipients
    const list = await List.create({
      organizationId: user.organization_id,
      creatorId: user.id,
      name: listData.name,
      description: listData.description || "",
      source: {
        manual: !isFormData,
        csv: isFormData,
        crm: {
          type: null
        }
      },
      recipients: recipients.map(recipient => {
        console.log("Adding recipient to list:", recipient._id);
        return {
          recipientId: recipient._id,
          addedAt: new Date()
        };
      }),
      tags: listData.tags || [],
      metrics: {
        totalRecipients: recipients.length,
        campaignsUsed: 0,
        playbooksUsed: 0
      },
      status: "active",
      usage: {
        campaignIds: [],
        playbookIds: []
      }
    });

    console.log("List created with recipients:", list.recipients);
    return NextResponse.json({ success: true, data: list });
  } catch (error) {
    console.error("Error creating list:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create list",
      },
      { status: 500 }
    );
  }
}