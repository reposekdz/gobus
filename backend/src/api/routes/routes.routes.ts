import { Router } from 'express';
import { 
    getRoutes, 
    createRoute, 
    updateRoute, 
    deleteRoute, 
    getCities, 
    searchAvailableRoutes,
    getPopularRoutes,
    getProvinces,
    getDistrictsByProvinceId,
    getBusStationsByCityId,
    getTouristDestinations
} from './routes.controller';
import { authMiddleware, roleMiddleware } from '../../middleware/auth.middleware';
import { validateRequest } from '../../middleware/validation.middleware';
import { body, query, param } from 'express-validator';

const router = Router();

// Validation rules
const createRouteValidation = [
    body('from_city_id').isInt({ min: 1 }).withMessage('Valid from city ID is required'),
    body('to_city_id').isInt({ min: 1 }).withMessage('Valid to city ID is required'),
    body('distance').isFloat({ min: 0 }).withMessage('Distance must be a positive number'),
    body('duration').isString().notEmpty().withMessage('Duration is required'),
    body('base_price').isFloat({ min: 0 }).withMessage('Base price must be a positive number'),
    body('company_id').isInt({ min: 1 }).withMessage('Valid company ID is required')
];

const updateRouteValidation = [
    param('id').isInt({ min: 1 }).withMessage('Valid route ID is required'),
    body('distance').optional().isFloat({ min: 0 }).withMessage('Distance must be a positive number'),
    body('duration').optional().isString().notEmpty().withMessage('Duration cannot be empty'),
    body('base_price').optional().isFloat({ min: 0 }).withMessage('Base price must be a positive number'),
    body('is_active').optional().isBoolean().withMessage('is_active must be a boolean')
];

const searchValidation = [
    query('from').optional().isString().isLength({ min: 1 }).withMessage('From city cannot be empty'),
    query('to').optional().isString().isLength({ min: 1 }).withMessage('To city cannot be empty'),
    query('date').optional().isISO8601().withMessage('Date must be in valid format (YYYY-MM-DD)'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
];

// Public routes - Rwanda location data
router.get('/provinces', getProvinces);
router.get('/provinces/:provinceId/districts', getDistrictsByProvinceId);
router.get('/cities', getCities);
router.get('/cities/:cityId/stations', getBusStationsByCityId);
router.get('/destinations', getTouristDestinations);

// Public routes - Routes and trips
router.get('/popular', getPopularRoutes);
router.get('/search', searchValidation, validateRequest, searchAvailableRoutes);
router.get('/', searchValidation, validateRequest, getRoutes);

// Protected routes - Admin and Company only
router.post('/', 
    authMiddleware, 
    roleMiddleware(['admin', 'company']), 
    createRouteValidation, 
    validateRequest, 
    createRoute
);

router.put('/:id', 
    authMiddleware, 
    roleMiddleware(['admin', 'company']), 
    updateRouteValidation, 
    validateRequest, 
    updateRoute
);

router.delete('/:id', 
    authMiddleware, 
    roleMiddleware(['admin', 'company']), 
    param('id').isInt({ min: 1 }).withMessage('Valid route ID is required'),
    validateRequest, 
    deleteRoute
);

export default router;