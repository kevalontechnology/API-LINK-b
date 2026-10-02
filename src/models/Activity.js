const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  leadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  type: { 
    type: String, 
    enum: [
      'LEAD_CREATED', 'LEAD_QUALIFIED', 'LINKEDIN_CONNECTED', 'MESSAGE_PREPARED', 
      'MESSAGE_SENT', 'REPLY_RECEIVED', 'FOLLOW_UP_DUE', 'DEMO_SCHEDULED', 
      'DEAL_WON', 'NOTE_ADDED', 'TASK_COMPLETED', 'STATUS_CHANGED'
    ],
    required: true 
  },
  description: { type: String, required: true },
  metadata: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

activitySchema.index({ leadId: 1 });
activitySchema.index({ createdAt: -1 });

module.exports = mongoose.model('Activity', activitySchema);
