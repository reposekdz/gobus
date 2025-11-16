import { Router } from 'express';
import { 
    getCompanies, getCompanyById, getMyDrivers, createDriverForMyCompany, updateDriverForMyCompany, 
    deleteDriverForMyCompany, getCompanyDetails, getDriverHistoryForCompany, addGalleryImage, 
    deleteGalleryImage, getMyDashboard,
    // New imports
    getMyBuses, createBus, updateBus, deleteBus,
    getMyRoutes, createRoute, updateRoute, deleteRoute,
    getMyPassengers,
    getMyFinancials
} from './company.controller';
import { protect, authorize } from '../../middleware/auth.middleware';

const router = Router();

// Public routes
router.route('/').get(getCompanies);
router.route('/:id').get(getCompanyById);
router.route('/:id/details').get(getCompanyDetails); // New detailed endpoint

// Protected routes for company managers
router.use(protect, authorize('company'));

router.get('/my-dashboard', getMyDashboard);

router.route('/mydrivers')
    .get(getMyDrivers)
    .post(createDriverForMyCompany);
    
router.route('/mydrivers/:id')
    .put(updateDriverForMyCompany)
    .delete(deleteDriverForMyCompany);

router.get('/mydrivers/:id/history', getDriverHistoryForCompany);

router.route('/my-gallery')
    .post(addGalleryImage);

router.route('/my-gallery/:id')
    .delete(deleteGalleryImage);

// Bus Management for Company
router.route('/mybuses')
    .get(getMyBuses)
    .post(createBus);

router.route('/mybuses/:id')
    .put(updateBus)
    .delete(deleteBus);

// Route Management for Company
router.route('/myroutes')
    .get(getMyRoutes)
    .post(createRoute);

router.route('/myroutes/:id')
    .put(updateRoute)
    .delete(deleteRoute);
    
// Passenger & Financials
router.get('/mypassengers', getMyPassengers);
router.get('/myfinancials', getMyFinancials);


export default router;