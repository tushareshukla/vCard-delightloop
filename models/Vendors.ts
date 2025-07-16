import mongoose, { Schema, Document } from 'mongoose';

interface IGiftVendor extends Document {
  name: string;
  type: 'amazon' | 'custom';
  credentials: any;
  settings: {
    apiEndpoint: string;
    webhookUrl: string;
    preferences: any;
  };
  status: {
    isActive: boolean;
    lastSyncAt: Date;
    health: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const GiftVendorSchema = new Schema<IGiftVendor>({
  name: { type: String, required: true },
  type: { type: String, enum: ['amazon', 'custom'], required: true },
  credentials: { type: Schema.Types.Mixed },
  settings: {
    apiEndpoint: { type: String },
    webhookUrl: { type: String },
    preferences: { type: Schema.Types.Mixed }
  },
  status: {
    isActive: { type: Boolean, default: true },
    lastSyncAt: { type: Date },
    health: { type: String }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Prevent model recompilation error
const GiftVendor = mongoose.models.GiftVendor || mongoose.model<IGiftVendor>('GiftVendor', GiftVendorSchema);

export default GiftVendor;
