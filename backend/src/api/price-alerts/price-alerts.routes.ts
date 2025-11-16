import { Router } from 'express';
import { protect } from '../../middleware/auth.middleware';
import { createAlert, getMyAlerts, deleteAlert } from './price-alerts.controller';

const router = Router();

router.use(protect);

router.route('/')
    .post(createAlert)
    .get(getMyAlerts);

router.route('/:id')
    .delete(deleteAlert);

export default router;
