import mongoose, { Document, Schema } from "mongoose";

export enum RecipientStatus {
  Draft = "null",
  Pending = "Pending",
  Processing = "Processing",
  GiftSelected = "GiftSelected",
  AwaitingAddressConfirmation = "Awaiting Address Confirmation",
  OrderPlaced = "OrderPlaced",
  InTransit = "InTransit",
  Delivered = "Delivered",
  Acknowledged = "Acknowledged",
  Failed = "Failed",
}

interface IRecipient extends Document {
  firstName: string;
  lastName: string;
  linkedinUrl: string;
  mailId: string;
  companyName?: string;
  jobTitle?: string;
  address: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
    isVerified: boolean;
    confidenceScore?: number;
  };
  status?: RecipientStatus;
  campaignId?: mongoose.Types.ObjectId;
  playbookRunId?: mongoose.Types.ObjectId;
  assignedGiftId?: mongoose.Types.ObjectId;
  whyGift?: string;
  ctaLink?: string;
  errorMessage?: string;
  expectedDeliveryDate?: Date;
  deliveryDate?: Date;
  acknowledgedAt?: Date;
}

const recipientsSchema: Schema = new Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    linkedinUrl: { type: String },
    mailId: { type: String, required: true },
    companyName: { type: String, default: "" },
    jobTitle: { type: String, default: "" },
    address: {
      line1: { type: String, default: "" },
      line2: { type: String },
      city: { type: String },
      state: { type: String },
      zip: { type: String },
      country: { type: String },
      isVerified: { type: Boolean, default: false },
      confidenceScore: { type: Number, default: null },
    },
    status: {
      type: String,
      enum: Object.values(RecipientStatus),
      default: RecipientStatus.Pending,
    },
    campaignId: { type: mongoose.Schema.Types.ObjectId, ref: "Campaign" },
    playbookRunId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PlaybookRuns",
    },
    assignedGiftId: { type: mongoose.Schema.Types.ObjectId, ref: "Gift" },
    whyGift: { type: String },
    ctaLink: { type: String },
    errorMessage: { type: String },
    expectedDeliveryDate: { type: Date },
    deliveryDate: { type: Date },
    acknowledgedAt: { type: Date },
  },
  {
    timestamps: true,
    strict: false, // Maintaining the flexible schema for debugging
  }
);

// Support both 'Recipients' and 'Recipient' model names for backward compatibility
const Recipients =
  mongoose.models.Recipients ||
  mongoose.model<IRecipient>("Recipients", recipientsSchema);
const Recipient =
  mongoose.models.Recipient ||
  mongoose.model<IRecipient>("Recipient", recipientsSchema);

export { Recipient }; 
export default Recipients;
// import mongoose, { Schema } from "mongoose";

// const recipientsSchema = new Schema(
//   {
//     firstName: { type: String, required: true },
//     lastName: { type: String, required: true },
//     mailId: { type: String },
//     phoneNumber: { type: String },
//     linkedinUrl: { type: String },
//     companyName: { type: String },
//     jobTitle: { type: String },
//     country: { type: String },
//     city: { type: String },
//     photo: { type: String },

//     address: {
//       line1: { type: String },
//       line2: { type: String },
//       city: { type: String },
//       state: { type: String },
//       zip: { type: String },
//       country: { type: String },
//     },

//     assignedGiftId: {
//       type: Schema.Types.ObjectId,
//       ref: "Gift",
//     },
//     campaignId: {
//       type: Schema.Types.ObjectId,
//       ref: "Campaign",
//     },
//     whyGift: { type: String },
//     sendMode: { type: String },
//     status: { type: String },
//     expectedDeliveryDate: { type: String },
//     deliveryDate: { type: String },
//     trackingId: { type: String },
//     acknowledgedTime: { type: String },
//   },
//   {
//     timestamps: true,
//     strict: false,
//   }
// );

// Clear existing model to ensure schema changes are applied
// mongoose.models = {};
// const Recipients =
//   mongoose.models.Recipients || mongoose.model("Recipients", recipientsSchema);
// const Recipient =
//   mongoose.models.Recipient || mongoose.model("Recipient", recipientsSchema);

// export { Recipient };
// export default Recipients;
