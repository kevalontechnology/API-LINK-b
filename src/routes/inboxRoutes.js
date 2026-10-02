const express = require('express');
const router = express.Router();
const { getInbox, recordReply } = require('../controllers/inboxController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);
router.get('/', getInbox);
router.post('/record-reply', recordReply);

module.exports = router;
