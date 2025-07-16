// TODO: Add error handling and logging
import { NextResponse } from "next/server";
import { parse } from "csv-parse";
import dbConnect from "@/lib/database/dbConnect";
import Campaign from "@/models/Campaign";
import * as XLSX from "xlsx";
import Recipient from "@/models/Recipients";

interface Record {
  [key: string]: string;
}
// Field mappings for different data types
const FIELD_MAPPINGS = {
  firstName: [
    "firstName",
    "first_name",
    "First Name",
    "FirstName",
    "first name",
    "firstname",
  ],
  lastName: [
    "lastName",
    "last_name",
    "Last Name",
    "LastName",
    "last name",
    "lastname",
  ],
  jobTitle: [
    "jobTitle",
    "job_title",
    "Job Title",
    "JobTitle",
    "job title",
    "jobtitle",
    "title",
    "position",
    "job",
  ],
  companyName: [
    "companyName",
    "company_name",
    "Company Name",
    "CompanyName",
    "company name",
    "company",
    "organisation",
    "organization",
  ],
  addressLine1: [
    "addressLine1",
    "address_line_1",
    "Address Line 1",
    "address line 1",
    "line1",
    "Line 1",
  ],
  addressLine2: [
    "addressLine2",
    "address_line_2",
    "Address Line 2",
    "address line 2",
    "line2",
    "Line 2",
  ],
  city: ["city", "City", "town", "Town"],
  state: ["state", "State", "province", "Province", "region", "Region"],
  zip: ["zip", "Zip", "zipcode", "postal_code", "PostalCode", "postalCode"],
  country: ["country", "Country", "nation", "Nation"],
  phoneNumber: [
    "phoneNumber",
    "phone_number",
    "Phone Number",
    "PhoneNumber",
    "phone number",
    "phone",
  ],
  linkedinUrl: [
    "linkedinUrl",
    "linkedin_url",
    "LinkedIn URL",
    "LinkedInUrl",
    "linkedin url",
    "linkedin",
  ],
  email: ["email", "Email", "mail", "mailId", "mail_id", "emailId", "email_id"],
};

function findMatchingValue(record: Record, fieldMappings: string[]): string {
  for (const mapping of fieldMappings) {
    const value = record[mapping];
    if (record[mapping] !== undefined) {
      return typeof value === 'string' ? value.trim() : String(value);
    }
  }
  return "";
}

// Data format validators
const isPhoneNumber = (value: string): boolean => {
  return /^[\d\s\-\(\)x\.]+$/.test(value); // Matches phone number patterns
};

const isLinkedInUrl = (value: string): boolean => {
  return value.toLowerCase().includes("linkedin.com");
};

const isEmail = (value: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
};

const isFirstName = (value: string): boolean => {
  const trimmed = value.trim();
  return trimmed !== "" && /^[a-zA-Z]+$/.test(trimmed);
};

const isLastName = (value: string): boolean => {
  return /^[a-zA-Z]+$/.test(value);
};

const isCompanyName = (value: string): boolean => {
  return /^[a-zA-Z0-9\s\-_]+$/.test(value);
};

function findCorrectValue(
  record: any,
  fieldType: "phone" | "linkedin" | "email" | "firstName" | "lastName" | "companyName"
): string {
  // Search through all fields in the record
  for (const key of Object.keys(record)) {
    const value = record[key]?.toString().trim() || "";

    switch (fieldType) {
      case "phone":
        if (isPhoneNumber(value)) return value;
        break;
      case "linkedin":
        if (isLinkedInUrl(value)) return value;
        break;
      case "email":
        if (isEmail(value)) return value;
        break;
      case "firstName":
        if (isFirstName(value)) return value;
        break;
      case "lastName":
        if (isLastName(value)) return value;
        break;
      case "companyName":
        if (isCompanyName(value)) return value;
        break;
    }
  }
  return "";
}

