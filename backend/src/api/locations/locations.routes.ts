import { Router } from 'express';
import { getAllLocations, getStationsByDistrictName, searchLocations, getDistrictsAndProvinces } from './locations.controller';

const router = Router();

router.get('/all', getAllLocations);
router.get('/districts', getDistrictsAndProvinces);
router.get('/district/:district', getStationsByDistrictName);
router.get('/search', searchLocations);

export default router;