const Message = require('../models/Message');
const Lead = require('../models/Lead');
const Activity = require('../models/Activity');
const { classifyReply } = require('../services/aiService');
const { handleStatusTransition } = require('../services/automationService');

const getInbox = async (req, res, next) => {
  try {
    const messages = await Message.find({ responseText: { $exists: true, $ne: '' } })
      .populate('leadId', 'fullName jobTitle company status linkedinUrl email profilePhoto')
      .sort({ updatedAt: -1 });

    res.json({ success: true, data: messages });
  } catch (error) {
    next(error);
  }
};

const recordReply = async (req, res, next) => {
  try {
    const { leadId, responseText } = req.body;
    if (!leadId || !responseText) {
      return res.status(400).json({ success: false, message: 'leadId and responseText are required', code: 'INVALID_INPUT' });
    }

    const lead = await Lead.findById(leadId);
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });

    // AI Classification
    const classification = await classifyReply(responseText, lead, req.user._id);

    const message = await Message.create({
      leadId: lead._id,
      campaignId: lead.campaignId,
      senderId: req.user._id,
      type: 'CUSTOM',
      content: 'Outreach response logged',
      status: 'SENT',
      channel: 'LINKEDIN_MANUAL',
      sentAt: new Date(),
      responseText,
      responseIntent: classification.category
    });

    await Activity.create({
      leadId: lead._id,
      userId: req.user._id,
      type: 'REPLY_RECEIVED',
      description: `Received prospect reply. AI Category: ${classification.category} (${classification.intent})`,
      metadata: { classification }
    });

    // Handle status update based on intent
    if (classification.category === 'INTERESTED' || classification.category === 'ASKED_FOR_DEMO') {
      await handleStatusTransition(lead._id, 'INTERESTED', req.user._id);
    } else if (classification.category === 'NOT_INTERESTED') {
      await handleStatusTransition(lead._id, 'NOT_INTERESTED', req.user._id);
    } else {
      await handleStatusTransition(lead._id, 'REPLIED', req.user._id);
    }

    res.json({
      success: true,
      data: {
        message,
        classification
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getInbox,
  recordReply
};
