import { NextResponse } from "next/server";
import Playbook from "@/models/Playbook";
import dbConnect from "@/lib/dbConnect";
import { getUserFromCookie } from "@/utils/getUserFromCookie";

// POST /api/playbooks - Create initial playbook
export async function POST(req: Request) {
  try {
    const body = await req.json();
    await dbConnect();

    const userData = getUserFromCookie();
    if (!userData?.userId) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }

    console.log("Creating playbook with data:", {
      ...body,
      hyper_personalization: true // Force to true
    });

    // Create initial playbook with only required fields
    const playbook = await Playbook.create({
      name: body.name,
      description: body.description,
      organization_id: body.organization_id,
      user_id: userData.userId,
      status: "Draft",
      // Initialize values
      budget: body.budget || null,
      bundleIds: [],
      sending_mode: body.sending_mode || "permission_based",
      hyper_personalization: true, // Always set to true regardless of input
      template: null
    } as any); // Type assertion needed for mongoose

    console.log("Created playbook:", {
      id: playbook._id,
      hyper_personalization: playbook.hyper_personalization,
      budget: playbook.budget,
      sending_mode: playbook.sending_mode
    });

    return NextResponse.json({ playbook }, { status: 201 });
  } catch (error) {
    console.error("Error creating playbook:", error);
    return NextResponse.json(
      { error: "Failed to create playbook" },
      { status: 500 }
    );
  }
} 