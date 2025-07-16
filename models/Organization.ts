
import mongoose, { Schema, Document } from "mongoose";

interface IOrganization extends Document {
  name: string;
  domain?: string;
  branding: {
    logo_url: string;
    primary_color?: string;
  };
  budget?: {
    total: number;
    currency: string;
  };
  status: string;
  createdAt: Date;
  updatedAt: Date;
  //isActive: boolean;
  isDeleted: boolean;
}

const OrganizationSchema = new Schema<IOrganization>(
  {
    name: { type: String, required: true },
    domain: { type: String, unique: true, sparse: true },
    branding: {
      logo_url: { type: String, default: "" },
      primary_color: { type: String },
    },
    budget: {
      total: { type: Number },
      currency: { type: String, default: "USD" },
    },
    status: { type: String, default: "active" },
    //isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

const Organization =
  mongoose.models.Organization ||
  mongoose.model<IOrganization>("Organization", OrganizationSchema);

export default Organization;
