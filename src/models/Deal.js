const mongoose = require('mongoose');

const dealSchema = new mongoose.Schema({
  leadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  productName: { type: String, default: 'Tapzy Digital Business Card' },
  quantity: { type: Number, default: 1, min: 1 },
  price: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  gstRate: { type: Number, default: 18 },
  finalAmount: { type: Number, required: true },
  stage: { 
    type: String, 
    enum: ['QUALIFIED', 'DEMO', 'PROPOSAL', 'PAYMENT_PENDING', 'WON', 'LOST'],
    default: 'QUALIFIED'
  },
  paymentStatus: { 
    type: String, 
    enum: ['PENDING', 'PAID', 'PARTIAL', 'REFUNDED'],
    default: 'PENDING'
  },
  salesOwnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  expectedCloseDate: { type: Date },
  notes: { type: String }
}, { timestamps: true });

dealSchema.index({ leadId: 1 });
dealSchema.index({ salesOwnerId: 1 });
dealSchema.index({ stage: 1 });

module.exports = mongoose.model('Deal', dealSchema);
