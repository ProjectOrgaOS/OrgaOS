import { Router } from 'express';
import { createProject, getMyProjects, sendInvite, getProjectMembers, updateMemberRole, removeMember, deleteProject } from '../controllers/project.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

// All routes are protected by authMiddleware

// POST /api/projects - Create a new project
router.post('/', authMiddleware, createProject);

// GET /api/projects - Get all my projects
router.get('/', authMiddleware, getMyProjects);

// DELETE /api/projects/:id - Delete a project
router.delete('/:id', authMiddleware, deleteProject);

// POST /api/projects/:id/invite - Send invitation to a user
router.post('/:id/invite', authMiddleware, sendInvite);

// GET /api/projects/:id/members - Get project members
router.get('/:id/members', authMiddleware, getProjectMembers);

// PUT /api/projects/:id/members/:userId/role - Update member role
router.put('/:id/members/:userId/role', authMiddleware, updateMemberRole);

// DELETE /api/projects/:id/members/:userId - Remove a member from project
router.delete('/:id/members/:userId', authMiddleware, removeMember);

export default router;
