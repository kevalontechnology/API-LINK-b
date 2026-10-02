const Notification = require('../models/Notification');

const getNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({
      $or: [{ userId: req.user._id }, { userId: { $exists: false } }]
    }).sort({ createdAt: -1 }).limit(20);

    const unreadCount = await Notification.countDocuments({
      $or: [{ userId: req.user._id }, { userId: { $exists: false } }],
      read: false
    });

    res.json({ success: true, data: { notifications, unreadCount } });
  } catch (error) {
    next(error);
  }
};

const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (id === 'read-all') {
      await Notification.updateMany({ userId: req.user._id }, { read: true });
    } else {
      await Notification.findByIdAndUpdate(id, { read: true });
    }
    res.json({ success: true, message: 'Notifications marked as read' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getNotifications, markAsRead };
