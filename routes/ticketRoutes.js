// routes/ticketRoutes.js

import express from 'express';
import { purchaseTicket, validateTicket } from '../controllers/ticketController.js';
import { protect, isOrganizer } from '../middleware/authMiddleware.js';

const router = express.Router();

// A logged-in user can purchase a ticket
router.post('/purchase', protect, purchaseTicket);

// An organizer can validate a ticket
router.post('/validate', protect, isOrganizer, validateTicket);

export default router;
