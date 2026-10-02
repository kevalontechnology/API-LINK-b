const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'tapzy_super_secret_jwt_key_2026_kevalon');
      
      const user = await User.findById(decoded.id).select('-password');
      if (user) {
        req.user = user;
      } else {
        // Fallback for mock/test users if db is disconnected
        req.user = {
          _id: decoded.id,
          name: decoded.name || 'User',
          email: decoded.email || 'user@tapzy.in',
          role: decoded.role || 'SALES_BDE'
        };
      }
      return next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, token failed',
        code: 'UNAUTHORIZED'
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no token provided',
      code: 'NO_TOKEN'
    });
  }
};

module.exports = { protect };
