import mongoose, { Schema, Document } from 'mongoose';

export interface IGift extends Document {
  sku: string;
  name: string;
  descShort: string;
  descFull: string;
  category: string;
  subCat: string;
  tags: string[];
  price: number;
  minOrder: number;
  manufacturer: string;
  leadTime: number;
  personalizationOpts: string[];
  images: {
    primaryImgUrl: string;
    secondaryImgUrl: string;
  };
  stock: boolean;
  vendorDetails: {
    inventory: number;
    notes: string;
  };
  __v: number;
}

const GiftSchema = new Schema({
  sku: { type: String, required: true },
  name: { type: String, required: true },
  descShort: { type: String, required: true },
  descFull: { type: String, required: true },
  category: { type: String, required: true },
  subCat: { type: String, required: true },
  tags: [{ type: String }],
  price: { type: Number, required: true },
  minOrder: { type: Number, default: 1 },
  manufacturer: { type: String, required: true },
  leadTime: { type: Number, required: true },
  personalizationOpts: [{ type: String }],
  images: {
    primaryImgUrl: { type: String, required: true },
    secondaryImgUrl: { type: String, default: "" }
  },
  stock: { type: Boolean, default: true },
  vendorDetails: {
    inventory: { type: Number, required: true },
    notes: { type: String }
  },
  __v: { type: Number, default: 0 }
}, {
  timestamps: true
});

// Prevent model recompilation error
const Gift = mongoose.models.Gift || mongoose.model<IGift>('Gift', GiftSchema);

export default Gift;
