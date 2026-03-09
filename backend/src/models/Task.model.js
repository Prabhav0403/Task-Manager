const mongoose = require('mongoose');

/**
 * @swagger
 * components:
 *   schemas:
 *     TaskCreate:
 *       type: object
 *       required: [title]
 *       properties:
 *         title:
 *           type: string
 *           example: "Build REST API"
 *         description:
 *           type: string
 *           example: "Implement all CRUD endpoints with auth"
 *         status:
 *           type: string
 *           enum: [todo, in-progress, done]
 *           default: todo
 *         priority:
 *           type: string
 *           enum: [low, medium, high]
 *           default: medium
 *         dueDate:
 *           type: string
 *           format: date-time
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *           example: ["backend", "api"]
 */
const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters'],
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
      default: '',
    },
    status: {
      type: String,
      enum: {
        values: ['todo', 'in-progress', 'done'],
        message: 'Status must be todo, in-progress, or done',
      },
      default: 'todo',
    },
    priority: {
      type: String,
      enum: {
        values: ['low', 'medium', 'high'],
        message: 'Priority must be low, medium, or high',
      },
      default: 'medium',
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Task must have an owner'],
    },
    dueDate: {
      type: Date,
      validate: {
        validator: function (val) {
          return !val || val > Date.now();
        },
        message: 'Due date must be in the future',
      },
    },
    tags: {
      type: [String],
      default: [],
      validate: {
        validator: (arr) => arr.length <= 10,
        message: 'Cannot have more than 10 tags',
      },
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Indexes for common query patterns
taskSchema.index({ owner: 1, createdAt: -1 });
taskSchema.index({ owner: 1, status: 1 });
taskSchema.index({ owner: 1, priority: 1 });
taskSchema.index({ title: 'text', description: 'text' }); // Full-text search

module.exports = mongoose.model('Task', taskSchema);
