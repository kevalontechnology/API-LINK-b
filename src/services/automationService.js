const Task = require('../models/Task');
const Lead = require('../models/Lead');
const Activity = require('../models/Activity');
const Notification = require('../models/Notification');
const { checkActionCapability } = require('./linkedinCapabilityService');

/**
 * Trigger automated tasks based on Lead status updates
 */
const handleStatusTransition = async (leadId, newStatus, userId) => {
  try {
    const lead = await Lead.findById(leadId);
    if (!lead) return;

    const oldStatus = lead.status;
    lead.status = newStatus;
    lead.lastContact = new Date();
    await lead.save();

    // Log Activity
    await Activity.create({
      leadId: lead._id,
      userId: userId || lead.ownerId,
      type: 'STATUS_CHANGED',
      description: `Status changed from ${oldStatus} to ${newStatus}`
    }).catch(() => {});

    // Check capability
    const capability = await checkActionCapability(userId || lead.ownerId, 'messaging', lead.linkedinUrl);

    // Automation Rules
    if (newStatus === 'CONNECTED') {
      // Create Intro Task
      const dueDate = new Date();
      await Task.create({
        leadId: lead._id,
        campaignId: lead.campaignId,
        taskType: 'MESSAGE',
        dueDate,
        priority: 'HIGH',
        assignedTo: userId || lead.ownerId,
        status: 'PENDING',
        notes: `Send post-connection Tapzy introduction to ${lead.fullName}.`,
        isManual: capability.manualActionRequired,
        manualReason: capability.manualReason,
        manualActionUrl: lead.linkedinUrl
      });

      await Notification.create({
        userId: userId || lead.ownerId,
        title: `LinkedIn Connected: ${lead.fullName}`,
        message: `Lead ${lead.fullName} is now CONNECTED. Outreach task created: Send Tapzy Intro.`,
        type: 'NEW_LEAD',
        link: `/leads/${lead._id}`
      }).catch(() => {});
    } 
    else if (newStatus === 'MESSAGE_SENT') {
      // Schedule Follow-up 1 in 3 days
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 3);
      lead.nextFollowUp = dueDate;
      await lead.save();

      await Task.create({
        leadId: lead._id,
        campaignId: lead.campaignId,
        taskType: 'FOLLOW_UP',
        dueDate,
        priority: 'MEDIUM',
        assignedTo: userId || lead.ownerId,
        status: 'PENDING',
        notes: `Follow-up 1 due for ${lead.fullName} if no reply received.`,
        isManual: true,
        manualReason: 'Manual LinkedIn outreach required',
        manualActionUrl: lead.linkedinUrl
      });
    }
    else if (newStatus === 'FOLLOW_UP_1_SENT') {
      // Schedule Follow-up 2 in 5 days
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 5);
      lead.nextFollowUp = dueDate;
      await lead.save();

      await Task.create({
        leadId: lead._id,
        campaignId: lead.campaignId,
        taskType: 'FOLLOW_UP',
        dueDate,
        priority: 'HIGH',
        assignedTo: userId || lead.ownerId,
        status: 'PENDING',
        notes: `Final Follow-up 2 due for ${lead.fullName}.`,
        isManual: true,
        manualReason: 'Manual LinkedIn outreach required',
        manualActionUrl: lead.linkedinUrl
      });
    }
    else if (newStatus === 'FOLLOW_UP_2_SENT') {
      // No reply after follow up 2 -> NO_RESPONSE after 5 days
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 5);
      lead.nextFollowUp = dueDate;
      await lead.save();
    }
    else if (newStatus === 'INTERESTED' || newStatus === 'DEMO_REQUESTED') {
      // Create Demo task
      await Task.create({
        leadId: lead._id,
        campaignId: lead.campaignId,
        taskType: 'DEMO',
        dueDate: new Date(),
        priority: 'HIGH',
        assignedTo: userId || lead.ownerId,
        status: 'PENDING',
        notes: `High-intent prospect ${lead.fullName} requested Tapzy demo or product details!`,
        isManual: false
      });

      await Notification.create({
        userId: userId || lead.ownerId,
        title: `🔥 High Intent Prospect: ${lead.fullName}`,
        message: `${lead.fullName} is interested in Tapzy. Schedule a demo or send product proposal.`,
        type: 'INTERESTED_LEAD',
        link: `/leads/${lead._id}`
      }).catch(() => {});
    }

    return lead;
  } catch (err) {
    console.error('[Automation Service Error]', err.message);
  }
};

module.exports = {
  handleStatusTransition
};
