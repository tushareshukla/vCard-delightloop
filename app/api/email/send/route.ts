import { NextResponse } from "next/server";
import sgMail from "@sendgrid/mail";

// Initialize SendGrid with API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY || "");

// // Add detailed logs to check environment variable and configuration
// console.log("Email Configuration:", {
//   sendgridKey: process.env.SENDGRID_API_KEY
//     ? "SENDGRID_API_KEY is set"
//     : "SENDGRID_API_KEY is missing",
//   appUrl: process.env.NEXT_PUBLIC_APP_URL,
//   environment: process.env.NEXT_PUBLIC_ENV,
// });

export async function POST(request: Request) {
  try {
    const { to, subject, text, html, attachments } = await request.json();

    const msg: any = {
      to,
      from: "DelightLoop <gifty@mail.delightloop.ai>", // Verified sender email
      subject,
      text,
      html,
    };

    // Add attachments if they exist
    if (attachments && Array.isArray(attachments)) {
      msg.attachments = attachments.map((attachment) => ({
        content: attachment.content,
        filename: attachment.filename,
        type: attachment.type,
        disposition: attachment.disposition,
      }));
    }

    console.log("Sending email with options:", {
      to: msg.to,
      subject: msg.subject,
      from: msg.from,
      hasAttachments: !!msg.attachments,
      environment: process.env.NEXT_PUBLIC_ENV,
    });

    const response = await sgMail.send(msg);

    console.log("Email sent successfully:", {
      statusCode: response[0].statusCode,
      headers: response[0].headers,
      environment: process.env.NEXT_PUBLIC_ENV,
    });

    return NextResponse.json({
      success: true,
      statusCode: response[0].statusCode,
    });
  } catch (error) {
    console.error("Email sending error details:", {
      name: error.name,
      message: error.message,
      response: error.response?.body,
      environment: process.env.NEXT_PUBLIC_ENV,
      stack: error.stack,
    });

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to send email",
        details: error.response?.body || "No additional details available",
      },
      { status: 500 }
    );
  }
}
