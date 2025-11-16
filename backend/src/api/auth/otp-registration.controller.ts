import { Request, Response } from 'express';
import { pool } from '../../config/db';
import { generateOTP, sendOTP, verifyOTP } from '../../services/otp.service';
import { generateSerialCode } from '../../services/serial-code.service';
import { PassengerWalletService } from '../../services/passenger-wallet.service';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import config from '../../config';
import { AppError } from '../../utils/AppError';
import logger from '../../utils/logger';
import * as mysql from 'mysql2/promise';

/**
 * OTP-based Passenger Registration Controller
 * Handles passenger registration with OTP verification via mobile SMS
 */

/**
 * Request OTP for passenger registration
 */
export const requestRegistrationOTP = async (req: Request, res: Response) => {
  try {
    const { name, email, phone, password } = req.body;

    if (!name || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, phone number, and password are required'
      });
    }

    // Validate phone number (Rwanda format)
    const phoneRegex = /^(\+?250|0)?[7][0-9]{8}$/;
    const normalizedPhone = phone.replace(/\s/g, '');
    
    if (!phoneRegex.test(normalizedPhone)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid phone number format. Use Rwanda format (e.g., 0781234567 or +250781234567)'
      });
    }

    // Validate password strength
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long'
      });
    }

    // Check if user already exists
    const [existingUsers] = await pool.execute<mysql.RowDataPacket[]>(
      'SELECT id FROM users WHERE phone = ? OR email = ?',
      [normalizedPhone, email]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'User with this phone number or email already exists'
      });
    }

    // Generate OTP
    const otp = generateOTP();

    // Send OTP via SMS
    const smsSent = await sendOTP(normalizedPhone, otp, 'verification');

    if (!smsSent) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send OTP. Please try again.'
      });
    }

    // Store registration data temporarily (you might want to use Redis for this in production)
    // For now, we'll rely on OTP verification in phone_verifications table

    logger.info(`Registration OTP sent to ${normalizedPhone}`);

    res.json({
      success: true,
      message: 'OTP sent to your mobile number. Please verify to complete registration.',
      expiresIn: 600 // 10 minutes
    });
  } catch (error: any) {
    logger.error('Error requesting registration OTP:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to send OTP'
    });
  }
};

/**
 * Verify OTP and complete passenger registration
 */
export const verifyOTPAndRegister = async (req: Request, res: Response) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const { name, email, phone, password, otp } = req.body;

    if (!name || !phone || !password || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Name, phone number, password, and OTP are required'
      });
    }

    // Normalize phone
    const normalizedPhone = phone.replace(/\s/g, '');
    if (normalizedPhone.startsWith('0')) {
      normalizedPhone.replace('0', '+250');
    } else if (!normalizedPhone.startsWith('+250')) {
      normalizedPhone = '+250' + normalizedPhone;
    }

    // Verify OTP
    const isValidOTP = await verifyOTP(normalizedPhone, otp);
    if (!isValidOTP) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP. Please request a new one.'
      });
    }

    // Check if user already exists (double check)
    const [existingUsers] = await connection.execute<mysql.RowDataPacket[]>(
      'SELECT id FROM users WHERE phone = ? OR (email IS NOT NULL AND email = ?)',
      [normalizedPhone, email]
    );

    if (existingUsers.length > 0) {
      await connection.rollback();
      return res.status(409).json({
        success: false,
        message: 'User with this phone number or email already exists'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate serial code (3 capital letters + 4 unique numbers)
    const serialCode = await generateSerialCode(name);

    // Create user account
    const [userResult] = await connection.execute<mysql.ResultSetHeader>(
      `INSERT INTO users (
        name, email, phone_number, password_hash, role, serial_code,
        is_active, is_verified, phone_verified, otp_verified_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, 'passenger', ?, 1, 1, 1, NOW(), NOW(), NOW())`,
      [name, email || null, normalizedPhone, hashedPassword, serialCode]
    );

    const userId = userResult.insertId;

    // Create wallet for passenger (balance starts at 0 RWF, PIN not set yet)
    await connection.execute(
      `INSERT INTO wallets (
        user_id, balance, currency, can_deposit, pin_set, created_at, updated_at
      ) VALUES (?, 0, 'RWF', 0, 0, NOW(), NOW())`,
      [userId]
    );

    await connection.commit();

    // Generate JWT token
    const token = jwt.sign(
      {
        id: userId,
        email: email,
        phone: normalizedPhone,
        role: 'passenger'
      },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    logger.info(`New passenger registered: ${name} (ID: ${userId}, Serial: ${serialCode})`);

    // Get user data
    const [users] = await connection.execute<mysql.RowDataPacket[]>(
      `SELECT id, name, email, phone_number as phone, role, serial_code, is_verified, phone_verified
       FROM users WHERE id = ?`,
      [userId]
    );

    res.status(201).json({
      success: true,
      message: 'Registration completed successfully. Please set your wallet PIN.',
      data: {
        token,
        user: users[0],
        wallet: {
          balance: 0,
          currency: 'RWF',
          pin_set: false,
          serial_code: serialCode
        }
      }
    });
  } catch (error: any) {
    await connection.rollback();
    logger.error('Error completing registration:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to complete registration'
    });
  } finally {
    connection.release();
  }
};

/**
 * Resend OTP for registration
 */
export const resendRegistrationOTP = async (req: Request, res: Response) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required'
      });
    }

    // Normalize phone
    const normalizedPhone = phone.replace(/\s/g, '');
    if (normalizedPhone.startsWith('0')) {
      normalizedPhone.replace('0', '+250');
    } else if (!normalizedPhone.startsWith('+250')) {
      normalizedPhone = '+250' + normalizedPhone;
    }

    // Check if user already exists
    const [existingUsers] = await pool.execute<mysql.RowDataPacket[]>(
      'SELECT id FROM users WHERE phone = ?',
      [normalizedPhone]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'User with this phone number already exists'
      });
    }

    // Generate and send new OTP
    const otp = generateOTP();
    const smsSent = await sendOTP(normalizedPhone, otp, 'verification');

    if (!smsSent) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send OTP. Please try again.'
      });
    }

    res.json({
      success: true,
      message: 'OTP resent to your mobile number',
      expiresIn: 600
    });
  } catch (error: any) {
    logger.error('Error resending OTP:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to resend OTP'
    });
  }
};
