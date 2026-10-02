const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
const { 
  getLeads, getLeadById, createLead, updateLead, deleteLead, 
  previewImportLeads, executeImportLeads 
} = require('../controllers/leadController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', getLeads);
router.get('/:id', getLeadById);
router.post('/', createLead);
router.put('/:id', updateLead);
router.delete('/:id', deleteLead);

// Import endpoints
router.post('/import/preview', upload.single('file'), previewImportLeads);
router.post('/import/execute', executeImportLeads);

module.exports = router;
