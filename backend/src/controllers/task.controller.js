const Task = require('../models/Task.model');
const { sendSuccess, sendError, sendPaginated } = require('../utils/response.utils');

/**
 * @desc    Get all tasks for the current user (with filters, pagination, sorting)
 * @route   GET /api/v1/tasks
 * @access  Private
 */
const getTasks = async (req, res, next) => {
  try {
    const {
      page = 1, limit = 10, status, priority,
      sortBy = 'createdAt', order = 'desc', search,
    } = req.query;

    // Build query filter
    const filter = { owner: req.user._id, isArchived: false };
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (search) filter.$text = { $search: search };

    const skip = (page - 1) * limit;
    const sortOrder = order === 'asc' ? 1 : -1;

    const [tasks, total] = await Promise.all([
      Task.find(filter)
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Task.countDocuments(filter),
    ]);

    return sendPaginated(res, { data: tasks, total, page, limit, message: 'Tasks fetched successfully' });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get a single task by ID
 * @route   GET /api/v1/tasks/:id
 * @access  Private
 */
const getTask = async (req, res, next) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, owner: req.user._id });
    if (!task) {
      return sendError(res, { statusCode: 404, message: 'Task not found.' });
    }
    return sendSuccess(res, { message: 'Task fetched', data: { task } });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Create a new task
 * @route   POST /api/v1/tasks
 * @access  Private
 */
const createTask = async (req, res, next) => {
  try {
    const { title, description, status, priority, dueDate, tags } = req.body;

    const task = await Task.create({
      title,
      description,
      status,
      priority,
      dueDate,
      tags,
      owner: req.user._id,
    });

    return sendSuccess(res, { statusCode: 201, message: 'Task created successfully', data: { task } });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Update a task
 * @route   PUT /api/v1/tasks/:id
 * @access  Private
 */
const updateTask = async (req, res, next) => {
  try {
    const allowedFields = ['title', 'description', 'status', 'priority', 'dueDate', 'tags'];
    const updates = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      updates,
      { new: true, runValidators: true }
    );

    if (!task) {
      return sendError(res, { statusCode: 404, message: 'Task not found.' });
    }

    return sendSuccess(res, { message: 'Task updated successfully', data: { task } });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Delete a task (soft delete via archive)
 * @route   DELETE /api/v1/tasks/:id
 * @access  Private
 */
const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      { isArchived: true },
      { new: true }
    );

    if (!task) {
      return sendError(res, { statusCode: 404, message: 'Task not found.' });
    }

    return sendSuccess(res, { message: 'Task deleted successfully' });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get task statistics for the current user
 * @route   GET /api/v1/tasks/stats
 * @access  Private
 */
const getTaskStats = async (req, res, next) => {
  try {
    const stats = await Task.aggregate([
      { $match: { owner: req.user._id, isArchived: false } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const priorityStats = await Task.aggregate([
      { $match: { owner: req.user._id, isArchived: false } },
      { $group: { _id: '$priority', count: { $sum: 1 } } },
    ]);

    const formatted = { total: 0, byStatus: {}, byPriority: {} };
    stats.forEach(({ _id, count }) => { formatted.byStatus[_id] = count; formatted.total += count; });
    priorityStats.forEach(({ _id, count }) => { formatted.byPriority[_id] = count; });

    return sendSuccess(res, { message: 'Task stats fetched', data: { stats: formatted } });
  } catch (err) {
    next(err);
  }
};

module.exports = { getTasks, getTask, createTask, updateTask, deleteTask, getTaskStats };
