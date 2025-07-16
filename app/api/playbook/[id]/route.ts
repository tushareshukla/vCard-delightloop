import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import PlaybookRun from "@/models/PlaybookRun";
import Playbook from "@/models/Playbook";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    
    // First get the playbook run to find the playbook ID
    const playbookRun = await PlaybookRun.findById(params.id);
    if (!playbookRun) {
      return NextResponse.json(
        { error: "Playbook run not found" },
        { status: 404 }
      );
    }

    // Then get the playbook details
    const playbook = await Playbook.findById(playbookRun.playbook_id);
    if (!playbook) {
      return NextResponse.json(
        { error: "Playbook not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      playbook: {
        name: playbook.name,
        id: playbook._id
      }
    });
  } catch (error) {
    console.error("Error fetching playbook details:", error);
    return NextResponse.json(
      { error: "Failed to fetch playbook details" },
      { status: 500 }
    );
  }
} 