import { pool } from '../../config/db';
import { AppError } from '../../utils/AppError';
import * as mysql from 'mysql2/promise';

export const getActiveAds = async () => {
    const [rows] = await pool.query("SELECT * FROM advertisements WHERE status = 'Active' ORDER BY created_at DESC");
    return rows;
};

export const getAllAds = async () => {
    const [rows] = await pool.query("SELECT * FROM advertisements ORDER BY created_at DESC");
    return rows;
};

export const createAd = async (data: any) => {
    const { company_name, image_data_uri, link_url, status } = data;
    const [result] = await pool.query<mysql.ResultSetHeader>(
        'INSERT INTO advertisements (company_name, image_data_uri, link_url, status) VALUES (?, ?, ?, ?)',
        [company_name, image_data_uri, link_url, status]
    );
    return { id: result.insertId, ...data };
};

export const updateAd = async (id: number, data: any) => {
    const { company_name, image_data_uri, link_url, status } = data;
    const [result] = await pool.query<mysql.OkPacket>(
        'UPDATE advertisements SET company_name = ?, image_data_uri = ?, link_url = ?, status = ? WHERE id = ?',
        [company_name, image_data_uri, link_url, status, id]
    );
    if (result.affectedRows === 0) {
        throw new AppError('Advertisement not found', 404);
    }
    return { id, ...data };
};

export const deleteAd = async (id: number) => {
    const [result] = await pool.query<mysql.OkPacket>('DELETE FROM advertisements WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
        throw new AppError('Advertisement not found', 404);
    }
};
