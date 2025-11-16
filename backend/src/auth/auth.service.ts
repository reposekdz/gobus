import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../config/db';
import config from '../config';
import { AppError } from '../middleware/error.middleware';
import logger from '../utils/logger';
import * as mysql from 'mysql2/promise';

interface RegisterData {
    email: string;
    password: string;
    name: string;
    phone: string;
    role?: 'passenger' | 'driver' | 'agent' | 'company' | 'admin';
    companyId?: number;
}

interface LoginCredentials {
    email: string;
    password: string;
}

export const register = async (userData: RegisterData) => {
    const { email, password, name, phone, role = 'passenger', companyId, otp } = userData;
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        throw new AppError('Invalid email format', 400);
    }
    
    // Validate password strength
    if (password.length < config.security.passwordMinLength) {
        throw new AppError(`Password must be at least ${config.security.passwordMinLength} characters long`, 400);
    }
    
    // Validate phone number (Rwanda format)
    const phoneRegex = /^(\+?250|0)?[7][0-9]{8}$/;
    const normalizedPhone = phone.replace(/\s/g, '');
    if (!phoneRegex.test(normalizedPhone)) {
        throw new AppError('Invalid phone number format. Use Rwanda format (e.g., 0781234567 or +250781234567)', 400);
    }
    
    // Verify OTP for passengers (required)
    if (role === 'passenger' && otp) {
        const { verifyOTP } = await import('../services/otp.service');
        const isValidOTP = await verifyOTP(normalizedPhone, otp);
        if (!isValidOTP) {
            throw new AppError('Invalid or expired OTP. Please request a new one.', 400);
        }
    } else if (role === 'passenger') {
        throw new AppError('OTP verification required for passenger registration', 400);
    }
    
    // Check if user already exists
    const [existingUsers] = await pool.execute<any[] & mysql.RowDataPacket[]>(
        'SELECT id FROM users WHERE email = ? OR phone = ?',
        [email, normalizedPhone]
    );
    
    if (existingUsers.length > 0) {
        throw new AppError('User with this email or phone number already exists', 409);
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, config.security.bcryptRounds);
    
    // Generate serial code for passengers
    let serialCode = null;
    if (role === 'passenger') {
        const { generateSerialCode } = await import('../services/serial-code.service');
        serialCode = await generateSerialCode(name);
    }
    
    // Insert user
    const [result] = await pool.execute<mysql.ResultSetHeader>(
        `INSERT INTO users (email, password, name, phone, role, company_id, serial_code, is_active, is_verified, phone_verified, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 1, 0, 1, NOW(), NOW())`,
        [email, hashedPassword, name, normalizedPhone, role, companyId || null, serialCode]
    );
    
    const userId = result.insertId;
    
    // Create wallet for passenger (starts at 0 RWF, PIN required)
    if (role === 'passenger') {
        await pool.execute(
            `INSERT INTO wallets (user_id, balance, pin_set, created_at, updated_at)
             VALUES (?, 0, FALSE, NOW(), NOW())`,
            [userId]
        );
    }
    
    logger.info(`New user registered: ${email} (ID: ${userId}, Role: ${role}, Serial: ${serialCode})`);
    
    // Generate access token
    const accessToken = jwt.sign(
        { 
            id: userId,
            email: email,
            role: role,
            companyId: companyId || null
        },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
    );
    
    // Get created user data
    const [users] = await pool.execute<any[] & mysql.RowDataPacket[]>(
        `SELECT id, email, name, phone, role, company_id, serial_code, is_verified, phone_verified 
         FROM users WHERE id = ?`,
        [userId]
    );
    
    const user = users[0];
    
    return {
        success: true,
        message: role === 'passenger' 
            ? 'Account created successfully! Please set your wallet PIN.'
            : 'User registered successfully.',
        data: {
            user: {
                ...user,
                wallet_balance: role === 'passenger' ? 0 : null,
                wallet_pin_set: role === 'passenger' ? false : null
            },
            token: accessToken,
            requiresPinSetup: role === 'passenger'
        }
    };
};

