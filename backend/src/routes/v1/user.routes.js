const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, deactivateAccount } = require('../../controllers/user.controller');
const { protect } = require('../../middleware/auth.middleware');
const { validate } = require('../../middleware/validate.middleware');
const { body } = require('express-validator');

router.use(protect);

/**
 * @swagger
 * /api/v1/users/profile:
 *   get:
 *     tags: [Users]
 *     summary: Get current user profile
 *     responses:
 *       200:
 *         description: User profile
 */
router.get('/profile', getProfile);

/**
 * @swagger
 * /api/v1/users/profile:
 *   patch:
 *     tags: [Users]
 *     summary: Update current user name
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Jane Doe
 *     responses:
 *       200:
 *         description: Profile updated
 */
router.patch('/profile', [
  body('name').optional().trim().isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 characters')
    .matches(/^[a-zA-Z\s]+$/).withMessage('Name can only contain letters and spaces'),
], validate, updateProfile);

/**
 * @swagger
 * /api/v1/users/profile:
 *   delete:
 *     tags: [Users]
 *     summary: Deactivate own account
 *     responses:
 *       200:
 *         description: Account deactivated
 */
router.delete('/profile', deactivateAccount);

module.exports = router;
