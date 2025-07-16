// app/api/partner/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Partner from "@/models/Partner";
import { getServerSession } from "next-auth/next";


export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Connect to database
    await dbConnect();

    // Optional: Check authentication



    // Get partner ID from params
    const { id } = params;

    // Validate ID format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return NextResponse.json(
        { error: "Invalid partner ID format" },
        { status: 400 }
      );
    }

    // Find partner
    const partner = await Partner.findById(id);

    // Check if partner exists
    if (!partner) {
      return NextResponse.json(
        { error: "Partner not found" },
        { status: 404 }
      );
    }

    // Return partner data
    return NextResponse.json({
      success: true,
      data: partner
    });

  } catch (error) {
    console.error("Error fetching partner:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Optional: Add PUT endpoint to update partner
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();



    const { id } = params;
    const body = await request.json();

    // Validate ID format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return NextResponse.json(
        { error: "Invalid partner ID format" },
        { status: 400 }
      );
    }

    // Update partner
    const updatedPartner = await Partner.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, runValidators: true }
    );

    if (!updatedPartner) {
      return NextResponse.json(
        { error: "Partner not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedPartner
    });

  } catch (error) {
    console.error("Error updating partner:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Optional: Add DELETE endpoint
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    const { id } = params;

    // Validate ID format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return NextResponse.json(
        { error: "Invalid partner ID format" },
        { status: 400 }
      );
    }

    const deletedPartner = await Partner.findByIdAndDelete(id);

    if (!deletedPartner) {
      return NextResponse.json(
        { error: "Partner not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Partner deleted successfully"
    });

  } catch (error) {
    console.error("Error deleting partner:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
