const Product = require('../models/Product');
const { logAudit } = require('../services/auditService');

const getProducts = async (req, res, next) => {
  try {
    const products = await Product.find({ isActive: true });
    res.json({ success: true, data: products });
  } catch (error) {
    next(error);
  }
};

const createProduct = async (req, res, next) => {
  try {
    const product = await Product.create(req.body);
    await logAudit({ req, action: 'PRODUCT_CREATED', entity: 'Product', entityId: product._id });
    res.status(201).json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    await logAudit({ req, action: 'PRODUCT_UPDATED', entity: 'Product', entityId: req.params.id });
    res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

module.exports = { getProducts, createProduct, updateProduct };
