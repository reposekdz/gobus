import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const router = Router();

// In-memory storage for OTPs (use Redis in production)
const otpStorage = new Map<string, { otp: string; expires: number; userData?: any }>();

// Advanced OTP generation
const generateOTP = (): string => {
  return crypto.randomInt(100000, 999999).toString();
};

// Send OTP via SMS (integrate with real SMS service)
const sendOTP = async (phone: string, otp: string): Promise<boolean> => {
  try {
    // Integration with SMS service (Twilio, AWS SNS, etc.)
    console.log(`Sending OTP ${otp} to ${phone}`);
    // In production, integrate with actual SMS service
    return true;
  } catch (error) {
    console.error('SMS sending failed:', error);
    return false;
  }
};

// Request OTP for login
router.post('/request-otp', async (req, res) => {
  try {
    const { phone } = req.body;
    
    if (!phone || !phone.match(/^(\+250|250)?[0-9]{9}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Valid Rwandan phone number required'
      });
    }

    const otp = generateOTP();
    const expires = Date.now() + 5 * 60 * 1000; // 5 minutes
    
    otpStorage.set(phone, { otp, expires });
    
    const smsSent = await sendOTP(phone, otp);
    
    if (!smsSent) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send OTP'
      });
    }

    res.json({
      success: true,
      message: 'OTP sent successfully',
      expiresIn: 300 // 5 minutes
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Verify OTP and login
router.post('/verify-otp', async (req, res) => {
  try {
    const { phone, otp } = req.body;
    
    if (!phone || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Phone number and OTP required'
      });
    }

    const storedData = otpStorage.get(phone);
    
    if (!storedData) {
      return res.status(400).json({
        success: false,
        message: 'OTP not found or expired'
      });
    }

    if (Date.now() > storedData.expires) {
      otpStorage.delete(phone);
      return res.status(400).json({
        success: false,
        message: 'OTP expired'
      });
    }

    if (storedData.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP'
      });
    }

    // OTP verified, clear it
    otpStorage.delete(phone);

    // Check if user exists in database
    // In production, query actual database
    const user = {
      id: 1,
      name: 'John Doe',
      phone,
      email: 'john@example.com',
      role: 'passenger',
      wallet_balance: 75000,
      is_verified: true,
      created_at: new Date().toISOString()
    };

    const token = jwt.sign(
      { userId: user.id, phone: user.phone, role: user.role },
      process.env.JWT_SECRET || 'gobus_secret_key_2024',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      user,
      message: 'Login successful'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Advanced registration with OTP
router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, password, referralCode } = req.body;
    
    if (!name || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    // Validate phone number format
    if (!phone.match(/^(\+250|250)?[0-9]{9}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Valid Rwandan phone number required'
      });
    }

    // Validate email format
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      return res.status(400).json({
        success: false,
        message: 'Valid email address required'
      });
    }

    // Validate password strength
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long'
      });
    }

    const otp = generateOTP();
    const expires = Date.now() + 10 * 60 * 1000; // 10 minutes for registration
    
    const hashedPassword = await bcrypt.hash(password, 12);
    
    const userData = {
      name,
      email,
      phone,
      password: hashedPassword,
      referralCode,
      role: 'passenger',
      wallet_balance: referralCode ? 5000 : 0, // Bonus for referral
      is_verified: false
    };
    
    otpStorage.set(phone, { otp, expires, userData });
    
    const smsSent = await sendOTP(phone, otp);
    
    if (!smsSent) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send verification OTP'
      });
    }

    res.status(201).json({
      success: true,
      message: 'Registration initiated. Please verify your phone number with the OTP sent.',
      expiresIn: 600 // 10 minutes
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Verify registration OTP
router.post('/verify-registration', async (req, res) => {
  try {
    const { phone, otp } = req.body;
    
    const storedData = otpStorage.get(phone);
    
    if (!storedData || !storedData.userData) {
      return res.status(400).json({
        success: false,
        message: 'Registration session not found or expired'
      });
    }

    if (Date.now() > storedData.expires) {
      otpStorage.delete(phone);
      return res.status(400).json({
        success: false,
        message: 'OTP expired. Please restart registration.'
      });
    }

    if (storedData.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP'
      });
    }

    // OTP verified, create user account
    const userData = storedData.userData;
    userData.is_verified = true;
    userData.id = Date.now();
    userData.created_at = new Date().toISOString();
    
    otpStorage.delete(phone);

    // In production, save to database
    console.log('User registered:', userData);

    const token = jwt.sign(
      { userId: userData.id, phone: userData.phone, role: userData.role },
      process.env.JWT_SECRET || 'gobus_secret_key_2024',
      { expiresIn: '7d' }
    );

    // Remove password from response
    const { password, ...userResponse } = userData;

    res.status(201).json({
      success: true,
      token,
      user: userResponse,
      message: 'Registration completed successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Resend OTP
router.post('/resend-otp', async (req, res) => {
  try {
    const { phone } = req.body;
    
    const storedData = otpStorage.get(phone);
    
    if (!storedData) {
      return res.status(400).json({
        success: false,
        message: 'No active OTP session found'
      });
    }

    const newOtp = generateOTP();
    const expires = Date.now() + 5 * 60 * 1000;
    
    otpStorage.set(phone, { 
      ...storedData, 
      otp: newOtp, 
      expires 
    });
    
    const smsSent = await sendOTP(phone, newOtp);
    
    if (!smsSent) {
      return res.status(500).json({
        success: false,
        message: 'Failed to resend OTP'
      });
    }

    res.json({
      success: true,
      message: 'OTP resent successfully',
      expiresIn: 300
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Password reset with OTP
router.post('/forgot-password', async (req, res) => {
  try {
    const { phone } = req.body;
    
    if (!phone || !phone.match(/^(\+250|250)?[0-9]{9}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Valid phone number required'
      });
    }

    // Check if user exists (in production, query database)
    const userExists = true; // Replace with actual database check
    
    if (!userExists) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this phone number'
      });
    }

    const otp = generateOTP();
    const expires = Date.now() + 10 * 60 * 1000;
    
    otpStorage.set(`reset_${phone}`, { otp, expires });
    
    const smsSent = await sendOTP(phone, otp);
    
    if (!smsSent) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send reset OTP'
      });
    }

    res.json({
      success: true,
      message: 'Password reset OTP sent',
      expiresIn: 600
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Reset password with OTP
router.post('/reset-password', async (req, res) => {
  try {
    const { phone, otp, newPassword } = req.body;
    
    if (!phone || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Phone, OTP, and new password required'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long'
      });
    }

    const storedData = otpStorage.get(`reset_${phone}`);
    
    if (!storedData) {
      return res.status(400).json({
        success: false,
        message: 'Reset session not found or expired'
      });
    }

    if (Date.now() > storedData.expires) {
      otpStorage.delete(`reset_${phone}`);
      return res.status(400).json({
        success: false,
        message: 'OTP expired'
      });
    }

    if (storedData.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP'
      });
    }

    // OTP verified, update password
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    // In production, update password in database
    console.log(`Password updated for ${phone}`);
    
    otpStorage.delete(`reset_${phone}`);

    res.json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

export default router;