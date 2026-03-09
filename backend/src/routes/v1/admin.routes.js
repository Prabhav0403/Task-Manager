const express = require('express');
const router = express.Router();
const { getAllUsers, getUserById, updateUser, deleteUser, getPlatformStats } = require('../../controllers/admin.controller');
const { protect, restrictTo } = require('../../middleware/auth.middleware');
const { validate } = require('../../middleware/validate.middleware');
const { body } = require('express-validator');

// All admin routes require auth + admin role
router.use(protect, restrictTo('admin'));

/**
 * @swagger
 * /api/v1/admin/stats:
 *   get:
 *     tags: [Admin]
 *     summary: Get platform-wide statistics
 *     responses:
 *       200:
 *         description: Platform stats
 *       403:
 *         description: Forbidden – Admin only
 */
router.get('/stats', getPlatformStats);

/**
 * @swagger
 * /api/v1/admin/users:
 *   get:
 *     tags: [Admin]
 *     summary: Get all users (paginated, filterable)
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: role
 *         schema: { type: string, enum: [user, admin] }
 *       - in: query
 *         name: isActive
 *         schema: { type: boolean }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Paginated list of users
 *       403:
 *         description: Forbidden
 */
router.get('/users', getAllUsers);

/**
 * @swagger
 * /api/v1/admin/users/{id}:
 *   get:
 *     tags: [Admin]
 *     summary: Get a single user by ID with task count
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: User details
 *       404:
 *         description: User not found
 */
router.get('/users/:id', getUserById);

/**
 * @swagger
 * /api/v1/admin/users/{id}:
 *   patch:
 *     tags: [Admin]
 *     summary: Update user role or active status
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [user, admin]
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: User updated
 */
router.patch('/users/:id', [
  body('role').optional().isIn(['user', 'admin']).withMessage('Role must be user or admin'),
  body('isActive').optional().isBoolean().withMessage('isActive must be boolean'),
], validate, updateUser);

/**
 * @swagger
 * /api/v1/admin/users/{id}:
 *   delete:
 *     tags: [Admin]
 *     summary: Delete a user and all their tasks
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: User deleted
 *       404:
 *         description: User not found
 */
router.delete('/users/:id', deleteUser);

module.exports = router;
