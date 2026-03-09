const User = require('../models/User.model');
const { sendSuccess, sendError } = require('../utils/response.utils');

/**
 * @desc    Get current user profile
 * @route   GET /api/v1/users/profile
 * @access  Private
 */
const getProfile = async (req, res) => {
  return sendSuccess(res, { message: 'Profile fetched', data: { user: req.user } });
};

/**
 * @desc    Update current user profile (name only – not email/password)
 * @route   PATCH /api/v1/users/profile
 * @access  Private
 */
const updateProfile = async (req, res, next) => {
  try {
    const allowedUpdates = ['name'];
    const updates = {};
    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    if (Object.keys(updates).length === 0) {
      return sendError(res, { statusCode: 400, message: 'No valid fields to update.' });
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
    return sendSuccess(res, { message: 'Profile updated', data: { user } });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Deactivate own account
 * @route   DELETE /api/v1/users/profile
 * @access  Private
 */
const deactivateAccount = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { isActive: false, refreshToken: null });
    return sendSuccess(res, { message: 'Account deactivated successfully.' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getProfile, updateProfile, deactivateAccount };
