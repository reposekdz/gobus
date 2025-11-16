import { pool } from '../../config/db';
import * as mysql from 'mysql2/promise';

export const getSetting = async (key: string) => {
    const [rows] = await pool.query<any[] & mysql.RowDataPacket[]>('SELECT setting_value FROM site_settings WHERE setting_key = ?', [key]);
    return rows[0] || null;
};

export const setSetting = async (key: string, value: string) => {
    // Using INSERT ... ON DUPLICATE KEY UPDATE for an "upsert" operation
    await pool.query('INSERT INTO site_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?', [key, value, value]);
    return { setting_key: key, setting_value: value };
};
