const Lead = require('../models/Lead');
const Message = require('../models/Message');
const Activity = require('../models/Activity');
const { generatePersonalizedOutreach, calculateLeadScore } = require('../services/aiService');
const { logAudit } = require('../services/auditService');

const personalizeLead = async (req, res, next) => {
  try {
    const { leadId, leadData, customNotes } = req.body;
    let targetLead = leadData;

    if (leadId) {
      const dbLead = await Lead.findById(leadId);
      if (!dbLead) return res.status(404).json({ success: false, message: 'Lead not found' });
      targetLead = dbLead.toObject();
    }

    if (!targetLead || (!targetLead.fullName && !targetLead.firstName)) {
      return res.status(400).json({ success: false, message: 'Lead details or leadId are required', code: 'INVALID_INPUT' });
    }

    const aiResult = await generatePersonalizedOutreach({
      lead: targetLead,
      customPromptNotes: customNotes,
      userId: req.user._id
    });

    if (leadId) {
      // Create draft messages in DB
      await Message.create({
        leadId,
        campaignId: targetLead.campaignId,
        senderId: req.user._id,
        type: 'CONNECTION',
        content: aiResult.connectionMessage,
        status: 'READY',
        channel: 'LINKEDIN_MANUAL',
        aiGenerated: true
      });

      await Message.create({
        leadId,
        campaignId: targetLead.campaignId,
        senderId: req.user._id,
        type: 'INTRO',
        content: aiResult.introductionMessage,
        status: 'DRAFT',
        channel: 'LINKEDIN_MANUAL',
        aiGenerated: true
      });

      await Activity.create({
        leadId,
        userId: req.user._id,
        type: 'MESSAGE_PREPARED',
        description: 'AI Personalization & Outreach Messages generated successfully.'
      });

      // Update lead status to MESSAGE_READY if NEW
      if (targetLead.status === 'NEW' || targetLead.status === 'QUALIFIED') {
        await Lead.findByIdAndUpdate(leadId, { status: 'MESSAGE_READY' });
      }
    }

    await logAudit({ req, action: 'AI_PERSONALIZATION_GENERATED', entity: 'Lead', entityId: leadId || null });

    res.json({
      success: true,
      message: 'AI Personalization generated successfully',
      data: aiResult
    });
  } catch (error) {
    next(error);
  }
};

const scoreLead = async (req, res, next) => {
  try {
    const leadData = req.body;
    const result = calculateLeadScore(leadData);

    if (leadData._id) {
      await Lead.findByIdAndUpdate(leadData._id, result);
    }

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  personalizeLead,
  scoreLead
};
