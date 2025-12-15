import express from 'express';
import { createEvent, getMyEvents, updateEvent, deleteEvent } from '../controllers/event.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(authMiddleware);

router.post('/', createEvent);
router.get('/', getMyEvents);
router.put('/:id', updateEvent);
router.delete('/:id', deleteEvent);

export default router;
