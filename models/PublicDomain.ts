import mongoose, { Schema, Document } from 'mongoose';
 
export interface IPublicDomain extends Document {
    name: string;
    description: string;
    isActive: boolean;
}
 
const PublicDomainSchema: Schema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    description: {
        type: String,
        required: false
    },
    isActive: {
        type: Boolean,
        default: true
    }
});
 //export default mongoose.model<IPublicDomain>('PublicDomain', PublicDomainSchema);
// Prevent model recompilation error
const PublicDomain = mongoose.models.PublicDomain || mongoose.model<IPublicDomain>('PublicDomain', PublicDomainSchema);
 
export default PublicDomain;