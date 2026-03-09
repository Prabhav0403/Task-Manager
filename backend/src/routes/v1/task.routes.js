const express = require('express');
const router = express.Router();
const { getTasks, getTask, createTask, updateTask, deleteTask, getTaskStats } = require('../../controllers/task.controller');
const { protect } = require('../../middleware/auth.middleware');
const { validate } = require('../../middleware/validate.middleware');
const { createTaskValidation, updateTaskValidation, getTasksValidation } = require('../../validators/task.validators');

// All task routes require authentication
router.use(protect);

/**
 * @swagger
 * /api/v1/tasks/stats:
 *   get:
 *     tags: [Tasks]
 *     summary: Get task statistics for the current user
 *     responses:
 *       200:
 *         description: Task counts by status and priority
 */
router.get('/stats', getTaskStats);

/**
 * @swagger
 * /api/v1/tasks:
 *   get:
 *     tags: [Tasks]
 *     summary: Get all tasks for the authenticated user
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [todo, in-progress, done] }
 *       - in: query
 *         name: priority
 *         schema: { type: string, enum: [low, medium, high] }
 *       - in: query
 *         name: sortBy
 *         schema: { type: string, default: createdAt }
 *       - in: query
 *         name: order
 *         schema: { type: string, enum: [asc, desc], default: desc }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Full-text search in title and description
 *     responses:
 *       200:
 *         description: Paginated list of tasks
 */
router.get('/', getTasksValidation, validate, getTasks);

/**
 * @swagger
 * /api/v1/tasks:
 *   post:
 *     tags: [Tasks]
 *     summary: Create a new task
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TaskCreate'
 *     responses:
 *       201:
 *         description: Task created successfully
 *       422:
 *         description: Validation failed
 */
router.post('/', createTaskValidation, validate, createTask);

/**
 * @swagger
 * /api/v1/tasks/{id}:
 *   get:
 *     tags: [Tasks]
 *     summary: Get a specific task by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Task found
 *       404:
 *         description: Task not found
 */
router.get('/:id', getTask);

/**
 * @swagger
 * /api/v1/tasks/{id}:
 *   put:
 *     tags: [Tasks]
 *     summary: Update a task
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TaskCreate'
 *     responses:
 *       200:
 *         description: Task updated
 *       404:
 *         description: Task not found
 */
router.put('/:id', updateTaskValidation, validate, updateTask);

/**
 * @swagger
 * /api/v1/tasks/{id}:
 *   delete:
 *     tags: [Tasks]
 *     summary: Delete (archive) a task
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Task deleted
 *       404:
 *         description: Task not found
 */
router.delete('/:id', deleteTask);

module.exports = router;
