import { pool } from '../config/db';
import * as mysql from 'mysql2/promise';
import logger from '../utils/logger';
import { mtnService } from './mtn-momo.service';

/**
 * Generate 6-digit OTP
 */
export const generateOTP = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Send OTP via SMS (MTN Mobile Money API or SMS gateway)
 */
export const sendOTP = async (phoneNumber: string, otp: string, purpose: 'verification' | 'transaction' = 'verification'): Promise<boolean> => {
    try {
        // Normalize phone number
        let normalizedPhone = phoneNumber.replace(/\s/g, '');
        if (normalizedPhone.startsWith('0')) {
            normalizedPhone = '+250' + normalizedPhone.substring(1);
        } else if (!normalizedPhone.startsWith('+250')) {
            normalizedPhone = '+250' + normalizedPhone;
        }
        
        // Store OTP in database
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
        await pool.execute(
            `INSERT INTO phone_verifications (phone_number, otp_code, expires_at, verified, attempts)
             VALUES (?, ?, ?, FALSE, 0)
             ON DUPLICATE KEY UPDATE 
                otp_code = VALUES(otp_code),
                expires_at = VALUES(expires_at),
                verified = FALSE,
                attempts = 0,
                created_at = NOW()`,
            [normalizedPhone, otp, expiresAt]
        );
        
        // Send SMS via MTN API or SMS gateway
        // For now, we'll use a mock SMS service. In production, integrate with actual SMS provider
        const message = purpose === 'verification' 
            ? `Your GoBus verification code is: ${otp}. Valid for 10 minutes.`
            : `Your GoBus transaction code is: ${otp}. Valid for 10 minutes.`;
        
        // TODO: Integrate with actual SMS provider (Africas Talking, Twilio, etc.)
        // For now, log it (in production, this should send actual SMS)
        logger.info(`OTP sent to ${normalizedPhone}: ${otp}`);
        
        // In production, uncomment and configure:
        // await smsService.sendSMS(normalizedPhone, message);
        
        return true;
    } catch (error: any) {
        logger.error('Error sending OTP:', error);
        return false;
    }
};

/**
 * Verify OTP
 */
export const verifyOTP = async (phoneNumber: string, otp: string): Promise<boolean> => {
    try {
        // Normalize phone number
        let normalizedPhone = phoneNumber.replace(/\s/g, '');
        if (normalizedPhone.startsWith('0')) {
            normalizedPhone = '+250' + normalizedPhone.substring(1);
        } else if (!normalizedPhone.startsWith('+250')) {
            normalizedPhone = '+250' + normalizedPhone;
        }
        
        // Get verification record
        const [verifications] = await pool.execute<mysql.RowDataPacket[]>(
            `SELECT * FROM phone_verifications 
             WHERE phone_number = ? AND otp_code = ? AND verified = FALSE`,
            [normalizedPhone, otp]
        );
        
        if (verifications.length === 0) {
            // Increment attempts
            await pool.execute(
                `UPDATE phone_verifications 
                 SET attempts = attempts + 1 
                 WHERE phone_number = ?`,
                [normalizedPhone]
            );
            return false;
        }
        
        const verification = verifications[0];
        
        // Check if expired
        if (new Date(verification.expires_at) < new Date()) {
            return false;
        }
        
        // Check attempts (max 5 attempts)
        if (verification.attempts >= 5) {
            return false;
        }
        
        // Mark as verified
        await pool.execute(
            `UPDATE phone_verifications 
             SET verified = TRUE, verified_at = NOW() 
             WHERE phone_number = ? AND otp_code = ?`,
            [normalizedPhone, otp]
        );
        
        return true;
    } catch (error: any) {
        logger.error('Error verifying OTP:', error);
        return false;
    }
};

/**
 * Check if phone is verified
 */
export const isPhoneVerified = async (phoneNumber: string): Promise<boolean> => {
    try {
        let normalizedPhone = phoneNumber.replace(/\s/g, '');
        if (normalizedPhone.startsWith('0')) {
            normalizedPhone = '+250' + normalizedPhone.substring(1);
        } else if (!normalizedPhone.startsWith('+250')) {
            normalizedPhone = '+250' + normalizedPhone;
        }
        
        const [verifications] = await pool.execute<mysql.RowDataPacket[]>(
            `SELECT verified FROM phone_verifications 
             WHERE phone_number = ? AND verified = TRUE 
             ORDER BY verified_at DESC LIMIT 1`,
            [normalizedPhone]
        );
        
        return verifications.length > 0;
    } catch (error) {
        return false;
    }
};

