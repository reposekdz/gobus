import { Router } from 'express';
import { protect } from '../../middleware/auth.middleware';
import { createCharterRequest } from './charters.controller';

const router = Router();

router.post('/', protect, createCharterRequest);

export default router;
