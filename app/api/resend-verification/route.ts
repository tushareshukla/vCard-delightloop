import { NextResponse } from "next/server";
import dbConnect from "@/lib/database/dbConnect";
import User from "@/models/User";
import EmailVerificationToken from "@/models/EmailVerificationToken";
import crypto from "crypto";
import { config } from "@/utils/config";


export async function POST(request: Request) {
  try {
    await dbConnect();
    const { email } = await request.json();
    console.log("email", email);
    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Check if email is already verified
    if (user.emailVerified) {
      return NextResponse.json(
        { success: false, error: "Email is already verified" },
        { status: 400 }
      );
    }

    // Delete any existing tokens
    await EmailVerificationToken.deleteMany({ userId: user._id });

    // Create new token
    const token = crypto.randomBytes(32).toString('hex');
    await EmailVerificationToken.create({
      userId: user._id,
      token,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    });

    // Send verification email
    const verificationUrl = `${config.BACKEND_URL}/auth/verify-email/${token}`;
    await fetch(`${config.BACKEND_URL}/api/email/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: email,
        subject: "Welcome to Delightloop – Let's Start Creating Meaningful Connections!",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="text-align: center; margin-bottom: 30px;">
              <img src="${process.env.NEXT_PUBLIC_APP_URL}/img/favicon-logo.png" alt="DelightLoop Logo" style="max-width: 200px; height: auto;" />
            </div>

            <h2>Hi ${user.firstName},</h2>

            <p>Welcome aboard! 🎉 We're excited to have you on DelightLoop.</p>

            <p>With Delightloop, you can:</p>
            <ul style="list-style: none; padding-left: 0;">
              <li>✅ Send thoughtful gifts effortlessly to build strong relationships.</li>
              <li>✅ Boost engagement and customer retention.</li>
              <li>✅ Track campaign impact with real-time insights.</li>
            </ul>

            <p>To get started, please verify your email by clicking the button below:</p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" style="background-color: #7F56D9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Verify Email</a>
            </div>

            <p>After verification, you can start exploring Delightloop. If you need any help, our team is here for you!</p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="https://app.delightloop.ai/" style="background-color: #7F56D9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Start Gifting Now</a>
            </div>

            <p>Cheers,<br>The DelightLoop Team</p>
          </div>
        `
      })
    });

    return NextResponse.json({
      success: true,
      message: "Verification email sent successfully"
    });

  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to resend verification"
      },
      { status: 500 }
    );
  }
}
