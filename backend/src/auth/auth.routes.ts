import { Router } from 'express';
import * as authController from './auth.controller';
import { authenticateToken as authMiddleware } from '../middleware/auth.middleware';
import { body } from 'express-validator';
import { validateRequest } from '../middleware/validation.middleware';

const router = Router();

// Validation rules
const registerValidation = [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
    body('name').notEmpty().withMessage('Name is required'),
    body('phone').notEmpty().withMessage('Phone number is required'),
    body('role').optional().isIn(['passenger', 'driver', 'agent', 'company', 'admin']).withMessage('Invalid role')
];

const loginValidation = [
    body('email').notEmpty().withMessage('Email or phone is required'),
    body('password').notEmpty().withMessage('Password is required')
];

const updatePasswordValidation = [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters long')
];

const verifyEmailValidation = [
    body('token').notEmpty().withMessage('Verification token is required')
];

const requestPasswordResetValidation = [
    body('email').isEmail().withMessage('Valid email is required')
];

const resetPasswordValidation = [
    body('token').notEmpty().withMessage('Reset token is required'),
    body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters long')
];

// OTP routes
import otpRoutes from '../api/auth/otp.routes';
router.use('/otp', otpRoutes);

// Public routes
router.post('/register', registerValidation, validateRequest, authController.register);
router.post('/login', loginValidation, validateRequest, authController.login);
router.post('/refresh-token', authController.refreshToken);
router.post('/verify-email', verifyEmailValidation, validateRequest, authController.verifyEmail);
router.post('/request-password-reset', requestPasswordResetValidation, validateRequest, authController.requestPasswordReset);
router.post('/reset-password', resetPasswordValidation, validateRequest, authController.resetPassword);

// Protected routes
router.get('/me', authMiddleware, authController.getMe);
router.put('/update-password', authMiddleware, updatePasswordValidation, validateRequest, authController.updatePassword);
router.post('/logout', authMiddleware, authController.logout);

export default router;