import * as adService from './advertisements.service';
import asyncHandler from '../../utils/asyncHandler';

export const getActiveAds = asyncHandler(async (req, res) => {
    const ads = await adService.getActiveAds();
    res.status(200).json({ success: true, data: ads });
});

export const getAllAds = asyncHandler(async (req, res) => {
    const ads = await adService.getAllAds();
    res.status(200).json({ success: true, data: ads });
});

export const createAd = asyncHandler(async (req, res) => {
    const ad = await adService.createAd(req.body);
    res.status(201).json({ success: true, data: ad });
});

export const updateAd = asyncHandler(async (req, res) => {
    const ad = await adService.updateAd(parseInt(req.params.id), req.body);
    res.status(200).json({ success: true, data: ad });
});

export const deleteAd = asyncHandler(async (req, res) => {
    await adService.deleteAd(parseInt(req.params.id));
    res.status(200).json({ success: true, data: {} });
});
