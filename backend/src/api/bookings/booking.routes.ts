import { Router } from 'express';
import { protect } from '../../middleware/auth.middleware';
import { createBooking, getMyBookings } from './booking.controller';

const router = Router();

// All booking routes require a logged-in user
router.use(protect);

router.route('/')
    .post(createBooking)
    .get(getMyBookings);

export default router;
