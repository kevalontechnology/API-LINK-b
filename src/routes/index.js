const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const linkedinRoutes = require('./linkedinRoutes');
const leadRoutes = require('./leadRoutes');
const campaignRoutes = require('./campaignRoutes');
const taskRoutes = require('./taskRoutes');
const inboxRoutes = require('./inboxRoutes');
const dealRoutes = require('./dealRoutes');
const productRoutes = require('./productRoutes');
const reportRoutes = require('./reportRoutes');
const aiRoutes = require('./aiRoutes');
const settingRoutes = require('./settingRoutes');
const notificationRoutes = require('./notificationRoutes');
const auditRoutes = require('./auditRoutes');

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/linkedin', linkedinRoutes);
router.use('/leads', leadRoutes);
router.use('/campaigns', campaignRoutes);
router.use('/tasks', taskRoutes);
router.use('/inbox', inboxRoutes);
router.use('/deals', dealRoutes);
router.use('/products', productRoutes);
router.use('/reports', reportRoutes);
router.use('/ai', aiRoutes);
router.use('/settings', settingRoutes);
router.use('/notifications', notificationRoutes);
router.use('/audit-logs', auditRoutes);

module.exports = router;
