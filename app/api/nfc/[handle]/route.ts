import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ handle: string }> }
) {
  try {
    console.log("API route hit for NFC profile - redirecting to VCard backend");

    const { handle } = await params;
    console.log("Handle received:", handle);

    if (!handle) {
      return NextResponse.json(
        { error: "Handle is required" },
        { status: 400 }
      );
    }

    // Redirect to VCard backend API
    const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    const vCardResponse = await fetch(`${backendUrl}/v1/vcard/handle/${encodeURIComponent(handle)}`);

    if (!vCardResponse.ok) {
      if (vCardResponse.status === 404) {
        return NextResponse.json({ error: "Profile not found" }, { status: 404 });
      }
      throw new Error(`VCard API error: ${vCardResponse.status}`);
    }

    const vCardData = await vCardResponse.json();
    
    // Return the VCard data from backend
    if (vCardData.success) {
      return NextResponse.json(vCardData.data);
    } else {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

  } catch (error) {
    console.error("Error fetching profile by handle:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
