import { pool } from '../../config/db';
import { AppError } from '../../utils/AppError';
import * as mysql from 'mysql2/promise';

export const getAllDestinations = async () => {
    const [rows] = await pool.query('SELECT * FROM featured_destinations ORDER BY id');
    return rows;
};

export const createDestination = async (data: any) => {
    const { from_location, to_location, price, image_data_uri } = data;
    const [result] = await pool.query<mysql.ResultSetHeader>(
        'INSERT INTO featured_destinations (from_location, to_location, price, image_data_uri) VALUES (?, ?, ?, ?)',
        [from_location, to_location, price, image_data_uri]
    );
    const [rows] = await pool.query('SELECT * FROM featured_destinations WHERE id = ?', [result.insertId]);
    return (rows as any)[0];
};

export const updateDestination = async (id: number, data: any) => {
    const { from_location, to_location, price, image_data_uri } = data;
    const [result] = await pool.query<mysql.OkPacket>(
        'UPDATE featured_destinations SET from_location = ?, to_location = ?, price = ?, image_data_uri = ? WHERE id = ?',
        [from_location, to_location, price, image_data_uri, id]
    );
    if (result.affectedRows === 0) {
        throw new AppError('Destination not found', 404);
    }
    const [rows] = await pool.query('SELECT * FROM featured_destinations WHERE id = ?', [id]);
    return (rows as any)[0];
};

export const deleteDestination = async (id: number) => {
    const [result] = await pool.query<mysql.OkPacket>('DELETE FROM featured_destinations WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
        throw new AppError('Destination not found', 404);
    }
    return;
};
