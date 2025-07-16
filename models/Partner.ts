// app/models/Partner.ts
import mongoose, { Document, Schema } from "mongoose";

export interface IPartner extends Document {
  company_name: string;
  website: string;
  contact_email: string;
  callback_url: string;
  client_id: string;
  client_secret: string;
  status: "active" | "inactive";
  logo_url?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PartnerSchema: Schema = new Schema({
  company_name: { type: String, required: true },
  website: { type: String, required: true },
  contact_email: { type: String, required: true },
  callback_url: { type: String, required: true },
  client_id: { type: String, required: true, unique: true },
  client_secret: { type: String, required: true, unique: true },
  status: { type: String, enum: ["active", "inactive"], default: "inactive" },
  logo_url: { type: String },
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      // Optionally hide sensitive data
      delete ret.client_secret;
    }
  }
});

// Create indexes for faster queries
PartnerSchema.index({ client_id: 1 });
PartnerSchema.index({ status: 1 });

export default mongoose.models.Partner || mongoose.model<IPartner>("Partner", PartnerSchema);
