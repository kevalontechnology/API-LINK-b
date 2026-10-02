const express = require('express');
const router = express.Router();
const { getCampaigns, getCampaignById, createCampaign, updateCampaign, deleteCampaign } = require('../controllers/campaignController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);
router.get('/', getCampaigns);
router.get('/:id', getCampaignById);
router.post('/', createCampaign);
router.put('/:id', updateCampaign);
router.delete('/:id', deleteCampaign);

module.exports = router;
