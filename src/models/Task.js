const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  taskId: { type: String, unique: true, sparse: true },
  leadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', required: true },
  campaignId: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign' },
  taskType: { 
    type: String, 
    enum: ['CONNECTION', 'MESSAGE', 'FOLLOW_UP', 'CALL', 'DEMO', 'EMAIL', 'PAYMENT', 'OTHER'],
    required: true 
  },
  dueDate: { type: Date, required: true },
  priority: { type: String, enum: ['HIGH', 'MEDIUM', 'LOW'], default: 'MEDIUM' },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { 
    type: String, 
    enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED', 'CANCELLED'],
    default: 'PENDING' 
  },
  notes: { type: String },
  isManual: { type: Boolean, default: true },
  manualReason: { type: String },
  manualActionUrl: { type: String },
  completedAt: { type: Date }
}, { timestamps: true });

taskSchema.index({ dueDate: 1 });
taskSchema.index({ leadId: 1 });
taskSchema.index({ assignedTo: 1 });
taskSchema.index({ status: 1 });

module.exports = mongoose.model('Task', taskSchema);
