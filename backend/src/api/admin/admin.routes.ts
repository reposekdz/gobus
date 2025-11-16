

import { Router } from 'express';
import { protect, authorize } from '../../middleware/auth.middleware';
import { 
    createCompany,
    getCompanies,
    updateCompany,
    deleteCompany,
    createAgent,
    getAgents,
    updateAgent,
    deleteAgent,
    getUsers,
    createDriver,
    getDrivers,
    updateDriver,
    deleteDriver,
    getDashboardAnalytics,
    getDriverHistoryForAdmin,
    getAdminFinancials
} from './admin.controller';
import { updateSetting } from '../settings/settings.controller';
import { createDestination, updateDestination, deleteDestination } from '../destinations/destinations.controller';


const router = Router();

// All routes in this file are protected and for admins only
router.use(protect, authorize('admin'));

// Dashboard
router.get('/analytics', getDashboardAnalytics);

// Financials Page
router.get('/financials', getAdminFinancials);

// Company management
router.route('/companies')
    .post(createCompany)
    .get(getCompanies);

router.route('/companies/:id')
    .put(updateCompany)
    .delete(deleteCompany);

// Driver management
router.route('/drivers')
    .post(createDriver)
    .get(getDrivers);

router.route('/drivers/:id')
    .put(updateDriver)
    .delete(deleteDriver);

router.get('/drivers/:id/history', getDriverHistoryForAdmin);


// Agent management
router.route('/agents')
    .post(createAgent)
    .get(getAgents);

router.route('/agents/:id')
    .put(updateAgent)
    .delete(deleteAgent);


// User management
router.route('/users')
    .get(getUsers);

// Site Content Management
router.put('/settings/:key', updateSetting);
router.route('/destinations')
    .post(createDestination);
router.route('/destinations/:id')
    .put(updateDestination)
    .delete(deleteDestination);

export default router;