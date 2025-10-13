import { Router } from 'express';
import { cancelBooking, createBooking, getBooking, listBookings, validateBooking } from '../controllers/bookingController.js';
import { requireAdmin, requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/', validateBooking, createBooking);
router.get('/', requireAuth, requireAdmin, listBookings);
router.get('/:id', requireAuth, requireAdmin, getBooking);
router.patch('/:id/cancel', requireAuth, requireAdmin, cancelBooking);

export default router;

