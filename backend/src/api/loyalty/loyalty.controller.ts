import * as loyaltyService from './loyalty.service';
import asyncHandler from '../../utils/asyncHandler';

export const getLoyaltyHistory = asyncHandler(async (req, res) => {
    const history = await loyaltyService.getHistoryForUser(req.user.id);
    res.status(200).json({ success: true, data: history });
});
