import { NextRequest, NextResponse } from "next/server";
import { validateUser } from "@/middleware/authMiddleware";

export async function GET(request: NextRequest) {
  try {
    // Use the auth middleware to validate user and get organization details
    const validation = await validateUser(request);
    console.log("Auth middleware validation result:", validation);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 401 }
      );
    }

    // Set organization_id cookie in the response
    const response = NextResponse.json({
      success: true,
      user: validation.user,
    });

    // Set the cookie with the organization_id from validation
    response.cookies.set(
      "organization_id",
      validation.user.organization_id.toString()
    );

    return response;
  } catch (error) {
    console.error("Error in auth validation:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to validate user",
      },
      { status: 500 }
    );
  }
}
