export const runtime = "nodejs";

import { NextResponse } from "next/server";
import dbConnect from "@/lib/database/dbConnect";
import User from "@/models/User";
import Organization from "@/models/Organization";
import EmailVerificationToken from "@/models/EmailVerificationToken";
import bcrypt from "bcryptjs";
import crypto from "crypto";
// import { getUnipileAccountAddLink } from "@/services/unipileService";
import sgMail from "@sendgrid/mail";
import PublicDomain from "@/models/PublicDomain";
import VCard, { IVCard } from "@/models/VCard";
import mongoose from "mongoose";
import { config } from "@/utils/config";

// Initialize SendGrid with API key

export async function POST(request: Request) {
sgMail.setApiKey(process.env.SENDGRID_API_KEY || "");

  try {
    const referer =
      request.headers.get("referer") || request.headers.get("referrer");
    console.log(`Request came from: ${referer}`);

    await dbConnect();
    const {
      firstName,
      lastName,
      email,
      password,
      quicksend,
      user_id,
      gift_id,
      vcr,
    } = await request.json();

    // Convert email to lowercase
    const normalizedEmail = email.toLowerCase();

    const emailDomain = getDomainFromEmail(email);
    const searchedDomain = await PublicDomain.findOne({ name: emailDomain });
    if (vcr === null && searchedDomain) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Please use your work email to sign up. This helps us connect you to your company's workspace",
        },
        { status: 400 }
      );
    }
    // Check if user exists with normalized email
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "Email already registered" },
        { status: 400 }
      );
    }

    // Extract domain from normalized email
    const domain = normalizedEmail.split("@")[1].toUpperCase();

    // Find or create organization based on domain
    let organization = await Organization.findOne({ domain });

    if (!organization) {
      // Create new organization if it doesn't exist
      organization = await Organization.create({
        name: domain.split(".")[0], // Use first part of domain as org name
        domain: domain,
        branding: {
          logo_url: "",
        },
        status: "active",
        //isActive: true
      });
      console.log("Created new organization:", organization);
    }

    // Check for VCard referral parameters
    let referredVCard: IVCard | null = null;
    let referringVCard: IVCard | null = null;
    if (referer) {
      const refererUrl = new URL(referer);
      const vcr = refererUrl.searchParams.get("vcr");
      const vid = refererUrl.searchParams.get("vid");
      console.log(`vcr: ${vcr}, vid: ${vid}`);

      if (vcr && vid) {
        try {
          // Search VCard collection for matching key (vcr) and secret (vid)
          referredVCard = await VCard.findOne({
            key: vcr,
            secret: vid,
            isDeleted: false,
            isActive: true,
          });

          if (referredVCard) {
            console.log("Found matching VCard:", referredVCard._id);
          } else {
            console.log("No matching VCard found for vcr/vid");
          }
        } catch (error) {
          console.error("Error searching for VCard:", error);
        }
      } else if (vcr) {
        try {
          // When only vcr is present, find the VCard with matching key
          referringVCard = await VCard.findOne({
            key: vcr,
            isDeleted: false,
            isActive: true,
          });

          if (referringVCard) {
            console.log("Found referring VCard:", referringVCard._id);
          } else {
            console.log("No matching VCard found for vcr");
          }
        } catch (error) {
          console.error("Error searching for referring VCard:", error);
        }
      }
    }

    // Log password hashing
    console.log("Registration password:", {
      originalPassword: password,
    });

    // Create user with hashed password and organization ID
    const hashedPassword = await bcrypt.hash(password, 10);

    console.log("Hashed password:", {
      hashedResult: hashedPassword,
    });

    const user = await User.create({
      firstName,
      lastName,
      email: normalizedEmail,
      password: hashedPassword,
      organization_id: organization._id,
      roles: ["campaign_manager"],
      role: "campaign_manager",
      status : "verified"
    });

    if (user) {
      // try {
      //   const date = new Date();
      //   date.setDate(date.getDate() + 1);
      //   if (user._id) {
      //     const unipileResponse = await getUnipileAccountAddLink(
      //       user._id.toString(),
      //       date.toISOString()
      //     );
      //     if (unipileResponse !== null) {
      //       if (unipileResponse.status === 201) {
      //         userToUpdate.unipile.add_email_link = unipileResponse.data.url;
      //         unipileRegisterlink = unipileResponse.data.url;
      //       }
      //     }
      //   }

      //   userToUpdate.save();
      // } catch (error) {
      //   console.log(error);
      // }
      //startfor unipile email register link get
    }

    // Associate user with referring VCard if found and not already assigned
    if (referredVCard && !referredVCard.userId) {
      try {
        await VCard.findByIdAndUpdate(
          referredVCard._id,
          {
            userId: user._id,
          },
          { new: true }
        );
        console.log(
          `Successfully associated user ${user._id} with VCard ${referredVCard._id}`
        );
      } catch (error) {
        console.error("Error associating user with VCard:", error);
      }
    } else if (referredVCard && referredVCard.userId) {
      console.log(
        `VCard ${referredVCard._id} already has userId ${referredVCard.userId}, skipping association`
      );
    }

    // Create new VCard for the user when referred by vcr parameter only
    if (referringVCard) {
      try {
        const newVCard = await VCard.create({
          handle: user.firstName + Math.random().toString(36).substring(2, 7),
          userId: new mongoose.Types.ObjectId(user._id),
          fullName: `${user.firstName} ${user.lastName}`,
          referredByVcardId: new mongoose.Types.ObjectId(referringVCard._id),
          nfcEnabled: true,
        });
        console.log(
          `Successfully created new VCard ${newVCard._id} for user ${user._id} with referral from VCard ${referringVCard._id}`
        );
      } catch (error) {
        console.error("Error creating new VCard for user:", error);
      }
    }

    // Verify the stored password hash
    //const storedUser = await User.findById(user._id);
    //
    //console.log('Stored user password:', {
    //  storedHash: storedUser.password
    //});

    // Create verification token
    const token = crypto.randomBytes(32).toString("hex");
    await EmailVerificationToken.create({
      userId: user._id,
      token,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    });

    // Send verification email using SendGrid directly

let verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify-email/${token}`;
    const urlParams = new URLSearchParams();

    if (quicksend && user_id && gift_id) {
      urlParams.append("quicksend", "true");
      urlParams.append("user_id", user_id);
      urlParams.append("gift_id", gift_id);
    }

    // Add vcr parameter - true if vcr exists, false otherwise
    if (vcr) {
      urlParams.append("vcr", vcr);
      urlParams.append("vcardsignupuser", "true");
    }

    // Append parameters to URL if any exist
    if (urlParams.toString()) {
      verificationUrl += `?${urlParams.toString()}`;
    }

    try {



       const msg = {
          to: email,
          from: "VCard Success <vcard@mail.delightloop.ai>",
          subject: "Action Required: Verify Your Email to Manage Your Card",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Hi ${firstName},</h2>
              <p>To complete your setup and access your card management account, please click the link below to verify your email address::</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${verificationUrl}" style="background-color: #7F56D9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Verify Your Email</a>
              </div>
              <p>This link will expire in 24 hours for security reasons.
                Once verified, you'll be able to effortlessly manage and update your digital card's information.
                If you didn't create an account, please ignore this email.</p>
              <p>Best regards,<br>DelightLoop VCard Team</p>
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
      message:
        "Registration successful. Please check your email to verify your account.",
      data: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        organization_id: organization._id,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to register",
      },
      { status: 500 }
    );
  }
}

const getDomainFromEmail = (email: string): string | null => {
  if (!email || typeof email !== "string") {
    return null;
  }

  const emailRegex = /^[^\s@]+@([^\s@]+)$/;
  const match = email.match(emailRegex);

  if (!match) {
    return null;
  }

  return match[1].toLowerCase();
};
