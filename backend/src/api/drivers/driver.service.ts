import { pool } from '../../config/db';
import * as mysql from 'mysql2/promise';
import { AppError } from '../../utils/AppError';

export const getTripHistoryForDriver = async (driverId: number) => {
    const [rows] = await pool.query<any[] & mysql.RowDataPacket[]>(`
        SELECT
            t.id,
            CONCAT(r.origin, ' - ', r.destination) as route,
            t.departure_time as date,
            t.status,
            (SELECT COUNT(*) FROM bookings bk WHERE bk.trip_id = t.id AND bk.status != 'Cancelled') as passengers
        FROM trips t
        JOIN routes r ON t.route_id = r.id
        WHERE t.driver_id = ?
        ORDER BY t.departure_time DESC;
    `, [driverId]);

    return rows.map(trip => ({
        ...trip,
        status: trip.status.charAt(0).toUpperCase() + trip.status.slice(1) // Capitalize status
    }));
};

export const getTripsForDriver = async (driverId: number) => {
    const today = new Date().toISOString().split('T')[0];
    const [rows] = await pool.query<any[] & mysql.RowDataPacket[]>(`
        SELECT
            t.id,
            CONCAT(r.origin, ' - ', r.destination) as route,
            t.departure_time as date,
            t.status,
            b.plate_number as bus_plate
        FROM trips t
        JOIN routes r ON t.route_id = r.id
        JOIN buses b ON t.bus_id = b.id
        WHERE t.driver_id = ? AND DATE(t.departure_time) = ?
        ORDER BY t.departure_time ASC;
    `, [driverId, today]);
    return rows;
};

export const updateDriverStatus = async (driverId: number, status: 'Active' | 'Unavailable') => {
    if (!['Active', 'Unavailable'].includes(status)) {
        throw new AppError('Invalid status provided.', 400);
    }
    const [result] = await pool.query<mysql.OkPacket>(
        'UPDATE users SET status = ? WHERE id = ? AND role = "driver"',
        [status, driverId]
    );
    if (result.affectedRows === 0) {
        throw new AppError('Driver not found or status could not be updated.', 404);
    }
    return { status };
};