const User = require('../models/User.model');
const Task = require('../models/Task.model');
const { sendSuccess, sendError, sendPaginated } = require('../utils/response.utils');
const logger = require('../utils/logger');

/**
 * @desc    Get all users (admin only)
 * @route   GET /api/v1/admin/users
 * @access  Admin
 */
const getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, role, isActive, search } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (search) filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];

    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)).lean(),
      User.countDocuments(filter),
    ]);

    return sendPaginated(res, { data: users, total, page, limit, message: 'Users fetched' });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get a user by ID (admin only)
 * @route   GET /api/v1/admin/users/:id
 * @access  Admin
 */
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return sendError(res, { statusCode: 404, message: 'User not found.' });

    const taskCount = await Task.countDocuments({ owner: user._id, isArchived: false });
    return sendSuccess(res, { message: 'User fetched', data: { user, taskCount } });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Update user role or status (admin only)
 * @route   PATCH /api/v1/admin/users/:id
 * @access  Admin
 */
const updateUser = async (req, res, next) => {
  try {
    const { role, isActive } = req.body;

    // Prevent admin from demoting themselves
    if (req.params.id === req.user._id.toString() && role && role !== 'admin') {
      return sendError(res, { statusCode: 400, message: 'Cannot change your own admin role.' });
    }

    const updates = {};
    if (role !== undefined) updates.role = role;
    if (isActive !== undefined) updates.isActive = isActive;

    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!user) return sendError(res, { statusCode: 404, message: 'User not found.' });

    logger.info(`Admin ${req.user.email} updated user ${user.email}: ${JSON.stringify(updates)}`);
    return sendSuccess(res, { message: 'User updated', data: { user } });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Delete a user and all their tasks (admin only)
 * @route   DELETE /api/v1/admin/users/:id
 * @access  Admin
 */
const deleteUser = async (req, res, next) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return sendError(res, { statusCode: 400, message: 'Cannot delete your own account via admin panel.' });
    }

    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return sendError(res, { statusCode: 404, message: 'User not found.' });

    // Cascade delete tasks
    await Task.deleteMany({ owner: req.params.id });

    logger.warn(`Admin ${req.user.email} deleted user ${user.email}`);
    return sendSuccess(res, { message: 'User and associated tasks deleted successfully' });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get platform statistics
 * @route   GET /api/v1/admin/stats
 * @access  Admin
 */
const getPlatformStats = async (req, res, next) => {
  try {
    const [totalUsers, activeUsers, adminCount, totalTasks, tasksByStatus] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      User.countDocuments({ role: 'admin' }),
      Task.countDocuments({ isArchived: false }),
      Task.aggregate([
        { $match: { isArchived: false } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
    ]);

    const byStatus = {};
    tasksByStatus.forEach(({ _id, count }) => { byStatus[_id] = count; });

    return sendSuccess(res, {
      message: 'Platform stats',
      data: { users: { total: totalUsers, active: activeUsers, admins: adminCount }, tasks: { total: totalTasks, byStatus } },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAllUsers, getUserById, updateUser, deleteUser, getPlatformStats };
