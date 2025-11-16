import { Router } from 'express';
import { DriverManagementController } from './driver-management.controller';
import { authenticateToken, authorizeRoles } from '../../middleware/auth.middleware';
import { AuthController } from '../auth/auth.controller';

const router = Router();

// Auth routes (no authentication required)
router.post('/auth/login', AuthController.login);
router.post('/auth/register', AuthController.register);

// Company routes (authentication required)
router.use(authenticateToken);
router.use(authorizeRoles(['company', 'admin']));

router.post('/drivers', DriverManagementController.addDriver);
router.get('/drivers', DriverManagementController.getDrivers);
router.post('/drivers/assign-bus', DriverManagementController.assignBus);
router.put('/drivers/:driverId/status', DriverManagementController.updateDriverStatus);

export default router;