const Lead = require('../models/Lead');
const Activity = require('../models/Activity');
const Task = require('../models/Task');
const Deal = require('../models/Deal');
const Message = require('../models/Message');
const { calculateLeadScore } = require('../services/aiService');
const { checkDuplicateLead } = require('../services/duplicateDetectionService');
const { handleStatusTransition } = require('../services/automationService');
const { previewImport, executeImport } = require('../services/importService');
const { logAudit } = require('../services/auditService');

const getLeads = async (req, res, next) => {
  try {
    const { 
      search, status, icpCategory, campaignId, ownerId, industry, location, jobTitle,
      minScore, followUpDue, page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' 
    } = req.query;

    const query = {};

    // Search term across Name, Company, Email, Phone, LinkedIn URL, Campaign
    if (search && search.trim()) {
      const term = search.trim();
      const regex = new RegExp(term, 'i');
      query.$or = [
        { fullName: regex },
        { company: regex },
        { email: regex },
        { phone: regex },
        { jobTitle: regex },
        { linkedinUrl: regex }
      ];
    }

    if (status) query.status = status;
    if (icpCategory) query.icpCategory = icpCategory;
    if (campaignId) query.campaignId = campaignId;
    if (ownerId) query.ownerId = ownerId;
    if (industry) query.industry = new RegExp(industry, 'i');
    if (location) query.location = new RegExp(location, 'i');
    if (jobTitle) query.jobTitle = new RegExp(jobTitle, 'i');
    if (minScore) query.leadScore = { $gte: Number(minScore) };

    if (followUpDue === 'true') {
      query.nextFollowUp = { $lte: new Date() };
    }

    // Role-based scope (Sales/BDE sees assigned leads unless Admin/Manager)
    if (req.user.role === 'SALES_BDE') {
      query.$or = query.$or 
        ? [{ $and: [{ ownerId: req.user._id }, { $or: query.$or }] }]
        : [{ ownerId: req.user._id }, { ownerId: { $exists: false } }];
    }

    const total = await Lead.countDocuments(query);
    const leads = await Lead.find(query)
      .populate('campaignId', 'name')
      .populate('ownerId', 'name email')
      .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({
      success: true,
      data: {
        leads,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

const getLeadById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const lead = await Lead.findById(id)
      .populate('campaignId', 'name description')
      .populate('ownerId', 'name email');

    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found', code: 'NOT_FOUND' });
    }

    // Fetch related records
    const activities = await Activity.find({ leadId: lead._id }).sort({ createdAt: -1 });
    const tasks = await Task.find({ leadId: lead._id }).sort({ dueDate: 1 });
    const deals = await Deal.find({ leadId: lead._id }).populate('productId').sort({ createdAt: -1 });
    const messages = await Message.find({ leadId: lead._id }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        lead,
        activities,
        tasks,
        deals,
        messages
      }
    });
  } catch (error) {
    next(error);
  }
};

const createLead = async (req, res, next) => {
  try {
    const leadData = req.body;
    if (!leadData.firstName || !leadData.linkedinUrl) {
      return res.status(400).json({ success: false, message: 'First name and LinkedIn URL are required', code: 'INVALID_INPUT' });
    }

    leadData.fullName = leadData.fullName || `${leadData.firstName} ${leadData.lastName || ''}`.trim();
    leadData.ownerId = leadData.ownerId || req.user._id;
    leadData.leadId = `TPZ-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;

    // Duplicate check
    const dupCheck = await checkDuplicateLead(leadData);
    if (dupCheck.isDuplicate) {
      return res.status(409).json({
        success: false,
        message: `Duplicate lead detected based on ${dupCheck.matchReason}`,
        code: 'DUPLICATE_LEAD',
        data: { existingLead: dupCheck.existingLead }
      });
    }

    // Calculate score
    const scoreResult = calculateLeadScore(leadData);
    leadData.leadScore = scoreResult.leadScore;
    leadData.icpCategory = scoreResult.icpCategory;

    const lead = await Lead.create(leadData);

    await Activity.create({
      leadId: lead._id,
      userId: req.user._id,
      type: 'LEAD_CREATED',
      description: `Lead created manually for ${lead.fullName} (${lead.jobTitle} at ${lead.company})`
    });

    await logAudit({ req, action: 'LEAD_CREATED', entity: 'Lead', entityId: lead._id });

    res.status(201).json({ success: true, data: lead });
  } catch (error) {
    next(error);
  }
};

const updateLead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const lead = await Lead.findById(id);

    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });

    // If status changed, handle automation workflow
    if (updates.status && updates.status !== lead.status) {
      await handleStatusTransition(lead._id, updates.status, req.user._id);
      delete updates.status; // handled by transition
    }

    // Recalculate score if profile fields changed
    const merged = { ...lead.toObject(), ...updates };
    const scoreResult = calculateLeadScore(merged);
    updates.leadScore = scoreResult.leadScore;
    updates.icpCategory = scoreResult.icpCategory;

    const updatedLead = await Lead.findByIdAndUpdate(id, updates, { new: true });

    await logAudit({ req, action: 'LEAD_UPDATED', entity: 'Lead', entityId: updatedLead._id });

    res.json({ success: true, data: updatedLead });
  } catch (error) {
    next(error);
  }
};

const deleteLead = async (req, res, next) => {
  try {
    const { id } = req.params;
    await Lead.findByIdAndDelete(id);
    await logAudit({ req, action: 'LEAD_DELETED', entity: 'Lead', entityId: id });
    res.json({ success: true, message: 'Lead deleted successfully' });
  } catch (error) {
    next(error);
  }
};

const previewImportLeads = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No CSV or XLSX file uploaded', code: 'NO_FILE' });
    }

    const preview = await previewImport(req.file.buffer, req.file.mimetype, req.file.originalname);
    res.json({ success: true, data: preview });
  } catch (error) {
    next(error);
  }
};

const executeImportLeads = async (req, res, next) => {
  try {
    const { parsedRows, duplicateStrategy, campaignId } = req.body;
    if (!parsedRows || !Array.isArray(parsedRows)) {
      return res.status(400).json({ success: false, message: 'Parsed rows array is required', code: 'INVALID_INPUT' });
    }

    const result = await executeImport(parsedRows, duplicateStrategy || 'skip', req.user._id, campaignId);

    await logAudit({
      req,
      action: 'LEADS_IMPORTED',
      entity: 'Lead',
      metadata: result
    });

    res.json({ success: true, message: 'Import completed', data: result });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getLeads,
  getLeadById,
  createLead,
  updateLead,
  deleteLead,
  previewImportLeads,
  executeImportLeads
};
