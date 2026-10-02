const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  targetJobTitles: [{ type: String }],
  targetIndustries: [{ type: String }],
  targetLocations: [{ type: String }],
  targetCompanySize: { type: String },
  leadScoreRequirement: { type: Number, default: 40 },
  connectionTemplate: { type: String },
  introTemplate: { type: String },
  followUp1Template: { type: String },
  followUp2Template: { type: String },
  status: { type: String, enum: ['DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED'], default: 'DRAFT' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Campaign', campaignSchema);
