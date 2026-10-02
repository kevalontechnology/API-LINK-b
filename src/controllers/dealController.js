const Deal = require('../models/Deal');
const Lead = require('../models/Lead');
const Activity = require('../models/Activity');
const Notification = require('../models/Notification');
const { handleStatusTransition } = require('../services/automationService');
const { logAudit } = require('../services/auditService');

const getDeals = async (req, res, next) => {
  try {
    const { stage, paymentStatus } = req.query;
    const query = {};
    if (stage) query.stage = stage;
    if (paymentStatus) query.paymentStatus = paymentStatus;

    if (req.user.role === 'SALES_BDE') {
      query.salesOwnerId = req.user._id;
    }

    const deals = await Deal.find(query)
      .populate('leadId', 'fullName company email phone linkedinUrl status profilePhoto')
      .populate('productId', 'name price')
      .populate('salesOwnerId', 'name email')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: deals });
  } catch (error) {
    next(error);
  }
};

const createDeal = async (req, res, next) => {
  try {
    const { leadId, productId, quantity = 1, price, discount = 0, gstRate = 18, stage, paymentStatus, notes } = req.body;
    
    if (!leadId || !price) {
      return res.status(400).json({ success: false, message: 'leadId and price are required', code: 'INVALID_INPUT' });
    }

    // Dynamic price calculation: (Price * Quantity - Discount) + GST
    const base = Math.max(0, (Number(price) * Number(quantity)) - Number(discount));
    const gstAmount = (base * Number(gstRate)) / 100;
    const finalAmount = Math.round(base + gstAmount);

    const deal = await Deal.create({
      leadId,
      productId,
      quantity,
      price,
      discount,
      gstRate,
      finalAmount,
      stage: stage || 'QUALIFIED',
      paymentStatus: paymentStatus || 'PENDING',
      salesOwnerId: req.user._id,
      notes
    });

    await Activity.create({
      leadId,
      userId: req.user._id,
      type: 'LEAD_QUALIFIED',
      description: `New deal created for ₹${finalAmount.toLocaleString('en-IN')} (Stage: ${deal.stage})`
    });

    await logAudit({ req, action: 'DEAL_CREATED', entity: 'Deal', entityId: deal._id });

    res.status(201).json({ success: true, data: deal });
  } catch (error) {
    next(error);
  }
};

const updateDeal = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Recalculate amount if price, quantity, discount or gstRate changed
    if (updates.price !== undefined || updates.quantity !== undefined || updates.discount !== undefined || updates.gstRate !== undefined) {
      const deal = await Deal.findById(id);
      const price = updates.price !== undefined ? updates.price : deal.price;
      const quantity = updates.quantity !== undefined ? updates.quantity : deal.quantity;
      const discount = updates.discount !== undefined ? updates.discount : deal.discount;
      const gstRate = updates.gstRate !== undefined ? updates.gstRate : deal.gstRate;

      const base = Math.max(0, (Number(price) * Number(quantity)) - Number(discount));
      const gstAmount = (base * Number(gstRate)) / 100;
      updates.finalAmount = Math.round(base + gstAmount);
    }

    const updatedDeal = await Deal.findByIdAndUpdate(id, updates, { new: true })
      .populate('leadId');

    if (!updatedDeal) return res.status(404).json({ success: false, message: 'Deal not found' });

    // If stage updated to WON or LOST
    if (updates.stage === 'WON') {
      await handleStatusTransition(updatedDeal.leadId._id, 'WON', req.user._id);
      await Notification.create({
        userId: req.user._id,
        title: `🎉 Deal Won! ₹${updatedDeal.finalAmount.toLocaleString('en-IN')}`,
        message: `Congratulations! Deal with ${updatedDeal.leadId.fullName} (${updatedDeal.leadId.company}) marked as WON.`,
        type: 'DEAL_WON',
        link: `/leads/${updatedDeal.leadId._id}`
      }).catch(() => {});
    } else if (updates.stage === 'LOST') {
      await handleStatusTransition(updatedDeal.leadId._id, 'LOST', req.user._id);
    }

    await logAudit({ req, action: updates.stage === 'WON' ? 'DEAL_WON' : 'DEAL_UPDATED', entity: 'Deal', entityId: id });

    res.json({ success: true, data: updatedDeal });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDeals,
  createDeal,
  updateDeal
};
