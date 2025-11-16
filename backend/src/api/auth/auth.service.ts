import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import config from '../../config';
import { pool } from '../../config/db';
import { AppError } from '../../utils/AppError';
import { User } from '../../types';
import * as mysql from 'mysql2/promise';

const generateToken = (user: { id: number, company_id?: number, role: string }) => {
    return jwt.sign({ id: user.id, companyId: user.company_id, role: user.role }, config.jwt.secret, {
        expiresIn: config.jwt.expiresIn,
    } as SignOptions);
};

export const registerUser = async (userData: any) => {
    const { name, email, password, phone } = userData;
    
    if(!email && !phone){
        throw new AppError('Email or Phone number is required', 400);
    }

    if(email){
        const [existingUsers] = await pool.query<User[] & mysql.RowDataPacket[]>('SELECT id FROM users WHERE email = ?', [email]);
        if (existingUsers.length > 0) {
            throw new AppError('User with this email already exists', 400);
        }
    }

    if(phone){
        const [existingUsers] = await pool.query<User[] & mysql.RowDataPacket[]>('SELECT id FROM users WHERE phone_number = ?', [phone]);
        if (existingUsers.length > 0) {
            throw new AppError('User with this phone number already exists', 400);
        }
    }
    
    const password_hash = await bcrypt.hash(password, 10);
    
    // Generate a unique serial code
    const serial_code = `${name.substring(0, 3).toUpperCase()}${Math.floor(1000 + Math.random() * 9000)}`;

    const [result] = await pool.query<mysql.ResultSetHeader>(
        'INSERT INTO users (name, email, password_hash, phone_number, role, serial_code) VALUES (?, ?, ?, ?, ?, ?)',
        [name, email, password_hash, phone, 'passenger', serial_code]
    );

    const userId = result.insertId;

    // Create a wallet for the new user
    await pool.query('INSERT INTO wallets (user_id, balance) VALUES (?, 0)', [userId]);

    const [rows] = await pool.query<User[] & mysql.RowDataPacket[]>('SELECT * FROM users WHERE id = ?', [userId]);
    const user = rows[0];
    delete user.password_hash;
    
    const token = generateToken(user);

    return { user, token };
};

export const loginUser = async (loginData: any) => {
    const { email: emailOrPhone, password } = loginData;

    if (!emailOrPhone || !password) {
        throw new AppError('Please provide login credentials', 400);
    }
    
    const isEmail = emailOrPhone.includes('@');
    const queryField = isEmail ? 'email' : 'phone_number';

    const [rows] = await pool.query<User[] & mysql.RowDataPacket[]>(`SELECT * FROM users WHERE ${queryField} = ?`, [emailOrPhone]);
    const user = rows[0];

    if (!user || !(await bcrypt.compare(password, user.password_hash!))) {
        throw new AppError('Invalid credentials', 401);
    }

    // Fetch wallet balance for passenger
    if (user.role === 'passenger') {
        const [walletRows] = await pool.query<any[] & mysql.RowDataPacket[]>('SELECT balance FROM wallets WHERE user_id = ?', [user.id]);
        if (walletRows.length > 0) {
            // FIX: Changed to snake_case to match type definitions and API consistency.
            user.wallet_balance = parseFloat(walletRows[0].balance);
        }
    }

    const token = generateToken(user);
    delete user.password_hash;
    
    return { user, token };
};

export const updatePassword = async (userId: number, currentPassword, newPassword) => {
    if (!currentPassword || !newPassword) {
        throw new AppError('Please provide current and new passwords', 400);
    }

    const [rows] = await pool.query<User[] & mysql.RowDataPacket[]>('SELECT password_hash FROM users WHERE id = ?', [userId]);
    const user = rows[0];

    if (!user) {
        throw new AppError('User not found', 404);
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password_hash!);
    if (!isMatch) {
        throw new AppError('Incorrect current password', 401);
    }

    const new_password_hash = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [new_password_hash, userId]);
};