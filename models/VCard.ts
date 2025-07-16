import mongoose, { Document, Schema, Types } from "mongoose";

// Function to generate a 6-digit random code
const generate6DigitCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Function to generate unique 6-digit code for a specific field
const generateUniqueCode = async (
  fieldName: "key" | "secret"
): Promise<string> => {
  let code: string;
  let isUnique = false;
  let attempts = 0;
  const maxAttempts = 100; // Prevent infinite loops

  while (!isUnique && attempts < maxAttempts) {
    code = generate6DigitCode();

    // Check if code already exists in the database for this field
    const query = { [fieldName]: code, isDeleted: false };
    const existingVCard = await mongoose.model("VCard").findOne(query);

    if (!existingVCard) {
      isUnique = true;
      return code;
    }

    attempts++;
  }

  // If we can't generate a unique code after max attempts, throw an error
  throw new Error(
    `Unable to generate unique ${fieldName} after ${maxAttempts} attempts`
  );
};

interface IVCardLink {
  type: string;
  value: string;
  isVisible: boolean;
  lastUpdated: Date;
}

interface IVCardNote {
  value: string;
  isVisible: boolean;
  lastUpdated: Date;
}

interface IVCard extends Document {
  _id: Types.ObjectId;
  userId?: Types.ObjectId;
  handle: string;
  key: string;
  secret: string;
  referredByVcardId?: Types.ObjectId;
  fullName?: string;
  title?: string;
  company?: string;
  companyLogoUrl?: string;
  avatarUrl?: string;
  coverImageUrl?: string;
  theme?: string;
  links: IVCardLink[];
  note: IVCardNote;
  nfcEnabled: boolean;
  lastUpdatedAt: Date;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const vCardSchema: Schema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    handle: { type: String, required: true, unique: true },
    key: {
      type: String,
      unique: true,
      sparse: true, // Allows null/undefined values but ensures uniqueness when present
    },
    secret: {
      type: String,
      unique: true,
      sparse: true, // Allows null/undefined values but ensures uniqueness when present
    },
    referredByVcardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "VCard",
      required: false,
    },
    fullName: { type: String },
    title: { type: String },
    company: { type: String },
    companyLogoUrl: { type: String },
    avatarUrl: { type: String },
    coverImageUrl: { type: String },
    theme: { type: String, default: "classic-purple" },
    links: [
      {
        type: { type: String, required: true },
        value: { type: String, required: true },
        isVisible: { type: Boolean, default: true },
        lastUpdated: { type: Date, default: Date.now },
      },
    ],
    note: {
      value: { type: String, default: "" },
      isVisible: { type: Boolean, default: true },
      lastUpdated: { type: Date, default: Date.now },
    },
    nfcEnabled: { type: Boolean, default: false },
    lastUpdatedAt: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true } // Automatically manages createdAt and updatedAt fields
);

// Pre-save middleware to ensure key and secret are always generated with uniqueness
vCardSchema.pre("save", async function (next) {
  try {
    // Always generate key and secret for new documents
    if (this.isNew) {
      console.log("Generating key and secret for new VCard...");
      this.key = await generateUniqueCode("key");
      this.secret = await generateUniqueCode("secret");
      console.log(`Generated key: ${this.key}, secret: ${this.secret}`);
    }

    // Ensure key and secret exist even for existing documents
    if (!this.key) {
      console.log("Missing key, generating...");
      this.key = await generateUniqueCode("key");
    }
    if (!this.secret) {
      console.log("Missing secret, generating...");
      this.secret = await generateUniqueCode("secret");
    }

    next();
  } catch (error) {
    console.error("Error in VCard pre-save middleware:", error);
    next(error as Error);
  }
});

// Create indexes for better query performance
vCardSchema.index({ userId: 1 });
vCardSchema.index({ isDeleted: 1 });
vCardSchema.index({ referredByVcardId: 1 }); // For referral tracking queries

const VCard =
  mongoose.models.VCard || mongoose.model<IVCard>("VCard", vCardSchema);
export default VCard;
export type { IVCard, IVCardLink, IVCardNote };
