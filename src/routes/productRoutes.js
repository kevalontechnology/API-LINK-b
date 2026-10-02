const express = require('express');
const router = express.Router();
const { getProducts, createProduct, updateProduct } = require('../controllers/productController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/rbacMiddleware');

router.use(protect);
router.get('/', getProducts);
router.post('/', authorize('ADMIN', 'MANAGER'), createProduct);
router.put('/:id', authorize('ADMIN', 'MANAGER'), updateProduct);

module.exports = router;
