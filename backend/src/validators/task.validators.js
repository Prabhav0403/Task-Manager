const { body, query, param } = require('express-validator');

const createTaskValidation = [
  body('title')
    .trim()
    .notEmpty().withMessage('Task title is required')
    .isLength({ min: 3, max: 100 }).withMessage('Title must be 3-100 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Description cannot exceed 1000 characters'),

  body('status')
    .optional()
    .isIn(['todo', 'in-progress', 'done']).withMessage('Status must be todo, in-progress, or done'),

  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high']).withMessage('Priority must be low, medium, or high'),

  body('dueDate')
    .optional()
    .isISO8601().withMessage('Due date must be a valid date')
    .custom((val) => new Date(val) > new Date()).withMessage('Due date must be in the future'),

  body('tags')
    .optional()
    .isArray({ max: 10 }).withMessage('Tags must be an array with max 10 items')
    .custom((tags) => tags.every((t) => typeof t === 'string' && t.length <= 30))
    .withMessage('Each tag must be a string of max 30 chars'),
];

const updateTaskValidation = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 }).withMessage('Title must be 3-100 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Description cannot exceed 1000 characters'),

  body('status')
    .optional()
    .isIn(['todo', 'in-progress', 'done']).withMessage('Invalid status'),

  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high']).withMessage('Invalid priority'),

  body('dueDate')
    .optional({ nullable: true })
    .isISO8601().withMessage('Due date must be a valid ISO8601 date'),

  body('tags')
    .optional()
    .isArray({ max: 10 }).withMessage('Tags must be an array with max 10 items'),
];

const getTasksValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer').toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100').toInt(),
  query('status').optional().isIn(['todo', 'in-progress', 'done']).withMessage('Invalid status filter'),
  query('priority').optional().isIn(['low', 'medium', 'high']).withMessage('Invalid priority filter'),
  query('sortBy').optional().isIn(['createdAt', 'updatedAt', 'dueDate', 'priority', 'title']).withMessage('Invalid sort field'),
  query('order').optional().isIn(['asc', 'desc']).withMessage('Order must be asc or desc'),
];

module.exports = { createTaskValidation, updateTaskValidation, getTasksValidation };
