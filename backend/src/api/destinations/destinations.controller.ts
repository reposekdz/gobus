import * as destinationService from './destinations.service';
import asyncHandler from '../../utils/asyncHandler';

// Public Controller
export const getDestinations = asyncHandler(async (req, res) => {
    const destinations = await destinationService.getAllDestinations();
    res.status(200).json({ success: true, data: destinations });
});

// Admin Controllers
export const createDestination = asyncHandler(async (req, res) => {
    const destination = await destinationService.createDestination(req.body);
    res.status(201).json({ success: true, data: destination });
});

export const updateDestination = asyncHandler(async (req, res) => {
    const destination = await destinationService.updateDestination(parseInt(req.params.id), req.body);
    res.status(200).json({ success: true, data: destination });
});

export const deleteDestination = asyncHandler(async (req, res) => {
    await destinationService.deleteDestination(parseInt(req.params.id));
    res.status(200).json({ success: true, data: {} });
});