export const login = async (credentials: LoginCredentials) => {
    const { email, password } = credentials;
    
    if (!email || !password) {
        throw new AppError('Email and password are required', 400);
    }
    
    // Find user by email or phone
    const [users] = await pool.execute<any[] & mysql.RowDataPacket[]>(
        `SELECT u.*, c.name as company_name, c.logo as company_logo 
         FROM users u
         LEFT JOIN companies c ON u.company_id = c.id
         WHERE u.email = ? OR u.phone = ?`,
        [email, email]
    );
    
    if (users.length === 0) {
        throw new AppError('Invalid email or password', 401);
    }
    
    const user = users[0];
    
    // Check if user is active
    if (!user.is_active) {
        throw new AppError('Your account has been deactivated. Please contact support.', 403);
    }
    
    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
        // Log failed login attempt
        await pool.execute(
            'INSERT INTO login_attempts (user_id, ip_address, success, created_at) VALUES (?, ?, 0, NOW())',
            [user.id, 'unknown'] // IP should be passed from controller
        );
        
        throw new AppError('Invalid email or password', 401);
    }
    
    // Check login attempts and account lockout
    const [recentAttempts] = await pool.execute<any[] & mysql.RowDataPacket[]>(
        `SELECT COUNT(*) as failed_attempts 
         FROM login_attempts 
         WHERE user_id = ? AND success = 0 AND created_at > DATE_SUB(NOW(), INTERVAL ? MINUTE)`,
        [user.id, config.security.lockoutDurationMinutes]
    );
    
    if (recentAttempts[0].failed_attempts >= config.security.maxLoginAttempts) {
        throw new AppError(
            `Account temporarily locked due to too many failed login attempts. Please try again in ${config.security.lockoutDurationMinutes} minutes.`,
            429
        );
    }
    
    // Log successful login
    await pool.execute(
        'INSERT INTO login_attempts (user_id, ip_address, success, created_at) VALUES (?, ?, 1, NOW())',
        [user.id, 'unknown']
    );
    
    // Update last login
    await pool.execute(
        'UPDATE users SET last_login = NOW() WHERE id = ?',
        [user.id]
    );
    
    // Generate tokens
    const accessToken = jwt.sign(
        { 
            id: user.id,
            email: user.email,
            role: user.role,
            companyId: user.company_id
        },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
    );
    
    const refreshToken = jwt.sign(
        { id: user.id, type: 'refresh' },
        config.jwt.refreshSecret,
        { expiresIn: config.jwt.refreshExpiresIn }
    );
    
    // Store refresh token
    await pool.execute(
        'INSERT INTO refresh_tokens (user_id, token, expires_at, created_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 30 DAY), NOW())',
        [user.id, refreshToken]
    );
    
    logger.info(`User logged in: ${email} (ID: ${user.id}, Role: ${user.role})`);
    
    return {
        success: true,
        message: 'Login successful',
        data: {
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                phone: user.phone,
                role: user.role,
                companyId: user.company_id,
                companyName: user.company_name,
                companyLogo: user.company_logo,
                isVerified: user.is_verified,
                profilePicture: user.profile_picture
            },
            accessToken,
            refreshToken
        }
    };
};

export const getUserById = async (id: number) => {
    const [users] = await pool.execute<any[] & mysql.RowDataPacket[]>(
        `SELECT u.id, u.email, u.name, u.phone, u.role, u.company_id, u.is_verified, u.profile_picture,
                c.name as company_name, c.logo as company_logo
         FROM users u
         LEFT JOIN companies c ON u.company_id = c.id
         WHERE u.id = ?`,
        [id]
    );
    
    if (users.length === 0) {
        throw new AppError('User not found', 404);
    }
    
    return users[0];
};

export const updatePassword = async (userId: number, currentPassword: string, newPassword: string) => {
    // Get user with password
    const [users] = await pool.execute<any[] & mysql.RowDataPacket[]>(
        'SELECT password FROM users WHERE id = ?',
        [userId]
    );
    
    if (users.length === 0) {
        throw new AppError('User not found', 404);
    }
    
    const user = users[0];
    
    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
        throw new AppError('Current password is incorrect', 401);
    }
    
    // Validate new password
    if (newPassword.length < config.security.passwordMinLength) {
        throw new AppError(`Password must be at least ${config.security.passwordMinLength} characters long`, 400);
    }
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, config.security.bcryptRounds);
    
    // Update password
    await pool.execute(
        'UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?',
        [hashedPassword, userId]
    );
    
    logger.info(`Password updated for user ID: ${userId}`);
    
    return { success: true, message: 'Password updated successfully' };
};

