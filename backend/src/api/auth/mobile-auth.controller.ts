import { Request, Response } from 'express';
import { pool } from '../../config/database';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

// Generate OTP
const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP (mock implementation - replace with real SMS service)
const sendOTP = async (phoneNumber: string, otp: string): Promise<boolean> => {
  console.log(`Sending OTP ${otp} to ${phoneNumber}`);
  // In production, integrate with SMS service like Twilio, Africa's Talking, etc.
  return true;
};

// Request OTP for phone verification
export const requestOTP = async (req: Request, res: Response) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    // Validate Rwanda phone number format
    const phoneRegex = /^(\+?25)?(078|079|072|073)\d{7}$/;
    if (!phoneRegex.test(phoneNumber)) {
      return res.status(400).json({ error: 'Invalid Rwanda phone number format' });
    }

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Store OTP in database
    await pool.execute(
      `INSERT INTO phone_verifications (phone_number, otp_code, expires_at, verified, created_at)
       VALUES (?, ?, ?, false, NOW())
       ON DUPLICATE KEY UPDATE 
       otp_code = VALUES(otp_code), 
       expires_at = VALUES(expires_at), 
       verified = false, 
       attempts = 0`,
      [phoneNumber, otp, expiresAt]
    );

    // Send OTP via SMS
    const sent = await sendOTP(phoneNumber, otp);
    
    if (!sent) {
      return res.status(500).json({ error: 'Failed to send OTP' });
    }

    res.json({ 
      message: 'OTP sent successfully',
      phoneNumber,
      expiresIn: 300 // 5 minutes in seconds
    });
  } catch (error) {
    console.error('Error requesting OTP:', error);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
};

// Verify OTP
export const verifyOTP = async (req: Request, res: Response) => {
  try {
    const { phoneNumber, otp } = req.body;

    if (!phoneNumber || !otp) {
      return res.status(400).json({ error: 'Phone number and OTP are required' });
    }

    const [rows] = await pool.execute(
      `SELECT * FROM phone_verifications 
       WHERE phone_number = ? AND otp_code = ? AND expires_at > NOW() AND verified = false`,
      [phoneNumber, otp]
    ) as any;

    if (rows.length === 0) {
      // Increment failed attempts
      await pool.execute(
        'UPDATE phone_verifications SET attempts = attempts + 1 WHERE phone_number = ?',
        [phoneNumber]
      );
      
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    // Mark as verified
    await pool.execute(
      'UPDATE phone_verifications SET verified = true, verified_at = NOW() WHERE phone_number = ?',
      [phoneNumber]
    );

    res.json({ 
      message: 'Phone number verified successfully',
      phoneNumber,
      verified: true
    });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({ error: 'Failed to verify OTP' });
  }
};

// Mobile registration with phone verification
export const mobileRegister = async (req: Request, res: Response) => {
  try {
    const { name, email, phoneNumber, password, role = 'passenger' } = req.body;

    if (!name || !phoneNumber || !password) {
      return res.status(400).json({ error: 'Name, phone number, and password are required' });
    }

    // Check if phone is verified
    const [verificationRows] = await pool.execute(
      'SELECT verified FROM phone_verifications WHERE phone_number = ? AND verified = true',
      [phoneNumber]
    ) as any;

    if (verificationRows.length === 0) {
      return res.status(400).json({ error: 'Phone number not verified. Please verify first.' });
    }

    // Check if user already exists
    const [existingUsers] = await pool.execute(
      'SELECT id FROM users WHERE phone = ? OR email = ?',
      [phoneNumber, email]
    ) as any;

    if (existingUsers.length > 0) {
      return res.status(400).json({ error: 'User already exists with this phone or email' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = uuidv4();

    // Create user
    await pool.execute(
      `INSERT INTO users (id, name, email, phone, password, role, phone_verified, wallet_balance, created_at)
       VALUES (?, ?, ?, ?, ?, ?, true, 0, NOW())`,
      [userId, name, email, phoneNumber, hashedPassword, role]
    );

    // Generate JWT token
    const token = jwt.sign(
      { id: userId, phone: phoneNumber, role },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '30d' }
    );

    // Get user data
    const [userRows] = await pool.execute(
      'SELECT id, name, email, phone, role, wallet_balance, phone_verified FROM users WHERE id = ?',
      [userId]
    ) as any;

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: userRows[0]
    });
  } catch (error) {
    console.error('Error in mobile registration:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
};

// Mobile login with phone number
export const mobileLogin = async (req: Request, res: Response) => {
  try {
    const { phoneNumber, password } = req.body;

    if (!phoneNumber || !password) {
      return res.status(400).json({ error: 'Phone number and password are required' });
    }

    // Find user by phone
    const [userRows] = await pool.execute(
      'SELECT * FROM users WHERE phone = ?',
      [phoneNumber]
    ) as any;

    if (userRows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = userRows[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, phone: user.phone, role: user.role },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '30d' }
    );

    // Update last login
    await pool.execute(
      'UPDATE users SET last_login = NOW() WHERE id = ?',
      [user.id]
    );

    // Return user data without password
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      message: 'Login successful',
      token,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Error in mobile login:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};

// Resend OTP
export const resendOTP = async (req: Request, res: Response) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    // Check if too many attempts
    const [attemptRows] = await pool.execute(
      'SELECT attempts FROM phone_verifications WHERE phone_number = ?',
      [phoneNumber]
    ) as any;

    if (attemptRows.length > 0 && attemptRows[0].attempts >= 5) {
      return res.status(429).json({ error: 'Too many attempts. Please try again later.' });
    }

    // Generate new OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await pool.execute(
      `UPDATE phone_verifications 
       SET otp_code = ?, expires_at = ?, verified = false 
       WHERE phone_number = ?`,
      [otp, expiresAt, phoneNumber]
    );

    // Send OTP
    const sent = await sendOTP(phoneNumber, otp);
    
    if (!sent) {
      return res.status(500).json({ error: 'Failed to send OTP' });
    }

    res.json({ 
      message: 'OTP resent successfully',
      expiresIn: 300
    });
  } catch (error) {
    console.error('Error resending OTP:', error);
    res.status(500).json({ error: 'Failed to resend OTP' });
  }
};

// Check phone verification status
export const checkVerificationStatus = async (req: Request, res: Response) => {
  try {
    const { phoneNumber } = req.params;

    const [rows] = await pool.execute(
      'SELECT verified, verified_at FROM phone_verifications WHERE phone_number = ?',
      [phoneNumber]
    ) as any;

    if (rows.length === 0) {
      return res.json({ verified: false });
    }

    res.json({
      verified: rows[0].verified,
      verifiedAt: rows[0].verified_at
    });
  } catch (error) {
    console.error('Error checking verification status:', error);
    res.status(500).json({ error: 'Failed to check verification status' });
  }
};