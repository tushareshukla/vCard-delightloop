import mongoose, { Schema, Document } from 'mongoose';

interface IOrder extends Document {
  campaignId: mongoose.Types.ObjectId;
  recipientId: mongoose.Types.ObjectId;
  giftId: mongoose.Types.ObjectId;
  amount: mongoose.Types.Decimal128;
  status: string;
  shipping: {
    address: {
      line1: string;
      line2: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    };
    tracking: {
      number: string;
      carrier: string;
      url: string;
    };
    status: string;
    history: Array<{
      status: string;
      timestamp: Date;
      location: string;
      details: string;
    }>;
    estimatedDelivery: Date;
    deliveredAt: Date;
  };
  transaction: {
    id: mongoose.Types.ObjectId;
    status: string;
    processedAt: Date;
  };
  customization: any;
  metadata: any;
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema = new Schema<IOrder>({
  campaignId: { type: Schema.Types.ObjectId, ref: 'Campaign', required: true },
  recipientId: { type: Schema.Types.ObjectId, ref: 'Recipient', required: true },
  giftId: { type: Schema.Types.ObjectId, ref: 'Gift', required: true },
  amount: { type: Schema.Types.Decimal128, required: true },
  status: { type: String, required: true },
  shipping: {
    address: {
      line1: { type: String, required: true },
      line2: { type: String },
      city: { type: String, required: true },
      state: { type: String, required: true },
      postalCode: { type: String, required: true },
      country: { type: String, required: true }
    },
    tracking: {
      number: { type: String },
      carrier: { type: String },
      url: { type: String }
    },
    status: { type: String },
    history: [{
      status: { type: String },
      timestamp: { type: Date },
      location: { type: String },
      details: { type: String }
    }],
    estimatedDelivery: { type: Date },
    deliveredAt: { type: Date }
  },
  transaction: {
    id: { type: Schema.Types.ObjectId, ref: 'Transaction' },
    status: { type: String },
    processedAt: { type: Date }
  },
  customization: { type: Schema.Types.Mixed },
  metadata: { type: Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Prevent model recompilation error
const Order = mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);

export default Order;
