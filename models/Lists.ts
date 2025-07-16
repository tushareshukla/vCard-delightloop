import mongoose, { Schema, Document } from 'mongoose';

interface IList extends Document {
  organizationId: mongoose.Types.ObjectId;
  creatorId: mongoose.Types.ObjectId;
  name: string;
  description: string;
  source: {
    manual: boolean;
    csv: boolean;
    crm: {
      type: string;
    };
  };
  recipients: Array<{
    recipientId: mongoose.Types.ObjectId;
    addedAt: Date;
  }>;
  tags: string[];
  metrics: {
    totalRecipients: number;
    campaignsUsed: number;
    playbooksUsed: number;
  };
  status: string;
  usage: {
    campaignIds: mongoose.Types.ObjectId[];
    playbookIds: mongoose.Types.ObjectId[];
  };
}

const ListSchema = new Schema<IList>({
  organizationId: { type: Schema.Types.ObjectId, required: true },
  creatorId: { type: Schema.Types.ObjectId, required: true },
  name: { type: String, required: true },
  description: { type: String },
  source: {
    manual: { type: Boolean, default: false },
    csv: { type: Boolean, default: false },
    crm: {
      type: { type: String }
    }
  },
  recipients: [{
    recipientId: { type: Schema.Types.ObjectId, ref: 'Recipients' },
    addedAt: { type: Date, default: Date.now }
  }],
  tags: [{ type: String }],
  metrics: {
    totalRecipients: { type: Number, default: 0 },
    campaignsUsed: { type: Number, default: 0 },
    playbooksUsed: { type: Number, default: 0 }
  },
  status: { type: String, default: 'pending' },
  usage: {
    campaignIds: [{ type: Schema.Types.ObjectId, ref: 'Campaign' }],
    playbookIds: [{ type: Schema.Types.ObjectId }]
  }
}, {
  timestamps: true
});

// Prevent model recompilation error
const List = mongoose.models.List || mongoose.model<IList>('List', ListSchema);

export default List; 