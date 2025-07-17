import { Schema, model, models } from "mongoose";

const transactionSchema = new Schema({
  _id: {
    type: String,
    required: true,
  },
  transaction_type: {
    type: String,
    enum: ["Top-Up", "Purchase"],
    required: true,
  },
  user_id: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  balance_before: {
    type: Number,
    required: true,
  },
  transaction_cost: {
    type: Number,
    required: true,
  },
  balance_after: {
    type: Number,
    required: true,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
  payment_intent: {
    type: String,
  },
});

const walletSchema = new Schema(
  {
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
    current_balance: {
      type: Number,
      default: 0,
    },
    currency: {
      type: String,
      default: "USD",
    },
    transaction_history: [transactionSchema],
  },
  {
    timestamps: true, // This will add createdAt and updatedAt fields
  }
);

// Add compound index for faster queries
walletSchema.index({ organization_id: 1, user_id: 1 });

// Create or get the model
const Wallet = models.Wallet || model("Wallet", walletSchema);

export default Wallet;
