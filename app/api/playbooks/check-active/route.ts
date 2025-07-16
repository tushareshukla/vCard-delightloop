import { NextResponse } from "next/server";
import Playbook from "@/models/Playbook";
import User from "@/models/User";
import dbConnect from "@/lib/dbConnect";
import { getUserFromRequestCookie } from "@/utils/getUserFromCookie";
import mongoose from "mongoose";

export async function GET(req: Request) {
  try {
    console.log("1. Starting /api/playbooks/check-active request");
    
    const userData = getUserFromRequestCookie(req);
    console.log("2. User data from cookie:", {
      userId: userData?.userId,
      cookies: req.headers.get('cookie')
    });

    if (!userData?.userId) {
      console.log("3A. No user data found in cookie");
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }

    console.log("3B. Connecting to database...");
    await dbConnect();
    console.log("4. Database connected");

    const userId = new mongoose.Types.ObjectId(userData.userId);
    console.log("5. Created ObjectId:", userId.toString());

    // Get user details directly from the database
    console.log("6. Querying user from database...");
    const user = await User.findById(userId).lean().exec();
    console.log("7. User query result:", {
      found: !!user,
      userId: user?._id?.toString(),
      orgId: user?.organization_id?.toString()
    });

    if (!user) {
      console.log("8A. User not found in database");
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Find active playbooks for the organization
    console.log("8B. Querying active playbook...");
    const activePlaybook = await Playbook.findOne({
      organization_id: user.organization_id,
      status: "Active"
    }).lean().exec();

    console.log("9. Active playbook query result:", {
      found: !!activePlaybook,
      playbookId: activePlaybook?._id?.toString()
    });

    return NextResponse.json({
      hasActivePlaybook: !!activePlaybook,
      playbook: activePlaybook
    });
  } catch (error) {
    // Detailed error logging
    console.error("❌ Error in /api/playbooks/check-active:", {
      error_message: error instanceof Error ? error.message : "Unknown error",
      error_name: error instanceof Error ? error.name : "Unknown",
      error_stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json(
      { error: "Failed to check active playbooks" },
      { status: 500 }
    );
  }
} 