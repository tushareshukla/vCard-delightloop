import mongoose, { Schema, Document } from 'mongoose';

interface IEmailVerificationToken extends Document {
  userId: mongoose.Types.ObjectId;
  token: string;
  expiresAt: Date;
}

const EmailVerificationTokenSchema = new Schema<IEmailVerificationToken>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  token: { type: String, required: true },
  expiresAt: { type: Date, required: true }
});

const EmailVerificationToken = mongoose.models.EmailVerificationToken || 
  mongoose.model<IEmailVerificationToken>('EmailVerificationToken', EmailVerificationTokenSchema);

export default EmailVerificationToken; 