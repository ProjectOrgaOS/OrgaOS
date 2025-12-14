import { Router } from 'express';
import { createProject, getMyProjects, sendInvite, getProjectMembers, updateMemberRole } from '../controllers/project.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

// All routes are protected by authMiddleware

// POST /api/projects - Create a new project
router.post('/', authMiddleware, createProject);

// GET /api/projects - Get all my projects
router.get('/', authMiddleware, getMyProjects);

// POST /api/projects/:id/invite - Send invitation to a user
router.post('/:id/invite', authMiddleware, sendInvite);

// GET /api/projects/:id/members - Get project members
router.get('/:id/members', authMiddleware, getProjectMembers);

// PUT /api/projects/:id/members/:userId/role - Update member role
router.put('/:id/members/:userId/role', authMiddleware, updateMemberRole);

export default router;
