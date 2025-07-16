import mongoose, { Schema, Document } from "mongoose";

export interface IShortUrl extends Document {
  shortCode: string;
  longUrl: string;
  createdAt: Date;
  clicks: number;
}

const ShortUrlSchema = new Schema<IShortUrl>(
  {
    shortCode: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    longUrl: {
      type: String,
      required: true,
    },
    clicks: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

const ShortUrl = mongoose.models.ShortUrl || 
  mongoose.model<IShortUrl>("ShortUrl", ShortUrlSchema);

export default ShortUrl; 