import { NextResponse } from "next/server";
import dbConnect from "@/lib/database/dbConnect";
import Wallet from "@/models/wallet";
import mongoose from "mongoose";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ organizationId: string }> }
) {
  try {
    await dbConnect();

    // Get the userId from the query parameters
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Await the params before using
    const { organizationId } = await params;

    // Find wallet for specific organization AND user
    const wallet = await Wallet.findOne({
      organization_id: new mongoose.Types.ObjectId(organizationId),
      user_id: new mongoose.Types.ObjectId(userId),
    });

    if (!wallet) {
      return NextResponse.json({
        message: "No wallet found for this user",
        wallet: null,
      });
    }

    return NextResponse.json({
      wallet,
      userId: userId, // Return userId for verification
    });
  } catch (error) {
    console.error("Error fetching wallet:", error);
    return NextResponse.json(
      { error: "Failed to fetch wallet" },
      { status: 500 }
    );
  }
}