export const refreshAccessToken = async (refreshToken: string) => {
    try {
        // Verify refresh token
        const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret) as any;
        
        if (decoded.type !== 'refresh') {
            throw new AppError('Invalid token type', 401);
        }
        
        // Check if refresh token exists and is valid
        const [tokens] = await pool.execute<any[] & mysql.RowDataPacket[]>(
            'SELECT * FROM refresh_tokens WHERE user_id = ? AND token = ? AND expires_at > NOW() AND revoked = 0',
            [decoded.id, refreshToken]
        );
        
        if (tokens.length === 0) {
            throw new AppError('Invalid or expired refresh token', 401);
        }
        
        // Get user
        const user = await getUserById(decoded.id);
        
        // Generate new access token
        const accessToken = jwt.sign(
            {
                id: user.id,
                email: user.email,
                role: user.role,
                companyId: user.company_id
            },
            config.jwt.secret,
            { expiresIn: config.jwt.expiresIn }
        );
        
        return {
            success: true,
            data: { accessToken }
        };
    } catch (error) {
        throw new AppError('Invalid or expired refresh token', 401);
    }
};

export const logout = async (userId: number, refreshToken: string) => {
    // Revoke refresh token
    await pool.execute(
        'UPDATE refresh_tokens SET revoked = 1, updated_at = NOW() WHERE user_id = ? AND token = ?',
        [userId, refreshToken]
    );
    
    logger.info(`User logged out: ID ${userId}`);
    
    return { success: true, message: 'Logged out successfully' };
};

export const verifyEmail = async (token: string) => {
    try {
        const decoded = jwt.verify(token, config.jwt.secret) as any;
        
        if (decoded.type !== 'verification') {
            throw new AppError('Invalid verification token', 400);
        }
        
        // Update user verification status
        await pool.execute(
            'UPDATE users SET is_verified = 1, updated_at = NOW() WHERE id = ?',
            [decoded.userId]
        );
        
        logger.info(`Email verified for user ID: ${decoded.userId}`);
        
        return { success: true, message: 'Email verified successfully' };
    } catch (error) {
        throw new AppError('Invalid or expired verification token', 400);
    }
};

export const requestPasswordReset = async (email: string) => {
    const [users] = await pool.execute<any[] & mysql.RowDataPacket[]>(
        'SELECT id, email FROM users WHERE email = ?',
        [email]
    );
    
    if (users.length === 0) {
        // Don't reveal if email exists
        return { success: true, message: 'If the email exists, a password reset link has been sent.' };
    }
    
    const user = users[0];
    
    // Generate reset token
    const resetToken = jwt.sign(
        { userId: user.id, email: user.email, type: 'password_reset' },
        config.jwt.secret,
        { expiresIn: '1h' }
    );
    
    // Store reset token
    await pool.execute(
        'INSERT INTO password_reset_tokens (user_id, token, expires_at, created_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 1 HOUR), NOW())',
        [user.id, resetToken]
    );
    
    logger.info(`Password reset requested for user: ${email}`);
    
    return {
        success: true,
        message: 'If the email exists, a password reset link has been sent.',
        data: { resetToken } // In production, send this via email
    };
};

export const resetPassword = async (token: string, newPassword: string) => {
    try {
        const decoded = jwt.verify(token, config.jwt.secret) as any;
        
        if (decoded.type !== 'password_reset') {
            throw new AppError('Invalid reset token', 400);
        }
        
        // Check if token exists and is valid
        const [tokens] = await pool.execute<any[] & mysql.RowDataPacket[]>(
            'SELECT * FROM password_reset_tokens WHERE user_id = ? AND token = ? AND expires_at > NOW() AND used = 0',
            [decoded.userId, token]
        );
        
        if (tokens.length === 0) {
            throw new AppError('Invalid or expired reset token', 400);
        }
        
        // Validate new password
        if (newPassword.length < config.security.passwordMinLength) {
            throw new AppError(`Password must be at least ${config.security.passwordMinLength} characters long`, 400);
        }
        
        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, config.security.bcryptRounds);
        
        // Update password
        await pool.execute(
            'UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?',
            [hashedPassword, decoded.userId]
        );
        
        // Mark token as used
        await pool.execute(
            'UPDATE password_reset_tokens SET used = 1, updated_at = NOW() WHERE token = ?',
            [token]
        );
        
        logger.info(`Password reset completed for user ID: ${decoded.userId}`);
        
        return { success: true, message: 'Password reset successfully' };
    } catch (error) {
        throw new AppError('Invalid or expired reset token', 400);
    }
};