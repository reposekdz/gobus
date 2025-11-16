import { Router } from 'express';
import { getSetting } from './settings.controller';

const router = Router();

// @route   GET /api/v1/settings/:key
// @desc    Get a single setting value
// @access  Public
router.get('/:key', getSetting);

export default router;
