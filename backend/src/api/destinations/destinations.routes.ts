import { Router } from 'express';
import { getDestinations } from './destinations.controller';

const router = Router();

// @route   GET /api/v1/destinations
// @desc    Get all featured destinations
// @access  Public
router.get('/', getDestinations);

export default router;
