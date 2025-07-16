"use client";

import { ProfileData } from "../types/vcard.types";
import { createVCard } from "../utils/vcard.utils";
import {
  EmailValidationResult,
  EmailPayload,
  EmailAttachment,
} from "../components/ContactModal/ContactModal.types";

export class EmailService {
  /**
   * Validate email address using Abstract API
   */
  static async validateEmail(email: string): Promise<EmailValidationResult> {
    try {
      const response = await fetch(
        `https://emailvalidation.abstractapi.com/v1/?api_key=${process.env.NEXT_PUBLIC_ABSTRACT_EMAIL_VERIFICATION_API_KEY}&email=${email}`
      );

      if (!response.ok) {
        throw new Error("Failed to validate email");
      }

      return await response.json();
    } catch (error) {
      console.error("Email validation error:", error);
      throw new Error("Email validation service unavailable");
    }
  }

  /**
   * Check if email is valid and deliverable
   */
  static isEmailValid(validationResult: EmailValidationResult): boolean {
    return (
      validationResult.is_valid_format?.value === true &&
      validationResult.deliverability !== "UNDELIVERABLE"
    );
  }

  /**
   * Generate email HTML content
   */
  static generateEmailHTML(profile: ProfileData): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${profile.fullName}'s Contact Info</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f5f5f5;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 40px 20px; text-align: center; font-family: Arial, sans-serif;">
          <!-- Company Logo -->
          <div style="margin-bottom: 40px;">
            <img src="https://sandbox-app.delightloop.ai/Logo Final.png" alt="DelightLoop" style="width: 120px; height: auto;" />
          </div>

          <!-- Profile Image -->
          ${
            profile.avatarUrl
              ? `
            <div style="margin-bottom: 24px;">
              <img src="${profile.avatarUrl}" alt="${profile.fullName}"
                style="width: 120px; height: 120px; border-radius: 60px; object-fit: cover; background-color: #f8f8f8;" />
            </div>
          `
              : ""
          }

          <!-- Profile Info -->
          <h2 style="margin: 0 0 8px 0; color: #333333; font-size: 24px; font-weight: 600;">${
            profile.fullName
          }</h2>
          ${
            profile.title
              ? `<p style="margin: 0 0 4px 0; color: #666666; font-size: 16px;">${profile.title}</p>`
              : ""
          }
          ${
            profile.company
              ? `<p style="margin: 0; color: #666666; font-size: 16px;">${profile.company}</p>`
              : ""
          }

          <!-- Main Message -->
          <div style="margin: 40px 0 24px 0;">
            <p style="margin: 0 0 8px 0; color: #333333; font-size: 16px;">Hi there, open the attached contact</p>
            <p style="margin: 0; color: #333333; font-size: 16px;">to view and save ${
              profile.fullName
            }'s contact info.</p>
          </div>

          <!-- Footer -->
          <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid #eeeeee;">
            <p style="color: #666666; font-size: 14px; margin: 0;">Made with ❤️ by DelightLoop</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate email text content
   */
  static generateEmailText(profile: ProfileData): string {
    return `Contact Information for ${profile.fullName}\n\n${
      profile.title || ""
    }\n${
      profile.company || ""
    }\n\nOpen the attached contact file to save the contact information.\n\nYou can also reply to this email to reach out to ${
      profile.fullName
    }.`;
  }

  /**
   * Create vCard attachment
   */
  static createVCardAttachment(profile: ProfileData): EmailAttachment {
    const vCardContent = createVCard(profile);
    const vCardBase64 = Buffer.from(vCardContent).toString("base64");

    return {
      content: vCardBase64,
      filename: `${profile.fullName.replace(/\s+/g, "_")}.vcf`,
      type: "text/vcard",
      disposition: "attachment",
    };
  }

  /**
   * Send email with contact information
   */
  static async sendContactEmail(
    emailAddress: string,
    profile: ProfileData
  ): Promise<void> {
    try {
      const emailPayload: EmailPayload = {
        to: emailAddress,
        subject: `${profile.fullName}'s Contact Info`,
        html: this.generateEmailHTML(profile),
        text: this.generateEmailText(profile),
        attachments: [this.createVCardAttachment(profile)],
      };

      const response = await fetch("/api/email/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(emailPayload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to send email");
      }
    } catch (error) {
      console.error("Email sending error:", error);
      throw error instanceof Error
        ? error
        : new Error("Failed to send contact information. Please try again.");
    }
  }
}
