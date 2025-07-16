import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/database/dbConnect";
import ShortUrl from "@/models/ShortUrl";

export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const shortCode = params.code;
    
    if (!shortCode) {
      return NextResponse.json(
        { error: "Short code is required" },
        { status: 400 }
      );
    }

    await dbConnect();

    // Find the short URL in the database
    const shortUrl = await ShortUrl.findOneAndUpdate(
      { shortCode },
      { $inc: { clicks: 1 } }, // Increment the click count
      { new: true }
    );

    if (!shortUrl) {
      return NextResponse.json(
        { error: "Short URL not found" },
        { status: 404 }
      );
    }

    // Return the long URL
    return NextResponse.json({ longUrl: shortUrl.longUrl });
  } catch (error) {
    console.error("Error resolving short URL:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 