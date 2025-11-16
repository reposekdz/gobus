import { pool } from '../../config/db';
import { AppError } from '../../utils/AppError';
import * as mysql from 'mysql2/promise';

export const createMessage = async (data: any) => {
    const { name, email, subject, message } = data;
    if (!name || !email || !subject || !message) {
        throw new AppError('Please provide all required fields.', 400);
    }
    const [result] = await pool.query<mysql.ResultSetHeader>(
        'INSERT INTO messages (name, email, subject, message) VALUES (?, ?, ?, ?)',
        [name, email, subject, message]
    );
    return { id: result.insertId, ...data };
};

export const getAllMessages = async () => {
    const [rows] = await pool.query('SELECT * FROM messages ORDER BY created_at DESC');
    return rows;
};

export const updateMessage = async (id: string, data: any) => {
    const { status } = data;
    if (!status) {
        throw new AppError('No status provided for update.', 400);
    }
    const [result] = await pool.query<mysql.OkPacket>('UPDATE messages SET status = ? WHERE id = ?', [status, id]);
    if (result.affectedRows === 0) {
        throw new AppError('Message not found.', 404);
    }
    const [rows] = await pool.query('SELECT * FROM messages WHERE id = ?', [id]);
    return (rows as any)[0];
};
