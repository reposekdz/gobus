import { pool } from '../config/db';
import * as mysql from 'mysql2/promise';
import logger from '../utils/logger';

/**
 * Generate unique serial code for passenger
 * Format: 3 capital letters from name + 4 random numbers
 * Example: JOH1234
 */
export const generateSerialCode = async (name: string): Promise<string> => {
    // Extract first 3 letters from name, convert to uppercase, pad if needed
    const namePart = name
        .replace(/[^a-zA-Z]/g, '') // Remove non-letters
        .substring(0, 3)
        .toUpperCase()
        .padEnd(3, 'X'); // Pad with X if name is too short
    
    let serialCode: string;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 100;
    
    while (!isUnique && attempts < maxAttempts) {
        // Generate 4 random numbers
        const numberPart = Math.floor(1000 + Math.random() * 9000).toString();
        serialCode = `${namePart}${numberPart}`;
        
        // Check if serial code already exists
        const [existing] = await pool.execute<mysql.RowDataPacket[]>(
            'SELECT id FROM users WHERE serial_code = ?',
            [serialCode]
        );
        
        if (existing.length === 0) {
            isUnique = true;
        }
        
        attempts++;
    }
    
    if (!isUnique) {
        // Fallback: add timestamp for uniqueness
        const timestamp = Date.now().toString().slice(-4);
        serialCode = `${namePart}${timestamp}`;
        
        // Check one more time
        const [existing] = await pool.execute<mysql.RowDataPacket[]>(
            'SELECT id FROM users WHERE serial_code = ?',
            [serialCode]
        );
        
        if (existing.length > 0) {
            // Last resort: use UUID part
            const uuidPart = Math.random().toString(36).substring(2, 6).toUpperCase();
            serialCode = `${namePart}${uuidPart}`;
        }
    }
    
    logger.info(`Generated serial code: ${serialCode} for user: ${name}`);
    return serialCode;
};

/**
 * Validate serial code format
 */
export const validateSerialCode = (serialCode: string): boolean => {
    const pattern = /^[A-Z]{3}[0-9]{4}$/;
    return pattern.test(serialCode);
};

/**
 * Find user by serial code
 */
export const findUserBySerialCode = async (serialCode: string): Promise<any> => {
    const [users] = await pool.execute<mysql.RowDataPacket[]>(
        `SELECT u.id, u.name, u.email, u.phone, u.role, u.serial_code, 
                w.id as wallet_id, w.balance as wallet_balance
         FROM users u
         LEFT JOIN wallets w ON w.user_id = u.id
         WHERE u.serial_code = ? AND u.role = 'passenger' AND u.is_active = 1`,
        [serialCode]
    );
    
    if (users.length === 0) {
        return null;
    }
    
    return users[0];
};

