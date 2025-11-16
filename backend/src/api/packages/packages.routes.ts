import { Router } from 'express';
import { protect } from '../../middleware/auth.middleware';
import { createPackage, trackPackage } from './packages.controller';

const router = Router();

router.post('/', protect, createPackage);
router.get('/:trackingId', trackPackage);

export default router;
