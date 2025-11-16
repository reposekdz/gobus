import * as userService from './user.service';
import asyncHandler from '../../utils/asyncHandler';

export const updateUserAvatar = asyncHandler(async (req, res) => {
    const { avatarData } = req.body;
    const result = await userService.updateUserAvatar(req.user!.id, avatarData);
    res.status(200).json({ success: true, data: result });
});

export const updateMyProfile = asyncHandler(async (req, res) => {
    const updatedUser = await userService.updateUserProfile(req.user!.id, req.body);
    res.status(200).json({ success: true, data: updatedUser });
});