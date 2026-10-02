const express = require('express');
const router = express.Router();
const { getStatus, getOAuthUrl, handleCallback, disconnect, updateCapabilities } = require('../controllers/linkedinController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);
router.get('/status', getStatus);
router.get('/oauth-url', getOAuthUrl);
router.post('/callback', handleCallback);
router.post('/disconnect', disconnect);
router.put('/capabilities', updateCapabilities);

module.exports = router;
