import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/database/dbConnect";
import Playbook from "@/models/Playbook";
import mongoose from "mongoose";
import { getUserFromRequestCookie } from "@/utils/getUserFromCookie";

export async function POST(req: Request) {
  try {
    const userData = getUserFromRequestCookie(req);
    if (!userData?.userId) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }

    const {
      name,
      description,
      budget,
      sending_mode,
      organization_id,
      template,
      cta_link,
    } = await req.json();

    await dbConnect();

    const playbook = await Playbook.create({
      name,
      description,
      budget,
      sending_mode,
      user_id: new mongoose.Types.ObjectId(userData.userId),
      organization_id: new mongoose.Types.ObjectId(organization_id),
      template,
      cta_link,
    });

    return NextResponse.json({
      success: true,
      playbook,
    });
  } catch (error) {
    console.error("Error creating playbook:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create playbook",
      },
      { status: 500 }
    );
  }
}
