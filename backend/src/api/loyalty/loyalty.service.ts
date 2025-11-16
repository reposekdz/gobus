import { pool } from '../../config/db';

export const getHistoryForUser = async (userId: number) => {
    const [rows] = await pool.query('SELECT * FROM loyalty_transactions WHERE user_id = ? ORDER BY created_at DESC', [userId]);
    return rows;
};
