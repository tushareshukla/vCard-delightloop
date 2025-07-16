import { NextResponse, NextRequest } from "next/server";
import dbConnect from "@/lib/database/dbConnect";
import List from "@/models/Lists";
import mongoose from "mongoose";
import { validateUser } from "@/middleware/authMiddleware";

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    // Validate user and get organization details
    const validation = await validateUser(request);
    
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 401 }
      );
    }

    const { user } = validation;

    // Fetch lists for the user's organization
    const lists = await List.find({ 
      organizationId: user.organization_id,
      status: { $ne: 'deleted' } 
    }).sort({ createdAt: -1 });

    return NextResponse.json({ success: true, data: lists });
  } catch (error) {
    console.error("Error fetching lists:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch lists"
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    // Validate user and get organization details
    const validation = await validateUser(request);
    
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 401 }
      );
    }

    const { user } = validation;
    const body = await request.json();

    // Check if a list with the same name already exists for this organization
    const existingList = await List.findOne({
      name: body.name,
      organizationId: user.organization_id
    });

    if (existingList) {
      return NextResponse.json(
        { success: false, error: "A list with this name already exists in your organization" },
        { status: 400 }
      );
    }

    const list = await List.create({
      
      name: body.name,
      description: body.description || "",
      source: {
        manual: false,
        csv: false,
        crm: {
          type: null
        }
      },
      recipients: [],
      tags: body.tags || [],
      metrics: {
        totalRecipients: 0,
        campaignsUsed: 0,
        playbooksUsed: 0
      },
      status: "active",
      usage: {
        campaignIds: [],
        playbookIds: []
      },
      organizationId: user.organization_id,
      creatorId: user.id
    });

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