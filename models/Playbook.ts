import mongoose, { Schema, model, models } from "mongoose";

interface IPlaybook extends Document {
  name: string;
  description: string;
  organization_id: mongoose.Types.ObjectId;
  user_id: mongoose.Types.ObjectId;
  status: "Draft" | "Active" | "Completed" | "Paused";
  sending_mode: "permission_based" | "direct" | null;
  budget: number | null;
  bundleIds: mongoose.Types.ObjectId[];
  hyper_personalization: boolean;
  template: {
    type: "template1" | "template2" | "template3" | "template4";
    description: string;
    date?: Date;
    videoLink?: string;
    logoLink?: string;
    buttonText: string;
    buttonLink?: string;
    mediaUrl: string;
  } | null;
  cta_link: string;
  createdAt: Date;
  updatedAt: Date;
}

const playbookSchema = new Schema<IPlaybook>(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    organization_id: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["Draft", "Active", "Completed", "Paused"],
      default: "Draft",
    },
    sending_mode: {
      type: String,
      enum: ["permission_based", "direct", null],
      default: "permission_based",
    },
    budget: {
      type: Number,
      default: null
    },
    bundleIds: [{
      type: Schema.Types.ObjectId,
      ref: "Bundle",
      default: [],
    }],
    hyper_personalization: {
      type: Boolean,
      default: true,
      required: true
    },
    template: {
      type: {
        type: String,
        enum: ["template1", "template2", "template3", "template4"],
      },
      description: String,
      date: Date,
      videoLink: String,
      logoLink: String,
      buttonText: String,
      buttonLink: String,
      mediaUrl: String,
      _id: false
    },
    cta_link: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true, // This automatically adds createdAt and updatedAt fields
  }
);

// Add indexes for better query performance
playbookSchema.index({ organization_id: 1 });
playbookSchema.index({ user_id: 1 });
playbookSchema.index({ status: 1 });
playbookSchema.index({ "template.type": 1 });

// Add compound index for faster queries
playbookSchema.index({ organization_id: 1, user_id: 1 });

const Playbook =
  models.Playbook || model<IPlaybook>("Playbook", playbookSchema);
export default Playbook;
