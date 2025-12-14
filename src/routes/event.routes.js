import express from 'express';
import { createEvent, getMyEvents, deleteEvent } from '../controllers/event.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// POST / - Create a new event
router.post('/', createEvent);

// GET / - Get all events for current user
router.get('/', getMyEvents);

// DELETE /:id - Delete an event
router.delete('/:id', deleteEvent);

export default router;
