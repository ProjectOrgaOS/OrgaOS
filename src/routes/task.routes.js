import { Router } from 'express';
import {
  createTask,
  getTasksByProject,
  updateTaskStatus,
  updateTask,
  deleteTask,
} from '../controllers/task.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

// All routes are protected by authMiddleware

// POST /api/tasks - Create a new task
router.post('/', authMiddleware, createTask);

// GET /api/tasks/project/:projectId - Get all tasks for a project
router.get('/project/:projectId', authMiddleware, getTasksByProject);

// PUT /api/tasks/:taskId - Update task (priority, title, etc.)
router.put('/:taskId', authMiddleware, updateTask);

// PUT /api/tasks/:taskId/status - Update task status (move between columns)
router.put('/:taskId/status', authMiddleware, updateTaskStatus);

// DELETE /api/tasks/:taskId - Delete a task
router.delete('/:taskId', authMiddleware, deleteTask);

export default router;
