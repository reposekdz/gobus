import { pool } from '../../config/db';
import { AppError } from '../../utils/AppError';
import * as mysql from 'mysql2/promise';

export const createAlert = async (userId: number, data: { from: string, to: string, initialPrice: number }) => {
    const { from, to, initialPrice } = data;
    const [result] = await pool.query<mysql.ResultSetHeader>(
        'INSERT INTO price_alerts (user_id, origin, destination, initial_price) VALUES (?, ?, ?, ?)',
        [userId, from, to, initialPrice]
    );
    return { id: result.insertId, ...data };
};

export const getAlertsForUser = async (userId: number) => {
    const [rows] = await pool.query('SELECT * FROM price_alerts WHERE user_id = ? AND status = "Active"', [userId]);
    return rows;
};

export const deleteAlert = async (userId: number, alertId: number) => {
    const [result] = await pool.query<mysql.OkPacket>('DELETE FROM price_alerts WHERE id = ? AND user_id = ?', [alertId, userId]);
    if (result.affectedRows === 0) {
        throw new AppError('Alert not found or you do not have permission.', 404);
    }
};
