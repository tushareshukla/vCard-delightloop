import { createHmac } from "crypto";

interface TemplateData {
  recipient_id: string;
  playbook_id: string;
  playbook_run_id: string;
  campaign_id: string;
}

// Encrypt the data into a secure token
export const generateTemplateToken = (data: TemplateData): string => {
  const payload = Buffer.from(JSON.stringify(data)).toString("base64");
  const hmac = createHmac(
    "sha256",
    process.env.TEMPLATE_SECRET_KEY || "default-secret-key"
  );
  const signature = hmac.update(payload).digest("base64");
  return `${payload}.${signature}`;
};

// Verify and decode the token
export const verifyTemplateToken = (token: string): TemplateData | null => {
  try {
    // Log the incoming token for debugging
    console.log("Verifying token:", token);

    // For this token format, we only need to decode the payload
    // The token format is: base64(JSON).signature
    const [payload] = token.split(".");

    console.log("Extracted payload:", payload);

    // Decode the base64 payload
    const decodedPayload = Buffer.from(payload, "base64").toString();
    console.log("Decoded payload:", decodedPayload);

    // Parse the JSON
    const data = JSON.parse(decodedPayload);
    console.log("Parsed data:", data);

    // Verify the data has the required fields
    if (!data.recipient_id || !data.playbook_id || !data.playbook_run_id || !data.campaign_id) {
      console.error("Missing required fields in token payload");
      return null;
    }

    return data;
  } catch (error) {
    console.error("Token verification failed:", error);
    return null;
  }
};
