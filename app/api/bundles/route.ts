import { NextResponse } from "next/server";
import dbConnect from "@/lib/database/dbConnect";
import Bundle from "@/models/Bundles";

export async function GET() {
  try {
    await dbConnect();
    console.log("Fetching bundles...");

    const bundles = await Bundle.find({}).select({
      _id: 1,
      bundleName: 1,
      imgUrl: 1,
      description: 1,
      giftsList: 1,
      isAvailable: 1,
    });

    console.log("Found bundles:", bundles);
    console.log("Number of bundles:", bundles.length);
    console.log(
      "Bundle names:",
      bundles.map((b) => b.bundleName)
    );

    return NextResponse.json({ bundles }, { status: 200 });
  } catch (error) {
    console.error("Error in /api/bundles:", error);
    return NextResponse.json(
      { error: "Failed to fetch bundles" },
      { status: 500 }
    );
  }
}
