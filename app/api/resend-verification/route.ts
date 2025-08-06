import { NextResponse } from "next/server";
import dbConnect from "@/lib/database/dbConnect";
import User from "@/models/User";
import EmailVerificationToken from "@/models/EmailVerificationToken";
import crypto from "crypto";
import { config } from "@/utils/config";
import sgMail from "@sendgrid/mail";

export async function POST(request: Request) {
  try {
    await dbConnect();
    const { email } = await request.json();
    console.log("email", email);
    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json(
        { success: false, error: "No account found with that email. Try another or check for a typo." },
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
    const token = crypto.randomBytes(32).toString("hex");
    await EmailVerificationToken.create({
      userId: user._id,
      token,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    // Send verification email using SendGrid
    sgMail.setApiKey(process.env.SENDGRID_API_KEY || "");
    const verificationUrl = `${config.FRONTEND_URL}/auth/verify-email/${token}?email=${email}`;

    try {
      const msg = {
        to: email,
        from: "Delighto <delighto@mail.delightloop.ai>",
        subject: "Action Required: Verify Your Email to Manage Your Card",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Hi ${user.firstName},</h2>
            <p>To complete your setup and access your card management account, please click the link below to verify your email address:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" style="background-color: #7F56D9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Verify Your Email</a>
            </div>
            <p>This link will expire in 24 hours for security reasons.
              Once verified, you'll be able to effortlessly manage and update your digital card's information.
              If you didn't create an account, please ignore this email.</p>
            <p>Best regards,<br>Delighto Team</p>
          </div>
        `,
      };

      const response = await sgMail.send(msg);
      console.log(
        "Verification email sent successfully:",
        response[0].statusCode
      );
    } catch (emailError) {
      console.error("Error sending verification email:", emailError);
    }

    return NextResponse.json({
      success: true,
      message: "Verification email sent successfully",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to resend verification",
      },
      { status: 500 }
    );
  }
}
