import * as settingsService from './settings.service';
import asyncHandler from '../../utils/asyncHandler';

export const getSetting = asyncHandler(async (req, res) => {
    const setting = await settingsService.getSetting(req.params.key);
    if (!setting) {
        // Return a default or empty response instead of 404
        // to prevent frontend errors if a setting isn't configured yet.
        return res.status(200).json({ success: true, data: { setting_value: null } });
    }
    res.status(200).json({ success: true, data: setting });
});

export const updateSetting = asyncHandler(async (req, res) => {
    const { value } = req.body;
    const setting = await settingsService.setSetting(req.params.key, value);
    res.status(200).json({ success: true, data: setting });
});
