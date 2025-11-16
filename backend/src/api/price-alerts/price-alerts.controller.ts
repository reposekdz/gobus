import * as alertService from './price-alerts.service';
import asyncHandler from '../../utils/asyncHandler';

export const createAlert = asyncHandler(async (req, res) => {
    const alert = await alertService.createAlert(req.user.id, req.body);
    res.status(201).json({ success: true, data: alert });
});

export const getMyAlerts = asyncHandler(async (req, res) => {
    const alerts = await alertService.getAlertsForUser(req.user.id);
    res.status(200).json({ success: true, data: alerts });
});

export const deleteAlert = asyncHandler(async (req, res) => {
    await alertService.deleteAlert(req.user.id, parseInt(req.params.id));
    res.status(200).json({ success: true, data: {} });
});
