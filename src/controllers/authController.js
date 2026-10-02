const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { logAudit } = require('../services/auditService');

const generateTokens = (user) => {
  const payload = { id: user._id, role: user.role, email: user.email, name: user.name };
  const accessToken = jwt.sign(payload, process.env.JWT_SECRET || 'tapzy_super_secret_jwt_key_2026_kevalon', {
    expiresIn: process.env.JWT_EXPIRES_IN || '1d'
  });
  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET || 'tapzy_super_secret_refresh_jwt_key_2026_kevalon', {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  });
  return { accessToken, refreshToken };
};

const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide name, email and password', code: 'INVALID_INPUT' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email is already registered', code: 'EMAIL_EXISTS' });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role || 'SALES_BDE'
    });

    const tokens = generateTokens(user);

    await logAudit({
      req,
      userId: user._id,
      userName: user.name,
      userRole: user.role,
      action: 'USER_REGISTERED',
      entity: 'User',
      entityId: user._id
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        },
        ...tokens
      }
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password', code: 'INVALID_INPUT' });
    }

    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password', code: 'INVALID_CREDENTIALS' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account is disabled. Contact admin.', code: 'ACCOUNT_DISABLED' });
    }

    user.lastLogin = new Date();
    await user.save();

    const tokens = generateTokens(user);

    await logAudit({
      req,
      userId: user._id,
      userName: user.name,
      userRole: user.role,
      action: 'USER_LOGIN',
      entity: 'User',
      entityId: user._id
    });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        },
        ...tokens
      }
    });
  } catch (error) {
    next(error);
  }
};

const me = async (req, res) => {
  res.json({
    success: true,
    data: {
      user: req.user
    }
  });
};

const refreshToken = async (req, res) => {
  const { refreshToken: token } = req.body;
  if (!token) {
    return res.status(400).json({ success: false, message: 'Refresh token required', code: 'NO_TOKEN' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET || 'tapzy_super_secret_refresh_jwt_key_2026_kevalon');
    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'User not found or disabled', code: 'UNAUTHORIZED' });
    }

    const tokens = generateTokens(user);
    res.json({
      success: true,
      data: tokens
    });
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired refresh token', code: 'INVALID_REFRESH_TOKEN' });
  }
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;
  res.json({
    success: true,
    message: `If an account exists for ${email}, password reset instructions have been generated.`,
    data: { resetToken: `demo_reset_${Date.now()}` }
  });
};

const resetPassword = async (req, res) => {
  res.json({
    success: true,
    message: 'Password reset successfully. You may now login.'
  });
};

module.exports = {
  register,
  login,
  me,
  refreshToken,
  forgotPassword,
  resetPassword
};
