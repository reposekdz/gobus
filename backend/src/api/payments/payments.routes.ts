import { Router } from 'express';
import { protect } from '../../middleware/auth.middleware';
import { initiateMomoPayment } from './payments.controller';

const router = Router();

router.use(protect);

router.post('/momo/initiate', initiateMomoPayment);

export default router;
