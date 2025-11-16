import { Router } from 'express';
import { seedDatabase } from './debug.controller';

const router = Router();

// This route should be disabled or protected in production
router.post('/seed', seedDatabase);

export default router;
