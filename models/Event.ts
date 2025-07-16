import mongoose, { Document, Schema } from "mongoose";

export interface IEvent extends Document {
  name: string;
  type: string;
  campaignIds: mongoose.Types.ObjectId[];
  eventDate: Date;
  location: string;
  eventUrl: string;
  hostCompany: string;
  eventDesc: string;
  targetAudience: string;
  eventTopic: string[];
  agendaSummary: string[];
  speakers: string[];
  serviceFocus: string;
  media: {
    eventLogo: string;
    banner: string;
  };
  eventHashtag: string;
  creatorUserId: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
}

const EventSchema = new Schema<IEvent>(
  {
    name: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true,
    },
    campaignIds: [
      {
        type: Schema.Types.ObjectId,
        ref: "Campaign",
      },
    ],
    eventDate: {
      type: Date,
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    eventUrl: {
      type: String,
      required: true,
    },
    hostCompany: {
      type: String,
      default: "",
    },
    eventDesc: {
      type: String,
      required: true,
    },
    targetAudience: {
      type: String,
      required: true,
    },
    eventTopic: [
      {
        type: String,
      },
    ],
    agendaSummary: [
      {
        type: String,
      },
    ],
    speakers: [
      {
        type: String,
      },
    ],
    serviceFocus: {
      type: String,
      required: true,
    },
    media: {
      eventLogo: {
        type: String,
        default: "",
      },
      banner: {
        type: String,
        default: "",
      },
    },
    eventHashtag: {
      type: String,
      default: "",
    },
    creatorUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Event =
  mongoose.models.Event || mongoose.model<IEvent>("Event", EventSchema);

export default Event;
