const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  leadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', required: true },
  campaignId: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign' },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  type: { type: String, enum: ['CONNECTION', 'INTRO', 'FOLLOW_UP_1', 'FOLLOW_UP_2', 'CUSTOM'], required: true },
  content: { type: String, required: true },
  status: { type: String, enum: ['DRAFT', 'READY', 'SENT', 'FAILED'], default: 'DRAFT' },
  channel: { type: String, enum: ['LINKEDIN_DIRECT', 'LINKEDIN_MANUAL', 'EMAIL'], default: 'LINKEDIN_MANUAL' },
  sentAt: { type: Date },
  responseText: { type: String },
  responseIntent: { type: String },
  aiGenerated: { type: Boolean, default: false }
}, { timestamps: true });

messageSchema.index({ leadId: 1 });

module.exports = mongoose.model('Message', messageSchema);
