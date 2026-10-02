const express = require('express');
const router = express.Router();
const { getDeals, createDeal, updateDeal } = require('../controllers/dealController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);
router.get('/', getDeals);
router.post('/', createDeal);
router.put('/:id', updateDeal);

module.exports = router;
