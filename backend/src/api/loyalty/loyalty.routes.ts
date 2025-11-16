import { Router } from 'express';
import { protect } from '../../middleware/auth.middleware';
import { getLoyaltyHistory } from './loyalty.controller';

const router = Router();

router.use(protect);

router.get('/history', getLoyaltyHistory);

export default router;
