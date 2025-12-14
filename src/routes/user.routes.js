import { Router } from 'express';
import { getMyInvitations, respondToInvite } from '../controllers/user.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

// All routes are protected by authMiddleware

// GET /api/users/invitations - Get my pending invitations
router.get('/invitations', authMiddleware, getMyInvitations);

// POST /api/users/invitations/respond - Accept or decline invitation
router.post('/invitations/respond', authMiddleware, respondToInvite);

export default router;
