import * as charterService from './charters.service';
import asyncHandler from '../../utils/asyncHandler';

export const createCharterRequest = asyncHandler(async (req, res) => {
    const charter = await charterService.createRequest(req.user.id, req.body);
    res.status(201).json({ success: true, data: charter });
});
