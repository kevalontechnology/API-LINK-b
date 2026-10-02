const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['NEW_LEAD', 'FOLLOW_UP_DUE', 'INTERESTED_LEAD', 'DEMO_REQUESTED', 'PAYMENT_PENDING', 'DEAL_WON', 'TASK_OVERDUE', 'SYSTEM'],
    default: 'SYSTEM'
  },
  read: { type: Boolean, default: false },
  link: { type: String }
}, { timestamps: true });

notificationSchema.index({ userId: 1, read: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
