import mongoose, { Document, Schema } from "mongoose";

interface IUnipileResponse extends Document {
    account_id?: string;
    name?: string;
}

const UnipileResponseSchema: Schema = new Schema(
    {
        account_id: { type: String },
        name: { type: String },
    },
    { timestamps: true } // Automatically manages createdAt and updatedAt fields
);

export default mongoose.models.UnipileResponse || mongoose.model<IUnipileResponse>("UnipileResponse", UnipileResponseSchema);
