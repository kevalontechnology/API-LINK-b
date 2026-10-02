const Setting = require('../models/Setting');
const { logAudit } = require('../services/auditService');

const DEFAULT_SETTINGS = {
  aiModel: 'gpt-4o-mini',
  aiTemperature: 0.7,
  aiMaxTokens: 500,
  defaultLeadStatus: 'NEW',
  defaultFollowUpDays: 3,
  defaultCurrency: 'INR',
  gstPercentage: 18,
  timezone: 'Asia/Kolkata',
  connectionTemplate: 'Hi {{first_name}}, came across your profile and your work at {{company}}. I’d be glad to connect and stay in touch.',
  introTemplate: 'Thanks for connecting, {{first_name}}.\n\nI’m working on Tapzy — a smart NFC digital business card that lets professionals share their contact details, WhatsApp, website, social profiles, services and more with a single tap or QR scan.\n\nI thought it could be relevant for your professional networking.',
  followUp1Template: 'Hi {{first_name}}, just following up.\n\nIf you\'re interested, I can share a quick Tapzy demo so you can see how the NFC card works in practice.',
  followUp2Template: 'Hi {{first_name}}, closing the loop here.\n\nIf a smart NFC business card is useful for your networking or business development, I’d be happy to show you Tapzy.\n\nOtherwise, no worries at all — happy to stay connected.'
};

const getSettings = async (req, res, next) => {
  try {
    const settings = await Setting.find({});
    const mapped = { ...DEFAULT_SETTINGS };

    settings.forEach(s => {
      mapped[s.key] = s.value;
    });

    res.json({ success: true, data: mapped });
  } catch (error) {
    next(error);
  }
};

const updateSettings = async (req, res, next) => {
  try {
    const updates = req.body;
    for (const [key, value] of Object.entries(updates)) {
      await Setting.findOneAndUpdate(
        { key },
        { key, value },
        { upsert: true, new: true }
      );
    }

    await logAudit({ req, action: 'SETTINGS_UPDATED', entity: 'Setting' });
    res.json({ success: true, message: 'Settings saved successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getSettings, updateSettings };
