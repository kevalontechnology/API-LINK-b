const User = require('../models/User');
const { logAudit } = require('../services/auditService');

const getUsers = async (req, res, next) => {
  try {
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    res.json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
};

const createUser = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, message: 'User already exists', code: 'DUPLICATE' });
    }
    const user = await User.create({ name, email, password, role });
    await logAudit({ req, action: 'USER_CREATED', entity: 'User', entityId: user._id });
    res.status(201).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, role, isActive } = req.body;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (name) user.name = name;
    if (role) user.role = role;
    if (typeof isActive === 'boolean') user.isActive = isActive;
    await user.save();

    await logAudit({ req, action: 'USER_UPDATED', entity: 'User', entityId: user._id });
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

module.exports = { getUsers, createUser, updateUser };
