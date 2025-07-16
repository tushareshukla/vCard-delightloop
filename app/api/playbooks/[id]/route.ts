import { NextResponse } from "next/server";
import mongoose from "mongoose";
import Playbook from "@/models/Playbook";
import dbConnect from "@/lib/database/dbConnect";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const id = params.id;
    console.log("GET - Fetching playbook with ID:", id);

    const playbook = await Playbook.findById(id);

    console.log("GET - Found playbook:", {
      id: playbook?._id,
      budget: playbook?.budget,
      hyper_personalization: playbook?.hyper_personalization,
      sending_mode: playbook?.sending_mode
    });

    if (!playbook) {
      return NextResponse.json(
        { error: "Playbook not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ playbook });
  } catch (error) {
    console.error("Error fetching playbook:", error);
    return NextResponse.json(
      { error: "Failed to fetch playbook" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    await dbConnect();
    const id = await params.id;
    console.log("PUT - Updating playbook with ID:", id);
    console.log("PUT - Update data:", {
      ...body,
      hyper_personalization_type: typeof body.hyper_personalization,
      hyper_personalization_value: body.hyper_personalization
    });

    // Ensure id is valid
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid playbook ID" },
        { status: 400 }
      );
    }

    // Convert budget from object to number if needed
    if (body.budget && typeof body.budget === 'object' && 'max' in body.budget) {
      body.budget = body.budget.max;
    }

    // Ensure hyper_personalization is a boolean
    body.hyper_personalization = Boolean(body.hyper_personalization);

    console.log("PUT - Processed update data:", {
      ...body,
      hyper_personalization_type: typeof body.hyper_personalization,
      hyper_personalization_value: body.hyper_personalization
    });

    const playbook = await Playbook.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(id)
      },
      { $set: body },
      { new: true }
    ).exec();

    console.log("PUT - Updated playbook:", {
      id: playbook?._id,
      budget: playbook?.budget,
      hyper_personalization: playbook?.hyper_personalization,
      hyper_personalization_type: typeof playbook?.hyper_personalization,
      sending_mode: playbook?.sending_mode
    });

    if (!playbook) {
      return NextResponse.json(
        { error: "Playbook not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ playbook });
  } catch (error) {
    console.error("Error updating playbook:", error);
    return NextResponse.json(
      { error: "Failed to update playbook" },
      { status: 500 }
    );
  }
} 