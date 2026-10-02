const AuditLog = require('../models/AuditLog');

const getAuditLogs = async (req, res, next) => {
  try {
    const logs = await AuditLog.find({}).sort({ createdAt: -1 }).limit(100);
    res.json({ success: true, data: logs });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAuditLogs };
