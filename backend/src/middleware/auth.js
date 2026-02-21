const jwt = require('jsonwebtoken');
const { query } = require('../config/database');
const logger = require('../utils/logger');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Verify user still exists and is active
    let userResult;
    if (decoded.role === 'admin' || decoded.role === 'super_admin') {
      userResult = await query('SELECT id, name, email, role, is_active FROM admins WHERE id = $1', [decoded.id]);
    } else if (decoded.role === 'doctor') {
      userResult = await query('SELECT id, name, email, role, is_active FROM doctors WHERE id = $1', [decoded.id]);
    } else {
      return res.status(401).json({ success: false, message: 'Invalid role' });
    }

    if (!userResult.rows[0] || !userResult.rows[0].is_active) {
      return res.status(401).json({ success: false, message: 'Account deactivated' });
    }

    req.user = { ...decoded, ...userResult.rows[0] };
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired' });
    }
    logger.error('Auth middleware error', error);
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      return res.status(403).json({ success: false, message: 'Insufficient permissions' });
    }
    next();
  };
};

module.exports = { authenticate, authorize };
