const Task = require('../models/Task');
const Lead = require('../models/Lead');
const Activity = require('../models/Activity');
const { logAudit } = require('../services/auditService');

const getTasks = async (req, res, next) => {
  try {
    const { status, taskType, priority, assignedTo, overdue } = req.query;
    const query = {};

    if (status) query.status = status;
    if (taskType) query.taskType = taskType;
    if (priority) query.priority = priority;
    if (assignedTo) query.assignedTo = assignedTo;

    if (overdue === 'true') {
      query.dueDate = { $lt: new Date() };
      query.status = { $in: ['PENDING', 'IN_PROGRESS'] };
    }

    if (req.user.role === 'SALES_BDE') {
      query.assignedTo = req.user._id;
    }

    const tasks = await Task.find(query)
      .populate('leadId', 'fullName jobTitle company linkedinUrl status email phone profilePhoto')
      .populate('campaignId', 'name')
      .populate('assignedTo', 'name email')
      .sort({ dueDate: 1 });

    res.json({ success: true, data: tasks });
  } catch (error) {
    next(error);
  }
};

const createTask = async (req, res, next) => {
  try {
    const data = req.body;
    data.taskId = `TSK-${Date.now().toString().slice(-6)}`;
    data.assignedTo = data.assignedTo || req.user._id;
    
    // Check manual fallback
    if (!data.manualActionUrl && data.leadId) {
      const lead = await Lead.findById(data.leadId);
      if (lead) data.manualActionUrl = lead.linkedinUrl;
    }

    const task = await Task.create(data);
    await logAudit({ req, action: 'TASK_CREATED', entity: 'Task', entityId: task._id });
    res.status(201).json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
};

const updateTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    if (updates.status === 'COMPLETED') {
      updates.completedAt = new Date();
    }

    const task = await Task.findByIdAndUpdate(id, updates, { new: true })
      .populate('leadId');

    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    if (updates.status === 'COMPLETED' && task.leadId) {
      await Activity.create({
        leadId: task.leadId._id,
        userId: req.user._id,
        type: 'TASK_COMPLETED',
        description: `Task '${task.taskType}' completed: ${task.notes || 'Outreach action executed'}`
      });
    }

    await logAudit({ req, action: 'TASK_UPDATED', entity: 'Task', entityId: id });
    res.json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
};

const deleteTask = async (req, res, next) => {
  try {
    await Task.findByIdAndDelete(req.params.id);
    await logAudit({ req, action: 'TASK_DELETED', entity: 'Task', entityId: req.params.id });
    res.json({ success: true, message: 'Task deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTasks,
  createTask,
  updateTask,
  deleteTask
};
