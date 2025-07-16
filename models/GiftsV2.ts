import mongoose, { Schema, Document } from 'mongoose';

interface IGift extends Document {
  vendorId: mongoose.Types.ObjectId;
  name: string;
  description: string;
  images: {
    primaryImgUrl: string;
    secondaryImgUrl: string;
  },
  price: mongoose.Types.Decimal128;
  minOrder: number;
  vendorProductId: string;
  attributes: {
    category: string;
    tags: string[];
    specifications: any;
    customization: {
      available: boolean;
      options: any[];
    };
    dimensions: {
      weight: number;
      size: any;
    };
  };
  inventory: {
    inStock: boolean;
    quantity: number;
    lastChecked: Date;
  };
  status: {
    isActive: boolean;
    availability: string;
  };
  metrics: {
    totalOrdered: number;
    averageRating: number;
    recommendationScore: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const GiftSchema = new Schema<IGift>({
  vendorId: { type: Schema.Types.ObjectId, ref: 'Vendor', required: true },
  name: { type: String, required: true },
  description: { type: String },
  images: {
    primaryImgUrl: { type: String, required: true },
    secondaryImgUrl: { type: String, default: "" }
  },
  price: { type: Schema.Types.Decimal128, required: true },
  minOrder: { type: Number, default: 1 },
  vendorProductId: { type: String },
  attributes: {
    category: { type: String },
    tags: [{ type: String }],
    specifications: { type: Schema.Types.Mixed },
    customization: {
      available: { type: Boolean, default: false },
      options: [{ type: Schema.Types.Mixed }]
    },
    dimensions: {
      weight: { type: Number },
      size: { type: Schema.Types.Mixed }
    }
  },
  inventory: {
    inStock: { type: Boolean, default: true },
    quantity: { type: Number, default: 0 },
    lastChecked: { type: Date }
  },
  status: {
    isActive: { type: Boolean, default: true },
    availability: { type: String }
  },
  metrics: {
    totalOrdered: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
    recommendationScore: { type: Number, default: 0 }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Prevent model recompilation error
const Gift = mongoose.models.Gift || mongoose.model<IGift>('Gift', GiftSchema);

export default Gift;
