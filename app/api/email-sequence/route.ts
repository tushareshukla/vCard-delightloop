import { NextResponse } from "next/server";
import { WorkflowAI } from "@workflowai/workflowai";

// Initialize WorkflowAI Client
const workflowAI = new WorkflowAI({
  key: process.env.WORKFLOWAI_API_KEY,
});

export interface OutreachSequenceDesignerInput {
  event_name?: string;
  event_type?: string;
  event_url?: string;
  event_description?: string;
  event_hosts?: string[];
  event_speakers?: string[];
  event_topics?: string[];
  agenda_summary?: string;
  outreach_outcome?: string;
  target_audience_description?: string[];
  email_sequence?: string[];
}

export interface OutreachSequenceDesignerOutput {
  email_content_sequence?: {
    sequence_step?: string;
    subject_line?: string;
    email_body?: string;
    personalization_strategy?: string;
    tone?: string;
  }[];
  recommended_follow_up?: {
    response_handling?: string;
    non_responder_strategy?: string;
  };
}

// Initialize Your AI agent
const outreachSequenceDesigner = workflowAI.agent<OutreachSequenceDesignerInput, OutreachSequenceDesignerOutput>({
  id: "outreach-sequence-designer",
  schemaId: 3,
  version: "production",
  useCache: "auto",
});

export async function POST(request: Request) {
  try {
    const input: OutreachSequenceDesignerInput = await request.json();

    const { output, data } = await outreachSequenceDesigner(input);

    return NextResponse.json({
      success: true,
      data: output,
      metadata: {
        model: data.version?.properties?.model,
        cost: data.cost_usd,
        latency: data.duration_seconds,
      },
    });
  } catch (error) {
    console.error("Failed to generate email sequence:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate email sequence",
      },
      { status: 500 }
    );
  }
} 