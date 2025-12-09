import { Router } from 'express';
import { createProject, getMyProjects } from '../controllers/project.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

// All routes are protected by authMiddleware

// POST /api/projects - Create a new project
router.post('/', authMiddleware, createProject);

// GET /api/projects - Get all my projects
router.get('/', authMiddleware, getMyProjects);

export default router;
