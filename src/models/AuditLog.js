const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  userName: { type: String },
  userRole: { type: String },
  action: { type: String, required: true },
  entity: { type: String },
  entityId: { type: String },
  ipAddress: { type: String },
  userAgent: { type: String },
  metadata: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ userId: 1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
