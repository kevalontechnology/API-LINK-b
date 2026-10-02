const express = require('express');
const router = express.Router();
const { getSettings, updateSettings } = require('../controllers/settingController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/rbacMiddleware');

router.use(protect);
router.get('/', getSettings);
router.put('/', authorize('ADMIN'), updateSettings);

module.exports = router;
