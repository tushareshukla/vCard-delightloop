import { NextResponse } from "next/server";
import dbConnect from "@/lib/database/dbConnect";
import EmailVerificationToken from "@/models/EmailVerificationToken";
import User from "@/models/User";

export async function GET(
  request: Request,
  context: { params: Promise<{ token: string }> }
) {
  try {
    await dbConnect();
    const { token } = await context.params;

    const verificationTokenExists = await EmailVerificationToken.findOne({
      token,
    });

    if (!verificationTokenExists) {
      return NextResponse.json(
        {
          success: false,
          error:
            "This link is no longer valid. You may have already verified your email or the link may have expired.",
        },
        { status: 400 }
      );
    }

    const verificationToken = await EmailVerificationToken.findOne({
      token,
      expiresAt: { $gt: new Date() },
    });

    if (!verificationToken) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid or expired verification link",
          resend: true,
          userId: verificationTokenExists.userId,
        },
        { status: 400 }
      );
    }

    // Update user
    await User.findByIdAndUpdate(verificationToken.userId, {
      emailVerified: true,
      isActive: true,
    });

    // Delete the token
    await EmailVerificationToken.deleteOne({ _id: verificationToken._id });

    return NextResponse.json({
      success: true,
      message: "Email verified successfully",
      userId: verificationToken.userId,
    });
  } catch (error) {
    console.error("Verification error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to verify email" },
      { status: 500 }
    );
  }
}
