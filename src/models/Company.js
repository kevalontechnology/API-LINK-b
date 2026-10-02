const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  website: { type: String },
  industry: { type: String },
  size: { type: String },
  location: { type: String },
  linkedinUrl: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Company', companySchema);
