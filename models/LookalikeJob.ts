import mongoose from 'mongoose';

const lookalikeJobSchema = new mongoose.Schema({
  listId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'List',
    required: true
  },
  campaignId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign'
  },
  onComplete: {
    updateCampaign: { type: Boolean },
    status: { type: String }
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed', 'failed'],
    default: 'pending'
  },
  sourceProfiles: [{
    type: String
  }],
  targetCount: {
    type: Number,
    required: true
  },
  vendor: {
    type: String,
    required: true
  },
  error: String,
  result: [{
    id: String,
    name: String,
    email: String,
    linkedin: String,
    company: String,
    jobtitle: String,
    photo: String,
    country: String,
    city: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.models.LookalikeJob || mongoose.model('LookalikeJob', lookalikeJobSchema); 