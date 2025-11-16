import { pool } from '../../config/db';
import * as mysql from 'mysql2/promise';

export const getAllFoundItems = async () => {
    const [rows] = await pool.query('SELECT * FROM lost_and_found ORDER BY date_found DESC');
    return rows;
};

export const createLostItemReport = async (userId: number, data: any) => {
    const { item_name, description, route_found_on, date_found, location_stored } = data;
    const [result] = await pool.query<mysql.ResultSetHeader>(
        'INSERT INTO lost_and_found (item_name, description, route_found_on, date_found, location_stored, reported_by_user_id) VALUES (?, ?, ?, ?, ?, ?)',
        [item_name, description, route_found_on, date_found, location_stored || 'Nyabugogo Office', userId]
    );
    return { id: result.insertId, ...data };
};
