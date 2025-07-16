import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/database/dbConnect";
import ShortUrl from "@/models/ShortUrl";
import crypto from "crypto";

// Function to generate a random short code
function generateShortCode(length = 6) {
  // Use a mix of alphanumeric characters, excluding similar-looking ones
  const chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz";
  let result = "";
  const randomBytes = crypto.randomBytes(length);
  
  for (let i = 0; i < length; i++) {
    result += chars[randomBytes[i] % chars.length];
  }
  
  return result;
}

export async function POST(request: NextRequest) {
  try {
    const { longUrl } = await request.json();
    
    if (!longUrl) {
      return NextResponse.json(
        { error: "Long URL is required" },
        { status: 400 }
      );
    }

    await dbConnect();

    // Check if this long URL already has a short code
    let shortUrl = await ShortUrl.findOne({ longUrl });
    
    // If not, create a new short code
    if (!shortUrl) {
      let shortCode;
      let isUnique = false;
      
      // Keep generating short codes until we find a unique one
      while (!isUnique) {
        shortCode = generateShortCode();
        const existingUrl = await ShortUrl.findOne({ shortCode });
        if (!existingUrl) {
          isUnique = true;
        }
      }
      
      // Create the new short URL
      shortUrl = await ShortUrl.create({
        shortCode,
        longUrl,
      });
    }

    // Construct the full short URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://sandbox-app.delightloop.ai";
    const fullShortUrl = `${baseUrl}/s/${shortUrl.shortCode}`;
    
    return NextResponse.json({
      shortCode: shortUrl.shortCode,
      shortUrl: fullShortUrl,
      longUrl: shortUrl.longUrl,
    });
  } catch (error) {
    console.error("Error creating short URL:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 