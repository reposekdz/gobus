import { Router } from 'express';
import { authenticateToken, authorizeRoles } from '../../middleware/auth.middleware';
import * as stationsController from './stations.controller';

const router = Router();

// Public routes
router.get('/', stationsController.getAllStations);
router.get('/provinces-districts', stationsController.getProvincesAndDistricts);
router.get('/grouped/province', stationsController.getStationsGroupedByProvince);
router.get('/:code', stationsController.getStationByCode);

// Admin routes
router.post('/sync', authenticateToken, authorizeRoles(['admin']), stationsController.syncStations);

export default router;

