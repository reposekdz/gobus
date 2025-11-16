import * as notificationService from './notifications.service';
import asyncHandler from '../../utils/asyncHandler';

export const subscribe = asyncHandler(async (req, res) => {
    // req.user is attached by the 'protect' middleware
    await notificationService.subscribe(req.user!.id, req.body);
    res.status(201).json({ success: true, message: 'Subscribed successfully.' });
});