export async function POST(request: Request) {
  try {
    console.log("📥 API: Received upload request");
    await dbConnect();
    console.log("✅ API: Database connected");

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const campaignId = formData.get("campaignId") as string;

    // Add debug logging
    console.log("🔍 API: Campaign ID received:", campaignId);

    if (!file) {
      console.log("❌ API: No file uploaded");
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    if (!campaignId) {
      console.log("❌ API: No campaign ID provided");
      return NextResponse.json(
        { error: "Campaign ID is required" },
        { status: 400 }
      );
    }

    // Move campaignId validation earlier, before CSV processing
    if (!campaignId.match(/^[0-9a-fA-F]{24}$/)) {
      console.log("❌ API: Invalid campaign ID format");
      return NextResponse.json(
        { error: "Invalid campaign ID format" },
        { status: 400 }
      );
    }

    console.log("📄 API: Processing file:", file.name);
    const fileExtension = file.name.split(".").pop()?.toLowerCase();

    let records: any[] = [];

    if (fileExtension === "csv") {
      const text = await file.text();
      console.log("📝 API: File content sample:", text.substring(0, 100));

      records = await new Promise((resolve, reject) => {
        parse(
          text,
          {
            columns: true,
            skip_empty_lines: true,
            relax_column_count: true,
          },
          (error, records) => {
            if (error) {
              console.error("❌ API: CSV parsing error:", error);
              reject(error);
            } else {
              resolve(records);
            }
          }
        );
      });
    } else if (fileExtension === "xlsx") {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      records = XLSX.utils.sheet_to_json(worksheet);
    } else {
      console.log("❌ API: Unsupported file format");
      return NextResponse.json(
        { error: "Unsupported file format" },
        { status: 400 }
      );
    }

    console.log("✅ API: Parsed records count:", records.length);

    // Validate that we can find at least some required fields
    const sampleRecord = records[0];
    const hasFirstName = FIELD_MAPPINGS.firstName.some(
      (field) => sampleRecord[field] !== undefined
    );
    const hasLastName = FIELD_MAPPINGS.lastName.some(
      (field) => sampleRecord[field] !== undefined
    );
    const hasCompanyName = FIELD_MAPPINGS.companyName.some(
      (field) => sampleRecord[field] !== undefined
    );
    const hasLinkedinUrl = FIELD_MAPPINGS.linkedinUrl.some(
      (field) => sampleRecord[field] !== undefined
    );

    if (!hasFirstName && !hasLastName && !hasCompanyName) {
      throw new Error(
        "CSV file is missing required fields. Please ensure your CSV contains at least one of: first name, last name, or company name columns."
      );
    }

    if (!campaignId) {
      throw new Error("Campaign ID is required");
    }

    // Validate each parsed record before inserting
    const hasInvalidRecord = records.some((record: any) => {
      const firstName = findMatchingValue(record, FIELD_MAPPINGS.firstName).trim();
      const lastName = findMatchingValue(record, FIELD_MAPPINGS.lastName).trim();
      const companyName = findMatchingValue(record, FIELD_MAPPINGS.companyName).trim();
      const linkedinUrl = findMatchingValue(record, FIELD_MAPPINGS.linkedinUrl).trim();
      // Record is invalid if all three are empty.
      return firstName === "" || lastName === "" || companyName === "" || linkedinUrl === "";
    });

    if (hasInvalidRecord) {
      throw new Error(
        "CSV file is missing required fields. Please ensure your CSV contains : first name, last name,company name, linkedin url columns."
      );
    }

    const recipients = records.map((record: any) => {
      // First try to find values based on expected column names
      let phoneNumber = findMatchingValue(record, FIELD_MAPPINGS.phoneNumber);
      let linkedinUrl = findMatchingValue(record, FIELD_MAPPINGS.linkedinUrl);
      let mailId = findMatchingValue(record, FIELD_MAPPINGS.email);
      let firstName = findMatchingValue(record, FIELD_MAPPINGS.firstName);
      let lastName = findMatchingValue(record, FIELD_MAPPINGS.lastName);
      let companyName = findMatchingValue(record, FIELD_MAPPINGS.companyName);

      // If the values don't match expected formats, search all fields for correct data
      if (!isPhoneNumber(phoneNumber)) {
        phoneNumber = findCorrectValue(record, "phone");
      }
      if (!isLinkedInUrl(linkedinUrl)) {
        linkedinUrl = findCorrectValue(record, "linkedin");
      }
      if (!isEmail(mailId)) {
        mailId = findCorrectValue(record, "email");
      }
      if (!isFirstName(firstName)) {
        firstName = findCorrectValue(record, "firstName");
      }
      if (!isLastName(lastName)) {
        lastName = findCorrectValue(record, "lastName");
      }
      if (!isCompanyName(companyName)) {
        companyName = findCorrectValue(record, "companyName");
      }

      return {
        firstName: findMatchingValue(record, FIELD_MAPPINGS.firstName),
        lastName: findMatchingValue(record, FIELD_MAPPINGS.lastName),
        jobTitle: findMatchingValue(record, FIELD_MAPPINGS.jobTitle),
        companyName: findMatchingValue(record, FIELD_MAPPINGS.companyName),
        address: {
          line1: findMatchingValue(record, FIELD_MAPPINGS.addressLine1),
          line2: findMatchingValue(record, FIELD_MAPPINGS.addressLine2),
          city: findMatchingValue(record, FIELD_MAPPINGS.city),
          state: findMatchingValue(record, FIELD_MAPPINGS.state),
          zip: findMatchingValue(record, FIELD_MAPPINGS.zip),
          country: findMatchingValue(record, FIELD_MAPPINGS.country),
        },
        phoneNumber,
        linkedinUrl,
        mailId,
        campaignId,
        status: "null",
        expectedDeliveryDate: null,
        deliveryDate: null,
        acknowledgedTime: null,
      };
    });

    // Add some logging to verify the data correction
    console.log("📊 API: Sample processed record:", recipients[0]);

    console.log("📝 API: Storing recipients in database...");
    const result = await Recipient.insertMany(recipients);
    console.log(`✅ API: Stored ${result.length} recipients`);

    await Campaign.findByIdAndUpdate(campaignId, {
      $inc: { total_recipients: recipients.length },
      $set: {
        "metrics.totalRecipients": recipients.length,
      },
    });

    return NextResponse.json({
      success: true,
      count: recipients.length,
      storedRecipients: result.length,
    });
  } catch (error) {
    console.error("❌ API: Error storing recipients:", error);
    if (!error.message) {
      error.message = "Failed to process and store recipients";
    }
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
