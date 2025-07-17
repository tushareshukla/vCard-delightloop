import { NextResponse } from "next/server";
import dbConnect from "@/lib/database/dbConnect";
import Organization from "@/models/Organization";

export async function GET() {
  try {
    await dbConnect();

    // Try to find the first active organization
    let organization = await Organization.findOne({ isActive: true, isDeleted: false });

    // If no organization exists, create a default one
    if (!organization) {
      organization = await Organization.create({
        name: "Default Organization",
        domain: "default.com",
        isActive: true,
        isDeleted: false
      });
    }

    return NextResponse.json({
      success: true,
      organization: {
        id: organization._id,
        name: organization.name,
        domain: organization.domain
      }
    });
  } catch (error) {
    console.error("Error handling organization:", error);
    return NextResponse.json(
      { error: "Failed to handle organization" },
      { status: 500 }
    );
  }
} 