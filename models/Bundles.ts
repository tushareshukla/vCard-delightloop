import mongoose, { Schema, Document } from 'mongoose';

interface IBundle extends Document {
  bundleName: string;
  imgUrl: string;
  description: string;
  isAvailable: boolean;
  isCustom: boolean;
  info: {
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
  };
  giftsList: Array<{
    giftId: mongoose.Types.ObjectId;
    vendorId: mongoose.Types.ObjectId;
  }>;
  lastChecked: Date;
  lastUpdated: Date;
}

const BundleSchema = new Schema<IBundle>({
  bundleName: { type: String, required: true },
  imgUrl: { type: String },
  description: { type: String },
  isAvailable: { type: Boolean, default: true },
  isCustom: { type: Boolean, default: false },
  info: {
    createdBy: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  },
  giftsList: [{
    giftId: { type: Schema.Types.ObjectId, ref: 'Gift', required: true },
    vendorId: { type: Schema.Types.ObjectId, ref: 'Vendor', required: true }
  }],
  lastChecked: { type: Date },
  lastUpdated: { type: Date }
}, {
  timestamps: true
});

// Prevent model recompilation error
const Bundle = mongoose.models.Bundle || mongoose.model<IBundle>('Bundle', BundleSchema);

export default Bundle;
