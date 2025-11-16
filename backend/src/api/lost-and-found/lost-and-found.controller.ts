import * as lostAndFoundService from './lost-and-found.service';
import asyncHandler from '../../utils/asyncHandler';

export const getFoundItems = asyncHandler(async (req, res) => {
    const items = await lostAndFoundService.getAllFoundItems();
    res.status(200).json({ success: true, data: items });
});

export const reportLostItem = asyncHandler(async (req, res) => {
    const item = await lostAndFoundService.createLostItemReport(req.user.id, req.body);
    res.status(201).json({ success: true, data: item });
});
