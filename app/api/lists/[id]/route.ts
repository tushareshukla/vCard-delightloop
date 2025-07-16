import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/database/dbConnect";
import List from "@/models/Lists";
import { validateUser } from "@/middleware/authMiddleware";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Fetch list with organization validation
    const list = await List.findOne({
      _id: params.id,
      organizationId: user.organization_id
    });

    if (!list) {
      return NextResponse.json(
        { success: false, error: "List not found or unauthorized" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: list });
  } catch (error) {
    console.error("Error fetching list:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch list"
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, context: any) {
    try {
        await dbConnect();

        // Get validation user info
        const validation = await validateUser(request);
        
        if (!validation.success) {
            return NextResponse.json(
                { success: false, error: validation.error },
                { status: 401 }
            );
        }

        const { user } = validation;
        const { id } = context.params;
        const body = await request.json();

        if (!id) {
            return NextResponse.json(
                { success: false, error: "List ID is required" },
                { status: 400 }
            );
        }

        // Check if we're updating name, status, or tags
        if (!body.name && !body.status && !body.tags) {
            return NextResponse.json(
                { success: false, error: "Either name, status, or tags is required" },
                { status: 400 }
            );
        }

        // If renaming, check if a list with the new name already exists in this organization
        if (body.name) {
            const existingList = await List.findOne({
                name: body.name,
                organizationId: user.organization_id,
                _id: { $ne: id }, // Exclude current list
                status: { $ne: "deleted" } // Exclude deleted lists
            });

            if (existingList) {
                return NextResponse.json(
                    { success: false, error: "A list with this name already exists in your organization" },
                    { status: 400 }
                );
            }
        }

        // Create update object based on what's being updated
        const updateObj = {};
        if (body.name) updateObj['name'] = body.name;
        if (body.status) updateObj['status'] = body.status;
        if (body.tags) updateObj['tags'] = body.tags;

        const updatedList = await List.findByIdAndUpdate(
            id,
            { $set: updateObj },
            { new: true }
        ).select({
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

        if (!updatedList) {
            return NextResponse.json(
                { success: false, error: "List not found" },
                { status: 404 }
            );
        }

        let successMessage = "List updated successfully";
        if (body.status) successMessage = "List status updated successfully";
        if (body.name) successMessage = "List name updated successfully";
        if (body.tags) successMessage = "List tags updated successfully";

        return NextResponse.json({ 
            success: true, 
            data: updatedList,
            message: successMessage
        });
    } catch (error) {
        console.error("Error updating list:", error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : "Failed to update list"
            },
            { status: 500 }
        );
    }
} 