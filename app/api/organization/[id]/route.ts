import { NextResponse } from "next/server";
import dbConnect from "@/lib/database/dbConnect";
import Organization from "@/models/Organization";
import mongoose from "mongoose";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    console.log('[Organization API] Fetching organization with ID:', params.id);

    // Validate if the ID is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      console.error('[Organization API] Invalid organization ID format');
      return NextResponse.json(
        { success: false, error: "Invalid organization ID format" },
        { status: 400 }
      );
    }

    // Find organization by ID
    const organization = await Organization.findOne({
      _id: params.id,
    //   isDeleted: false,
    });

    console.log('[Organization API] Found organization:', organization);

    if (!organization) {
      console.error('[Organization API] Organization not found');
      return NextResponse.json(
        { success: false, error: "Organization not found" },
        { status: 404 }
      );
    }

    // Return organization data
    return NextResponse.json({
      success: true,
      data: {
        _id: organization._id,
        name: organization.name,
        domain: organization.domain,
        branding: organization.branding,
        status: organization.status,
        createdAt: organization.createdAt,
        updatedAt: organization.updatedAt
      }
    });

  } catch (error) {
    console.error("[Organization API] Error fetching organization:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch organization"
      },
      { status: 500 }
    );
  }
}
