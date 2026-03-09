const User = require('../models/User.model');
const { generateTokenPair, verifyRefreshToken } = require('../utils/jwt.utils');
const { sendSuccess, sendError } = require('../utils/response.utils');
const logger = require('../utils/logger');

/**
 * @desc    Register a new user
 * @route   POST /api/v1/auth/register
 * @access  Public
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return sendError(res, { statusCode: 409, message: 'An account with this email already exists.' });
    }

    // Create user (password hashed by pre-save hook)
    const user = await User.create({ name, email, password });

    // Generate tokens
    const tokens = generateTokenPair(user);

    user.refreshToken = tokens.refreshToken;
    user.currentAccessToken = tokens.accessToken;
    user.lastLogin = new Date();

    await user.save({ validateBeforeSave: false });

    logger.info(`New user registered: ${user.email}`);

    return sendSuccess(res, {
      statusCode: 201,
      message: 'Account created successfully',
      data: { user, ...tokens },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Login user
 * @route   POST /api/v1/auth/login
 * @access  Public
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Fetch user with password field
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return sendError(res, { statusCode: 401, message: 'Invalid email or password.' });
    }

    // Check account is active
    if (!user.isActive) {
      return sendError(res, { statusCode: 401, message: 'Your account has been deactivated. Contact support.' });
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return sendError(res, { statusCode: 401, message: 'Invalid email or password.' });
    }

    // Generate tokens
    const tokens = generateTokenPair(user);

    // Update last login & refresh token
    user.refreshToken = tokens.refreshToken;
    user.currentAccessToken = tokens.accessToken;
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    logger.info(`User logged in: ${user.email}`);

    return sendSuccess(res, {
      message: 'Logged in successfully',
      data: { user, ...tokens },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Refresh access token
 * @route   POST /api/v1/auth/refresh
 * @access  Public (requires valid refresh token)
 */
const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken: token } = req.body;
    if (!token) {
      return sendError(res, { statusCode: 400, message: 'Refresh token is required.' });
    }

    const decoded = verifyRefreshToken(token);
    const user = await User.findById(decoded.id).select('+refreshToken');

    if (!user || user.refreshToken !== token) {
      return sendError(res, { statusCode: 401, message: 'Invalid or expired refresh token.' });
    }

    const tokens = generateTokenPair(user);
    user.refreshToken = tokens.refreshToken;
    user.currentAccessToken = tokens.accessToken;
    await user.save({ validateBeforeSave: false });

    return sendSuccess(res, {
      message: 'Token refreshed successfully',
      data: tokens,
    });
  } catch (err) {
    if (err.name === 'TokenExpiredError' || err.name === 'JsonWebTokenError') {
      return sendError(res, { statusCode: 401, message: 'Refresh token is invalid or expired. Please log in again.' });
    }
    next(err);
  }
};

/**
 * @desc    Logout user
 * @route   POST /api/v1/auth/logout
 * @access  Private
 */
const logout = async (req, res, next) => {
  try {
await User.findByIdAndUpdate(
  req.user._id,
  { refreshToken: null, currentAccessToken: null },
  { validateBeforeSave: false }
);    logger.info(`User logged out: ${req.user.email}`);
    return sendSuccess(res, { message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get current authenticated user
 * @route   GET /api/v1/auth/me
 * @access  Private
 */
const getMe = async (req, res) => {
  return sendSuccess(res, { message: 'Profile fetched', data: { user: req.user } });
};

/**
 * @desc    Change password
 * @route   PATCH /api/v1/auth/change-password
 * @access  Private
 */
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return sendError(res, { statusCode: 401, message: 'Current password is incorrect.' });
    }

    user.password = newPassword;
    await user.save();

    const tokens = generateTokenPair(user);
    user.refreshToken = tokens.refreshToken;
    await user.save({ validateBeforeSave: false });

    return sendSuccess(res, { message: 'Password changed successfully', data: tokens });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, refreshToken, logout, getMe, changePassword };
