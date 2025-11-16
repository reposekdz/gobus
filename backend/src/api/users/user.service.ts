import { pool } from '../../config/db';
import { AppError } from '../../utils/AppError';
import * as mysql from 'mysql2/promise';

export const updateUserAvatar = async (userId: number, avatarDataUri: string) => {
    if (!avatarDataUri || !avatarDataUri.startsWith('data:image')) {
        throw new AppError('Invalid image data provided.', 400);
    }

    const [result] = await pool.query<mysql.OkPacket>(
        'UPDATE users SET avatar_url = ? WHERE id = ?',
        [avatarDataUri, userId]
    );

    if (result.affectedRows === 0) {
        throw new AppError('User not found.', 404);
    }
    
    // Return the new URL to update the frontend state
    return { avatarUrl: avatarDataUri };
};

export const updateUserProfile = async (userId: number, data: { name?: string, phone?: string, bio?: string }) => {
    const { name, phone, bio } = data;
    
    // Build the query dynamically based on the fields provided
    const fieldsToUpdate = [];
    const values = [];

    if (name) {
        fieldsToUpdate.push('name = ?');
        values.push(name);
    }
    if (phone) {
        fieldsToUpdate.push('phone_number = ?');
        values.push(phone);
    }
    if (bio !== undefined) {
        fieldsToUpdate.push('bio = ?');
        values.push(bio);
    }

    if (fieldsToUpdate.length === 0) {
        throw new AppError('No fields to update provided.', 400);
    }

    values.push(userId); // for the WHERE clause

    const sql = `UPDATE users SET ${fieldsToUpdate.join(', ')} WHERE id = ?`;

    const [result] = await pool.query<mysql.OkPacket>(sql, values);

    if (result.affectedRows === 0) {
        throw new AppError('User not found.', 404);
    }

    const [rows] = await pool.query<any[] & mysql.RowDataPacket[]>('SELECT id, name, email, phone_number, bio, role, avatar_url, status FROM users WHERE id = ?', [userId]);
    return rows[0];
};