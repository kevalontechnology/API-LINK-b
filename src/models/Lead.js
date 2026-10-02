const mongoose = require('mongoose');

const leadStatuses = [
  'NEW', 'QUALIFIED', 'READY_FOR_OUTREACH', 'CONNECTION_PENDING', 'CONNECTED',
  'MESSAGE_READY', 'MESSAGE_SENT', 'FOLLOW_UP_1_DUE', 'FOLLOW_UP_1_SENT',
  'FOLLOW_UP_2_DUE', 'FOLLOW_UP_2_SENT', 'REPLIED', 'INTERESTED',
  'DEMO_REQUESTED', 'DEMO_SCHEDULED', 'DEMO_COMPLETED', 'PROPOSAL_SENT',
  'PAYMENT_PENDING', 'WON', 'LOST', 'NOT_INTERESTED', 'NO_RESPONSE'
];

const icpCategories = ['HIGH PRIORITY', 'QUALIFIED', 'NORMAL', 'LOW PRIORITY'];

const leadSchema = new mongoose.Schema({
  leadId: { type: String, unique: true, sparse: true },
  firstName: { type: String, required: true },
  lastName: { type: String },
  fullName: { type: String, required: true },
  profilePhoto: { type: String },
  jobTitle: { type: String, required: true },
  company: { type: String, required: true },
  industry: { type: String },
  location: { type: String },
  linkedinUrl: { type: String, required: true, trim: true },
  website: { type: String },
  email: { type: String, lowercase: true, trim: true },
  phone: { type: String },
  leadScore: { type: Number, default: 0, min: 0, max: 100 },
  icpCategory: { type: String, enum: icpCategories, default: 'NORMAL' },
  status: { type: String, enum: leadStatuses, default: 'NEW' },
  campaignId: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign' },
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  lastContact: { type: Date },
  nextFollowUp: { type: Date },
  interestLevel: { type: String, default: 'UNKNOWN' },
  companySize: { type: String },
  customerType: { type: String },
  potentialUseCase: { type: String },
  notes: { type: String },
  importedAt: { type: Date, default: Date.now },
  importedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// Required indexes per prompt specifications
leadSchema.index({ linkedinUrl: 1 });
leadSchema.index({ email: 1 });
leadSchema.index({ company: 1 });
leadSchema.index({ status: 1 });
leadSchema.index({ campaignId: 1 });
leadSchema.index({ ownerId: 1 });

module.exports = mongoose.model('Lead', leadSchema);
