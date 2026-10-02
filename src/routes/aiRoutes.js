const express = require('express');
const router = express.Router();
const { personalizeLead, scoreLead } = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);
router.post('/personalize', personalizeLead);
router.post('/score', scoreLead);

module.exports = router;
