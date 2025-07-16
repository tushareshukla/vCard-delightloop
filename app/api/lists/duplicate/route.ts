import { NextResponse } from "next/server";
import dbConnect from "@/lib/database/dbConnect";
import List from "@/models/Lists";
import mongoose from "mongoose";

export async function POST(req: Request) {
  try {
    await dbConnect();

    const { sourceListId, newName } = await req.json();

    if (!sourceListId || !newName) {
      return NextResponse.json(
        { success: false, error: "Source list ID and new name are required" },
        { status: 400 }
      );
    }

    // Get the source list
    const sourceList = await List.findById(sourceListId);
    if (!sourceList) {
      return NextResponse.json(
        { success: false, error: "Source list not found" },
        { status: 404 }
      );
    }

    // Check if a list with the same name already exists for this organization
    const existingList = await List.findOne({
      name: newName,
      organizationId: sourceList.organizationId,
      status: { $ne: "deleted" } // Exclude deleted lists
    });

    if (existingList) {
      return NextResponse.json(
        { success: false, error: "A list with this name already exists in your organization" },
        { status: 400 }
      );
    }

    // Create new list with same data but new name
    const duplicatedList = await List.create({
      organizationId: sourceList.organizationId,
      creatorId: sourceList.creatorId,
      name: newName,
      description: sourceList.description,
      source: sourceList.source,
      recipients: sourceList.recipients,
      tags: sourceList.tags,
      metrics: sourceList.metrics,
      status: "active",
      usage: {
        campaignIds: [],
        playbookIds: []
      }
    });

    return NextResponse.json({ 
      success: true, 
      data: duplicatedList,
      message: "List duplicated successfully" 
    });

  } catch (error) {
    console.error("Error duplicating list:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to duplicate list"
      },
      { status: 500 }
    );
  }
} 