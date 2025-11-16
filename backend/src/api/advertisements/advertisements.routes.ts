import { Router } from 'express';
import { protect, authorize } from '../../middleware/auth.middleware';
import { getActiveAds, getAllAds, createAd, updateAd, deleteAd } from './advertisements.controller';

const router = Router();

router.get('/', getActiveAds); // Public

// Admin only below this point
router.use(protect, authorize('admin'));

router.get('/all', getAllAds);
router.post('/', createAd);
router.put('/:id', updateAd);
router.delete('/:id', deleteAd);

export default router;
