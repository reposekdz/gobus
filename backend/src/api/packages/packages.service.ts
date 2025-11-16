import { pool } from '../../config/db';
import { AppError } from '../../utils/AppError';
import * as mysql from 'mysql2/promise';

export const createPackage = async (senderId: number, data: any) => {
    const { recipient_name, recipient_phone, origin, destination, package_size, weight_kg, price, trip_id } = data;
    const tracking_id = `PKG-${Date.now().toString().slice(-8)}`;

    const [result] = await pool.query<mysql.ResultSetHeader>(
        'INSERT INTO package_deliveries (tracking_id, sender_id, recipient_name, recipient_phone, origin, destination, package_size, weight_kg, price, trip_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [tracking_id, senderId, recipient_name, recipient_phone, origin, destination, package_size, weight_kg, price, trip_id]
    );

    return { id: result.insertId, tracking_id, ...data };
};

export const getPackageStatus = async (trackingId: string) => {
    const [rows] = await pool.query<any[] & mysql.RowDataPacket[]>('SELECT status, created_at FROM package_deliveries WHERE tracking_id = ?', [trackingId]);
    if (rows.length === 0) {
        throw new AppError('Package not found.', 404);
    }
    return rows[0];
};
