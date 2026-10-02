const mongoose = require('mongoose');

const aiUsageSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  promptType: { type: String, required: true },
  tokensUsed: { type: Number, default: 0 },
  cost: { type: Number, default: 0 },
  model: { type: String, default: 'gpt-4o-mini' }
}, { timestamps: true });

module.exports = mongoose.model('AIUsage', aiUsageSchema);
