import { Router } from 'express';
import { Request, Response } from 'express';
import { sendOTP } from '../../services/otp.service';
import logger from '../../utils/logger';

const router = Router();

/**
 * Request OTP for registration
 * POST /api/v1/auth/request-otp
 */
router.post('/request-otp', async (req: Request, res: Response) => {
    try {
        const { phoneNumber, purpose = 'verification' } = req.body;
        
        if (!phoneNumber) {
            return res.status(400).json({
                success: false,
                message: 'Phone number is required'
            });
        }
        
        // Validate phone number format
        const phoneRegex = /^(\+?250|0)?[7][0-9]{8}$/;
        const normalizedPhone = phoneNumber.replace(/\s/g, '');
        if (!phoneRegex.test(normalizedPhone)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid phone number format. Use Rwanda format (e.g., 0781234567)'
            });
        }
        
        // Generate and send OTP
        const { generateOTP } = await import('../../services/otp.service');
        const otp = generateOTP();
        const sent = await sendOTP(normalizedPhone, otp, purpose as 'verification' | 'transaction');
        
        if (!sent) {
            return res.status(500).json({
                success: false,
                message: 'Failed to send OTP. Please try again later.'
            });
        }
        
        logger.info(`OTP requested for: ${normalizedPhone}`);
        
        res.json({
            success: true,
            message: 'OTP sent successfully to your phone number',
            expiresIn: 600 // 10 minutes in seconds
        });
    } catch (error: any) {
        logger.error('Error requesting OTP:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to send OTP'
        });
    }
});

/**
 * Verify OTP
 * POST /api/v1/auth/verify-otp
 */
router.post('/verify-otp', async (req: Request, res: Response) => {
    try {
        const { phoneNumber, otp } = req.body;
        
        if (!phoneNumber || !otp) {
            return res.status(400).json({
                success: false,
                message: 'Phone number and OTP are required'
            });
        }
        
        const { verifyOTP } = await import('../../services/otp.service');
        const isValid = await verifyOTP(phoneNumber, otp);
        
        if (!isValid) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired OTP'
            });
        }
        
        res.json({
            success: true,
            message: 'OTP verified successfully'
        });
    } catch (error: any) {
        logger.error('Error verifying OTP:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to verify OTP'
        });
    }
});

export default router;

