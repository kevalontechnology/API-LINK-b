const Campaign = require('../models/Campaign');
const Lead = require('../models/Lead');
const { logAudit } = require('../services/auditService');

const getCampaigns = async (req, res, next) => {
  try {
    const campaigns = await Campaign.find({}).sort({ createdAt: -1 }).populate('createdBy', 'name email');
    
    // Attach lead counts per campaign
    const campaignList = await Promise.all(campaigns.map(async (c) => {
      const leadCount = await Lead.countDocuments({ campaignId: c._id });
      const convertedCount = await Lead.countDocuments({ campaignId: c._id, status: 'WON' });
      return {
        ...c.toObject(),
        leadCount,
        convertedCount
      };
    }));

    res.json({ success: true, data: campaignList });
  } catch (error) {
    next(error);
  }
};

const getCampaignById = async (req, res, next) => {
  try {
    const campaign = await Campaign.findById(req.params.id).populate('createdBy', 'name email');
    if (!campaign) return res.status(404).json({ success: false, message: 'Campaign not found' });
    
    const leads = await Lead.find({ campaignId: campaign._id }).limit(50);
    res.json({ success: true, data: { campaign, leads } });
  } catch (error) {
    next(error);
  }
};

const createCampaign = async (req, res, next) => {
  try {
    const data = req.body;
    data.createdBy = req.user._id;
    const campaign = await Campaign.create(data);
    
    await logAudit({ req, action: 'CAMPAIGN_CREATED', entity: 'Campaign', entityId: campaign._id });
    res.status(201).json({ success: true, data: campaign });
  } catch (error) {
    next(error);
  }
};

const updateCampaign = async (req, res, next) => {
  try {
    const campaign = await Campaign.findByIdAndUpdate(req.params.id, req.body, { new: true });
    await logAudit({ req, action: 'CAMPAIGN_UPDATED', entity: 'Campaign', entityId: req.params.id });
    res.json({ success: true, data: campaign });
  } catch (error) {
    next(error);
  }
};

const deleteCampaign = async (req, res, next) => {
  try {
    await Campaign.findByIdAndDelete(req.params.id);
    await logAudit({ req, action: 'CAMPAIGN_DELETED', entity: 'Campaign', entityId: req.params.id });
    res.json({ success: true, message: 'Campaign deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCampaigns,
  getCampaignById,
  createCampaign,
  updateCampaign,
  deleteCampaign
};
