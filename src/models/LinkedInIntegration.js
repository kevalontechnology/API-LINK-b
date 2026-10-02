const mongoose = require('mongoose');

const linkedInIntegrationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  status: { 
    type: String, 
    enum: ['CONNECTED', 'DISCONNECTED', 'TOKEN_EXPIRED', 'REAUTH_REQUIRED', 'ERROR'],
    default: 'DISCONNECTED' 
  },
  accountId: { type: String },
  accountName: { type: String },
  email: { type: String },
  profilePicture: { type: String },
  accessToken: { type: String }, // Encrypted at rest
  refreshToken: { type: String }, // Encrypted at rest
  tokenExpiresAt: { type: Date },
  lastSync: { type: Date },
  // Dynamic capability matrix
  capabilities: {
    profileRead: { type: Boolean, default: false },
    organizationRead: { type: Boolean, default: false },
    messaging: { type: Boolean, default: false },
    connectionActions: { type: Boolean, default: false },
    search: { type: Boolean, default: false }
  },
  grantedScopes: [{ type: String }],
  errorMessage: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('LinkedInIntegration', linkedInIntegrationSchema);
