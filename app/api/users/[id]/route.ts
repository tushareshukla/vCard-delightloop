import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/database/dbConnect";
import User from "@/models/User";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log("Fetching user details for ID:", params.id);
    await dbConnect();

    // Find user by ID
    const user = await User.findById(params.id).select("-password"); // Exclude password field

    if (!user) {
      console.log("User not found:", params.id);
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    console.log("User found:", {
      id: user._id,
      email: user.email,
      organization_id: user.organization_id,
    });

    // Return user data
    return NextResponse.json({
      success: true,
      data: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        organization_id: user.organization_id,
        role: user.role,
        isActive: user.isActive,
        linkedinCreds: {
          linkedinProfile: user.linkedinCreds.linkedinProfile,
          linkedinEmail: user.linkedinCreds.linkedinEmail,
          pfp: user.linkedinCreds.pfp,
          jobTitle: user.linkedinCreds.jobTitle,
          companyName: user.linkedinCreds.companyName,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch user",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log("Updating user details for ID:", params.id);
    await dbConnect();

    const body = await request.json();
    const { organization_id } = body;

    // Find user by ID
    const user = await User.findById(params.id);

    if (!user) {
      console.log("User not found:", params.id);
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Update organization_id if provided
    if (organization_id !== undefined) {
      user.organization_id = organization_id;
      await user.save();
      console.log("User organization_id updated:", {
        id: user._id,
        organization_id: user.organization_id,
      });
    }

    // Return updated user data
    return NextResponse.json({
      success: true,
      data: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        organization_id: user.organization_id,
        role: user.role,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update user",
      },
      { status: 500 }
    );
  }
}
