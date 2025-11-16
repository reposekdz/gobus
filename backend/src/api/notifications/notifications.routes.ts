import { Router } from 'express';
import { protect } from '../../middleware/auth.middleware';
import { subscribe } from './notifications.controller';

const router = Router();

// All routes require an authenticated user
router.use(protect);

// @route   POST /api/v1/notifications/subscribe
// @desc    Subscribe a user's device for push notifications
// @access  Private
router.post('/subscribe', subscribe);

export default router;
