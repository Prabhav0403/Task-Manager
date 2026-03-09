const { verifyAccessToken } = require('../utils/jwt.utils');
const { sendError } = require('../utils/response.utils');
const User = require('../models/User.model');
const logger = require('../utils/logger');

/**
 * Protect routes – verify JWT and attach user to request
 */
const protect = async (req, res, next) => {
  try {
    // 1. Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, { statusCode: 401, message: 'Access denied. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return sendError(res, { statusCode: 401, message: 'Access denied. Malformed token.' });
    }

    // 2. Verify token
    const decoded = verifyAccessToken(token);

    // 3. Check user still exists and is active
    const user = await User.findById(decoded.id).select('+passwordChangedAt +currentAccessToken');
    if (!user) {
      return sendError(res, { statusCode: 401, message: 'User no longer exists.' });
    }
    if (user.currentAccessToken !== token) {
  return sendError(res, {
    statusCode: 401,
    message: 'Session expired. Please log in again.',
  });
}
    if (!user.isActive) {
      return sendError(res, { statusCode: 401, message: 'Your account has been deactivated.' });
    }

    // 4. Check if password changed after token was issued
    if (user.changedPasswordAfter(decoded.iat)) {
      return sendError(res, { statusCode: 401, message: 'Password recently changed. Please log in again.' });
    }

    // 5. Attach user to request
    req.user = user;
    next();
  } catch (err) {
    logger.warn(`Auth middleware error: ${err.message}`);
    if (err.name === 'TokenExpiredError') {
      return sendError(res, { statusCode: 401, message: 'Token has expired. Please log in again.' });
    }
    if (err.name === 'JsonWebTokenError') {
      return sendError(res, { statusCode: 401, message: 'Invalid token.' });
    }
    return sendError(res, { statusCode: 401, message: 'Authentication failed.' });
  }
};

/**
 * Restrict access to specific roles
 * Usage: restrictTo('admin') or restrictTo('admin', 'moderator')
 */
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return sendError(res, {
        statusCode: 403,
        message: `Access forbidden. Required role: ${roles.join(' or ')}.`,
      });
    }
    next();
  };
};

module.exports = { protect, restrictTo };
