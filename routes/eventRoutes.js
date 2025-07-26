// routes/eventRoutes.js

import express from 'express';
import {
    createEvent,
    getAllEvents,
    getEventById,
    updateEvent,
    deleteEvent,
    getEventAnalytics
} from '../controllers/eventController.js';
import { protect, isOrganizer } from '../middleware/authMiddleware.js';

const router = express.Router();

// --- Public Routes ---
router.route('/')
    .get(getAllEvents)
    .post(protect, isOrganizer, createEvent); // Create an event

// --- Routes for a specific event by ID ---
router.route('/:id')
    .get(getEventById) // Get a single event (Public)
    .put(protect, isOrganizer, updateEvent) // Update an event (Organizer only)
    .delete(protect, isOrganizer, deleteEvent); // Delete an event (Organizer only)

// --- Analytics Route ---
router.route('/:id/analytics')
    .get(protect, isOrganizer, getEventAnalytics); // Get event analytics (Organizer only)

export default router;
