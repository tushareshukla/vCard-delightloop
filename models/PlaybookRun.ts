import mongoose, { Schema, model, models } from "mongoose";

interface IPlaybookRun {
  playbook_id: mongoose.Types.ObjectId;
  recipient_ids: mongoose.Types.ObjectId[];
  status: "Pending" | "Completed" | "Partially Completed";
  run_timestamp: Date;
  organization_id: mongoose.Types.ObjectId;
  completed_at?: Date;
  success_count: number;
  total_count: number;
  createdAt: Date;
  updatedAt: Date;
}

const playbookRunSchema = new Schema<IPlaybookRun>(
  {
    playbook_id: {
      type: Schema.Types.ObjectId,
      ref: "Playbook",
      required: true,
    },
    recipient_ids: [{
      type: Schema.Types.ObjectId,
      ref: "Recipient",
      required: true,
    }],
    status: {
      type: String,
      enum: ["Pending", "Completed", "Partially Completed"],
      default: "Pending",
    },
    run_timestamp: {
      type: Date,
      required: true,
    },
    organization_id: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },
    completed_at: {
      type: Date,
    },
    success_count: {
      type: Number,
      default: 0,
    },
    total_count: {
      type: Number,
      default: 0,
    }
  },
  {
    timestamps: true, // This automatically adds createdAt and updatedAt fields
  }
);

const PlaybookRun = models.PlaybookRun || model("PlaybookRun", playbookRunSchema);

export default PlaybookRun;
