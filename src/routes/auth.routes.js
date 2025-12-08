import { Router } from 'express';
import { register, login } from '../controllers/auth.controller.js';

const router = Router();

// POST /api/auth/register - Create a new user
router.post('/register', register);

// POST /api/auth/login - Login and get JWT token
router.post('/login', login);

export default router;
