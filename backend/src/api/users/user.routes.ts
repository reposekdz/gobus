import { Router } from 'express';
import { protect } from '../../middleware/auth.middleware';
import { updateUserAvatar, updateMyProfile } from './user.controller';

const router = Router();

// All routes here are for the authenticated user acting on their own profile
router.use(protect);

router.put('/me/avatar', updateUserAvatar);
router.put('/me', updateMyProfile);

export default router;