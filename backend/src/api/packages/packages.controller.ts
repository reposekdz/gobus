import * as packageService from './packages.service';
import asyncHandler from '../../utils/asyncHandler';

export const createPackage = asyncHandler(async (req, res) => {
    const pkg = await packageService.createPackage(req.user.id, req.body);
    res.status(201).json({ success: true, data: pkg });
});

export const trackPackage = asyncHandler(async (req, res) => {
    const pkgStatus = await packageService.getPackageStatus(req.params.trackingId);
    res.status(200).json({ success: true, data: pkgStatus });
});
