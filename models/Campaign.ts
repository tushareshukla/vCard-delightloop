import mongoose, { Schema, Document } from "mongoose";

interface ICampaign extends Document {
  organization_id: mongoose.Types.ObjectId; // Organization Reference
  creatorUserId: mongoose.Types.ObjectId;
  approverUserId: mongoose.Types.ObjectId;
  name: string; // Campaign Name
  description: string;
  // Campaign Goals
  goal: string;
  subGoals: [
    {
      level: number;
      subGoalName: string;
      description: string;
    }
  ];
  // Campaign Hierarchy
  parentCampaignId?: mongoose.Types.ObjectId;
  childCampaignIds: mongoose.Types.ObjectId[];

  // Gift Selection
  giftCatalogs: [
    {
      catalogId: mongoose.Types.ObjectId;
      selectedGift: mongoose.Types.ObjectId[];
      _id: mongoose.Types.ObjectId;
    }
  ];
  giftSelectionMode: string;

  // Budget
  budget: {
    totalBudget: number;
    maxPerGift: number;
    currency: string;
    spent: number;
  };
  status: string;
  statusHistory: [
    {
      status: string;
      changedAt: Date;
      changedBy: mongoose.Types.ObjectId;
    }
  ];
  total_recipients: number;
  // Recipients Source
  source: {
    sourceType: string;
    sourceId: string;
    sourceName: string;
    syncDateTime: Date;
  };
  // Recipient Statistics
  recipientSummary: {
    totalCount: number;
    statusCounts: {
      giftSelected: number;
      waitingForAddress: number;
      shipped: number;
      delivered: number;
      acknowledged: number;
    };
  };
  outcomeCard: {
    message: string;
    logoLink: string;
  };
  outcomeTemplate: {
    type: "template1" | "template2" | "template3" | "template4";
    description: string;
    date: Date;
    videoLink: string;
    logoLink: string;
    buttonText: string;
    buttonLink: string;
    mediaUrl: string;
    videoUrl: string;
    buttonText1: string;
    buttonLink1: string;
    buttonText2: string;
    buttonLink2: string;
  };
  createdAt: Date;
  updatedAt: Date;
  approvedAt: Date;
  completedAt: Date;
  eventStartDate: Date;
  deliverByDate: Date;
  cta_link?: string;
}

const CampaignSchema = new Schema<ICampaign>(
  {
    organization_id: {
      type: Schema.Types.ObjectId,
      default: new mongoose.Types.ObjectId("222222222222222222222222"),
      required: true,
    },
    creatorUserId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    approverUserId: { type: Schema.Types.ObjectId },
    name: { type: String, required: true },
    // Campaign Hierarchy
    parentCampaignId: { type: Schema.Types.ObjectId, ref: "Campaign" },
    childCampaignIds: [{ type: Schema.Types.ObjectId, ref: "Campaign" }],
    description: { type: String },
    // Campaign Goals
    goal: {
      type: String,
      enum: [
        "delight_event_attendees",
        "create_more_pipeline",
        "close_deal_faster",
        "reduce_churn",
      ],
    },
    subGoals: [
      {
        level: { type: Number },
        subGoalName: { type: String },
        description: { type: String },
      },
    ],

    // Gift Selection
    giftCatalogs: [
      {
        catalogId: { type: Schema.Types.ObjectId, ref: "Bundle" },
        selectedGift: [{ type: Schema.Types.ObjectId, ref: "Gift" }],
        _id: Schema.Types.ObjectId
      }
    ],
    giftSelectionMode: {
      type: String,
      enum: ["hyper_personalize", "fast_track", "cohort", "manual"],
    },
    budget: {
      totalBudget: { type: Number, default: 0 },
      maxPerGift: { type: Number, default: 0 },
      currency: { type: String },
      spent: { type: Number, default: 0 },
    },
    status: {
      type: String,
      enum: [
        "draft",
        "waiting_for_approval",
        "live",
        "completed",
        "rejected",
        "cancelled",
        "list_building",
        "ready_for_launch",
        "matching gifts",
      ],
      default: "draft",
    },
    // Track Status changes
    statusHistory: [
      {
        status: { type: String },
        changedAt: { type: Date, default: Date.now() },
        changedBy: { type: Schema.Types.ObjectId, ref: "User" },
      },
    ],
    total_recipients: {
      type: Number,
      default: 0,
    },
    // Recipients Source
    source: {
      sourceType: {
        type: String,
        enum: ["contact_list", "csv", "csm", "event_platform"],
      },
      sourceId: { type: String },
      sourceName: { type: String },
      syncDateTime: { type: Date, default: Date.now() },
    },
    // Recipient Statistics
    recipientSummary: {
      totalCount: { type: Number, default: 0 },
      statusCounts: {
        giftSelected: { type: Number, default: 0 },
        waitingForAddress: { type: Number, default: 0 },
        shipped: { type: Number, default: 0 },
        delivered: Number,
        acknowledged: Number,
      },
    },
    cta_link: { type: String },
    approvedAt: { type: Date, default: Date.now() },
    completedAt: { type: Date },
    eventStartDate: { type: Date },
    deliverByDate: { type: Date },
    outcomeCard: {
      message: { type: String, default: "" },
      logoLink: { type: String, default: "" },
    },
    outcomeTemplate: {
      type: {
        type: String,
        enum: ["template1", "template2", "template3", "template4"],
        default: "template1"
      },
      description: { type: String, default: "" },
      date: { type: Date, default: Date.now },
      videoLink: { type: String, default: "" },
      logoLink: { type: String, default: "" },
      buttonText: { type: String, default: "" },
      buttonLink: { type: String, default: "" },
      mediaUrl: { type: String, default: "" },
      videoUrl: { type: String, default: "" },
      buttonText1: { type: String, default: "" },
      buttonLink1: { type: String, default: "" },
      buttonText2: { type: String, default: "" },
      buttonLink2: { type: String, default: "" }
    },
  },
  {
    timestamps: true,
    strict: true,
  }
);

// Add middleware to log updates
CampaignSchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate() as any;
  console.log("Pre-update operation:", {
    update,
    giftIds: update?.giftIds || (update?.$set && update.$set.giftIds),
  });
  next();
});

CampaignSchema.post("findOneAndUpdate", function (doc) {
  console.log("Post-update document:", {
    id: doc?._id,
    giftIds: doc?.giftIds,
  });
});

// Clear existing model to ensure schema changes are applied
if (mongoose.models.Campaign) {
  delete mongoose.models.Campaign; // Remove the existing model
}

const Campaign =
  mongoose.models.Campaign ||
  mongoose.model<ICampaign>("Campaign", CampaignSchema);

export default Campaign;
