import mongoose, { Schema, Document } from 'mongoose';

interface IDelightEngageList extends Document {
  organizationId: mongoose.Types.ObjectId;
  creatorId: mongoose.Types.ObjectId;
  name: string;
  recipients: Array<{
    recipientId: mongoose.Types.ObjectId;
    addedAt: Date;
  }>;
  status: string;
}

const DelightEngageListSchema = new Schema<IDelightEngageList>({
  organizationId: { type: Schema.Types.ObjectId, required: true },
  creatorId: { type: Schema.Types.ObjectId, required: true },
  name: { type: String, required: true },
  recipients: [{
    recipientId: { type: Schema.Types.ObjectId, ref: 'DelightEngageRecipient' },
    addedAt: { type: Date, default: Date.now }
  }],
  status: { type: String, default: 'active' }
}, {
  timestamps: true
});

const DelightEngageList = mongoose.models.DelightEngageList || mongoose.model<IDelightEngageList>('DelightEngageList', DelightEngageListSchema);

export default DelightEngageList; 