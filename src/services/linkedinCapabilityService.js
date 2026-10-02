const LinkedInIntegration = require('../models/LinkedInIntegration');

/**
 * Default Capability Matrix for connected official LinkedIn OAuth applications.
 * Standard basic LinkedIn OAuth v2 provides OpenID/profileRead permissions.
 * Messaging & Connection actions require specific LinkedIn Enterprise Partnership approvals.
 */
const DEFAULT_CAPABILITIES = {
  profileRead: true,         // r_liteprofile or r_basicprofile / openid
  organizationRead: false,   // r_organization_social (Requires company page admin approval)
  messaging: false,          // w_member_social / Direct messaging API (Partner level)
  connectionActions: false,  // Connection requests (Not exposed via public API)
  search: false              // Member search API (Enterprise API restricted)
};

/**
 * Resolves current capability status for a user's LinkedIn connection
 */
const getUserCapabilities = async (userId) => {
  try {
    const integration = await LinkedInIntegration.findOne({ userId });
    if (!integration || integration.status !== 'CONNECTED') {
      return {
        status: 'DISCONNECTED',
        connected: false,
        capabilities: {
          profileRead: false,
          organizationRead: false,
          messaging: false,
          connectionActions: false,
          search: false
        },
        notice: 'LinkedIn account is not connected. Manual actions will be used for outreach tasks.'
      };
    }

    // Check if token expired
    if (integration.tokenExpiresAt && new Date() > new Date(integration.tokenExpiresAt)) {
      return {
        status: 'TOKEN_EXPIRED',
        connected: false,
        capabilities: {
          profileRead: false,
          organizationRead: false,
          messaging: false,
          connectionActions: false,
          search: false
        },
        notice: 'LinkedIn OAuth token has expired. Please re-authenticate your LinkedIn account.'
      };
    }

    return {
      status: integration.status,
      connected: true,
      accountName: integration.accountName,
      capabilities: integration.capabilities || DEFAULT_CAPABILITIES,
      grantedScopes: integration.grantedScopes || []
    };
  } catch (err) {
    return {
      status: 'ERROR',
      connected: false,
      capabilities: {
        profileRead: false,
        organizationRead: false,
        messaging: false,
        connectionActions: false,
        search: false
      },
      notice: 'Unable to check LinkedIn capabilities.'
    };
  }
};

/**
 * Checks if a specific action (e.g. 'messaging' or 'connectionActions') can be automatically sent via API.
 * If not, returns the manual fallback instructions.
 */
const checkActionCapability = async (userId, actionType, targetUrl) => {
  const cap = await getUserCapabilities(userId);
  
  const isSupported = cap.connected && cap.capabilities[actionType] === true;

  if (isSupported) {
    return {
      supported: true,
      canAutomate: true,
      manualActionRequired: false
    };
  }

  return {
    supported: false,
    canAutomate: false,
    manualActionRequired: true,
    manualReason: `Manual action required – LinkedIn API does not provide '${actionType}' capability for this application.`,
    actionUrl: targetUrl || 'https://www.linkedin.com'
  };
};

module.exports = {
  DEFAULT_CAPABILITIES,
  getUserCapabilities,
  checkActionCapability
};
