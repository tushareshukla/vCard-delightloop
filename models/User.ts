import mongoose, { Document, Schema, Types } from "mongoose";

interface IPublicProfileCardLink {
  type: string;
  value: string;
  isVisible: boolean;
  lastUpdated: Date;
  iconType?: string;
}

interface IPublicProfileCardNote {
  value: string;
  isVisible: boolean;
  lastUpdated: Date;
}

interface IPublicProfileCard {
  handle: string;
  fullName?: string;
  title?: string;
  company?: string;
  companyLogoUrl?: string;
  avatarUrl?: string;
  coverImageUrl?: string;
  theme?: string;
  links: IPublicProfileCardLink[];
  note: IPublicProfileCardNote;
  nfcEnabled: boolean;
  lastUpdatedAt: Date;
}

interface IUser extends Document {
  _id: Types.ObjectId;
  partner_id?: mongoose.Schema.Types.ObjectId;
  partner_client_id?: string;
  organization_id?: mongoose.Schema.Types.ObjectId;
  email: string;
  password: string;
  mobile: string;
  linkedinCreds?: {
    linkedinProfile?: string;
    linkedinEmail?: string;
    pfp?: string;
    jobTitle?: string;
    companyName?: string;
  };
  integrations?: {
    name?: string;
    code?: string;
    authToken?: string;
    refreshToken?: string;
    expiresIn?: string;
  }[];
  state: string;
  country: string;
  firstName: string;
  lastName: string;
  roles: ("campaign_manager" | "approver" | "admin" | "new_user_no_org")[];
  status: "active" | "inactive" | "verified";
  isActive: boolean;
  isDeleted: boolean;
  emailVerified: boolean;
  login_count: number;
  createdAt: Date;
  updatedAt: Date;
  last_loggedin: Date;
  access_token?: string;
  refresh_token?: string;
  unipile: {
    add_email_link: string;
    add_email_link_error: string;
    account_id: string;
  };
  promosUsed: string[];
  publicProfileCard?: IPublicProfileCard;
}

const userSchema: Schema = new Schema(
  {
    partner_id: { type: mongoose.Schema.Types.ObjectId, ref: "Partner" },
    partner_client_id: { type: String },
    organization_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
    },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    mobile: { type: String },
    linkedinCreds: {
      linkedinProfile: { type: String, default: "" },
      linkedinEmail: { type: String, default: "" },
      pfp: { type: String, default: "" },
      jobTitle: { type: String, default: "" },
      companyName: { type: String, default: "" },
    },
    integrations: [
      {
        name: { type: String },
        code: { type: String },
        authToken: { type: String },
        refreshToken: { type: String },
        expiresIn: { type: String },
      },
    ],
    state: { type: String },
    country: { type: String },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    roles: {
      type: [String],
      enum: ["campaign_manager", "approver", "admin", "new_user_no_org"],
      default: [],
    },
    status: { type: String, enum: ["active", "inactive","verified"], default: "active" },
    isActive: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
    emailVerified: { type: Boolean, default: false },
    login_count: { type: Number, default: 0 },
    last_loggedin: { type: Date, default: Date.now() },
    access_token: { type: String },
    refresh_token: { type: String },
    unipile: {
      add_email_link: { type: String, default: "" },
      add_email_link_error: { type: String, default: "" },
      account_id: { type: String, default: "" },
    },
    promosUsed: { type: [String], default: [] },
    publicProfileCard: {
      handle: { type: String },
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
          iconType: { type: String },
        },
      ],
      note: {
        value: { type: String, default: "" },
        isVisible: { type: Boolean, default: true },
        lastUpdated: { type: Date, default: Date.now },
      },
      nfcEnabled: { type: Boolean, default: false },
      lastUpdatedAt: { type: Date, default: Date.now },
    },
  },
  { timestamps: true } // Automatically manages createdAt and updatedAt fields
);

export default mongoose.models.User ||
  mongoose.model<IUser>("User", userSchema);
export type {
  IUser,
  IPublicProfileCard,
  IPublicProfileCardLink,
  IPublicProfileCardNote,
};
