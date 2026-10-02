const express = require('express');
const router = express.Router();
const { getAuditLogs } = require('../controllers/auditController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/rbacMiddleware');

router.use(protect);
router.get('/', authorize('ADMIN', 'MANAGER'), getAuditLogs);

module.exports = router;
