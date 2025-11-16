import { Router } from 'express';
import { protect } from '../../middleware/auth.middleware';
import { getFoundItems, reportLostItem } from './lost-and-found.controller';

const router = Router();

router.route('/')
    .get(getFoundItems)
    .post(protect, reportLostItem);

export default router;
