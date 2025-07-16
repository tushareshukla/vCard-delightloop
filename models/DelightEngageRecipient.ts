import mongoose, { Schema, Document } from 'mongoose';

interface IDelightEngageRecipient extends Document {
  firstName: string;
  email: string;
  phone?: string;
  jobTitle: string;
  company: string;
}

const DelightEngageRecipientSchema = new Schema<IDelightEngageRecipient>({
  firstName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String },
  jobTitle: { type: String, required: true },
  company: { type: String, required: true }
}, {
  timestamps: true
});

const DelightEngageRecipient = mongoose.models.DelightEngageRecipient || mongoose.model<IDelightEngageRecipient>('DelightEngageRecipient', DelightEngageRecipientSchema);

export default DelightEngageRecipient; 