import { Request, Response } from 'express';
import { catchAsync } from '../middleware/error.middleware';
import * as authService from './auth.service';

export const register = catchAsync(async (req: Request, res: Response) => {
    const result = await authService.register(req.body);
    res.status(201).json(result);
});

export const login = catchAsync(async (req: Request, res: Response) => {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const result = await authService.login(req.body);
    
    // Set refresh token in HTTP-only cookie
    res.cookie('refreshToken', result.data.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });
    
    res.status(200).json(result);
});

export const getMe = catchAsync(async (req: any, res: Response) => {
    const user = await authService.getUserById(req.user.id);
    res.status(200).json({ success: true, data: user });
});

export const updatePassword = catchAsync(async (req: any, res: Response) => {
    const { currentPassword, newPassword } = req.body;
    const result = await authService.updatePassword(req.user.id, currentPassword, newPassword);
    res.status(200).json(result);
});

export const refreshToken = catchAsync(async (req: Request, res: Response) => {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
    
    if (!refreshToken) {
        return res.status(401).json({
            success: false,
            message: 'Refresh token is required'
        });
    }
    
    const result = await authService.refreshAccessToken(refreshToken);
    res.status(200).json(result);
});

export const logout = catchAsync(async (req: any, res: Response) => {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
    
    if (refreshToken) {
        await authService.logout(req.user.id, refreshToken);
    }
    
    res.clearCookie('refreshToken');
    res.status(200).json({ success: true, message: 'Logged out successfully' });
});

export const verifyEmail = catchAsync(async (req: Request, res: Response) => {
    const { token } = req.body;
    const result = await authService.verifyEmail(token);
    res.status(200).json(result);
});

export const requestPasswordReset = catchAsync(async (req: Request, res: Response) => {
    const { email } = req.body;
    const result = await authService.requestPasswordReset(email);
    res.status(200).json(result);
});

export const resetPassword = catchAsync(async (req: Request, res: Response) => {
    const { token, newPassword } = req.body;
    const result = await authService.resetPassword(token, newPassword);
    res.status(200).json(result);
});