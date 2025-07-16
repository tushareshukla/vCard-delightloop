import mongoose, { Schema, Document } from 'mongoose';

interface ICustomerProfile extends Document {
  email: string;
  emailConfidence: number;
  emailVerifiedAt: Date;
  phone: string;
  phoneConfidence: number;
  phoneVerifiedAt: Date;
  addresses: Array<{
    type: 'office' | 'permanent' | 'residence_current';
    line1: string;
    line2: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    confidence: number;
    isPrimary: boolean;
    source: string;
    verifiedAt: Date;
  }>;
  enrichedData: {
    professional: {
      title: string;
      company: string;
      industry: string;
      experience: number;
    };
    interests: string[];
    socialProfiles: {
      linkedin: string;
      twitter: string;
      other: any;
    };
    demographics: any;
  };
  giftHistory: Array<{
    giftId: mongoose.Types.ObjectId;
    campaignId: mongoose.Types.ObjectId;
    receivedAt: Date;
    feedback: {
      score: number;
      comments: string;
    };
  }>;
  preferences: any;
  lastEnrichedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CustomerProfileSchema = new Schema<ICustomerProfile>({
  email: { type: String, required: true },
  emailConfidence: { type: Number, required: true },
  emailVerifiedAt: { type: Date },
  phone: { type: String, required: true },
  phoneConfidence: { type: Number, required: true },
  phoneVerifiedAt: { type: Date },
  addresses: [{
    type: { type: String, enum: ['office', 'permanent', 'residence_current'], required: true },
    line1: { type: String, required: true },
    line2: { type: String },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, required: true },
    confidence: { type: Number, required: true },
    isPrimary: { type: Boolean, default: false },
    source: { type: String },
    verifiedAt: { type: Date }
  }],
  enrichedData: {
    professional: {
      title: { type: String },
      company: { type: String },
      industry: { type: String },
      experience: { type: Number }
    },
    interests: [{ type: String }],
    socialProfiles: {
      linkedin: { type: String },
      twitter: { type: String },
      other: { type: Schema.Types.Mixed }
    },
    demographics: { type: Schema.Types.Mixed }
  },
  giftHistory: [{
    giftId: { type: Schema.Types.ObjectId, ref: 'Gift', required: true },
    campaignId: { type: Schema.Types.ObjectId, ref: 'Campaign', required: true },
    receivedAt: { type: Date, required: true },
    feedback: {
      score: { type: Number },
      comments: { type: String }
    }
  }],
  preferences: { type: Schema.Types.Mixed },
  lastEnrichedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Prevent model recompilation error
const CustomerProfile = mongoose.models.CustomerProfile || mongoose.model<ICustomerProfile>('CustomerProfile', CustomerProfileSchema);

export default CustomerProfile;
