const AuditLog = require('../models/AuditLog');

const logAudit = async ({ req, userId, userName, userRole, action, entity, entityId, metadata }) => {
  try {
    const log = new AuditLog({
      userId: userId || req?.user?._id,
      userName: userName || req?.user?.name || 'System',
      userRole: userRole || req?.user?.role || 'SYSTEM',
      action,
      entity,
      entityId: entityId ? String(entityId) : null,
      ipAddress: req ? (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1') : '127.0.0.1',
      userAgent: req ? req.headers['user-agent'] : 'System',
      metadata
    });
    await log.save();
    return log;
  } catch (err) {
    console.error('[Audit Service Error]', err.message);
  }
};

module.exports = { logAudit };
