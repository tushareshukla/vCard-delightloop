import mongoose, { Schema, Document } from 'mongoose';

interface IGiftRecipient extends Document {
  campaignId: mongoose.Types.ObjectId;
  recipientId: mongoose.Types.ObjectId;
  status: 'pending' | 'processing' | 'selected' | 'gifted' | 'failed';
  giftRecommendation: {
    selectedGiftId: mongoose.Types.ObjectId;
    score: number;
    alternateGifts: Array<{
      giftId: mongoose.Types.ObjectId;
      score: number;
      reason: string;
    }>;
  };
  aiInsights: {
    preferences: any;
    interests: string[];
    affinityScores: any;
    recommendationFactors: string[];
    confidenceScore: number;
  };
  engagement: {
    emailOpened: boolean;
    trackingClicked: boolean;
    feedbackProvided: boolean;
    feedbackScore: number;
    lastEngagedAt: Date;
  };
  order: {
    orderId: mongoose.Types.ObjectId;
    status: string;
    createdAt: Date;
  };
  metadata: any;
  createdAt: Date;
  updatedAt: Date;
}

const GiftRecipientSchema = new Schema<IGiftRecipient>({
  campaignId: { type: Schema.Types.ObjectId, ref: 'Campaign', required: true },
  recipientId: { type: Schema.Types.ObjectId, ref: 'Recipient', required: true },
  status: { type: String, enum: ['pending', 'processing', 'selected', 'gifted', 'failed'], required: true },
  giftRecommendation: {
    selectedGiftId: { type: Schema.Types.ObjectId, ref: 'Gift' },
    score: { type: Number },
    alternateGifts: [{
      giftId: { type: Schema.Types.ObjectId, ref: 'Gift' },
      score: { type: Number },
      reason: { type: String }
    }]
  },
  aiInsights: {
    preferences: { type: Schema.Types.Mixed },
    interests: [{ type: String }],
    affinityScores: { type: Schema.Types.Mixed },
    recommendationFactors: [{ type: String }],
    confidenceScore: { type: Number }
  },
  engagement: {
    emailOpened: { type: Boolean, default: false },
    trackingClicked: { type: Boolean, default: false },
    feedbackProvided: { type: Boolean, default: false },
    feedbackScore: { type: Number },
    lastEngagedAt: { type: Date }
  },
  order: {
    orderId: { type: Schema.Types.ObjectId, ref: 'Order' },
    status: { type: String },
    createdAt: { type: Date }
  },
  metadata: { type: Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Prevent model recompilation error
const GiftRecipient = mongoose.models.GiftRecipient || mongoose.model<IGiftRecipient>('GiftRecipient', GiftRecipientSchema);

export default GiftRecipient;
