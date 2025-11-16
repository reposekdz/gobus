import { Request, Response } from 'express';
import { pool } from '../../config/db';
import { catchAsync } from '../../middleware/error.middleware';
import * as mysql from 'mysql2/promise';

export const getDriverTrips = catchAsync(async (req: Request, res: Response) => {
    const driverId = (req as any).user.driver_id;
    const { status = 'all', date } = req.query;
    
    let query = `
        SELECT t.*, r.from_city_id, r.to_city_id, 
               fc.name as from_city, tc.name as to_city,
               b.plate_number, b.model, b.capacity,
               c.name as company_name, c.logo as company_logo,
               COUNT(DISTINCT bk.id) as total_bookings,
               SUM(CASE WHEN bk.status = 'confirmed' THEN 1 ELSE 0 END) as confirmed_bookings
        FROM trips t
        INNER JOIN routes r ON t.route_id = r.id
        INNER JOIN cities fc ON r.from_city_id = fc.id
        INNER JOIN cities tc ON r.to_city_id = tc.id
        INNER JOIN buses b ON t.bus_id = b.id
        INNER JOIN companies c ON r.company_id = c.id
        LEFT JOIN bookings bk ON t.id = bk.trip_id
        WHERE t.driver_id = ?
    `;
    
    const queryParams: any[] = [driverId];
    
    if (status !== 'all') {
        query += ` AND t.status = ?`;
        queryParams.push(status);
    }
    
    if (date) {
        query += ` AND DATE(t.departure_date) = ?`;
        queryParams.push(date);
    }
    
    query += ` GROUP BY t.id ORDER BY t.departure_date DESC, t.departure_time ASC`;
    
    const [trips] = await pool.query<any[] & mysql.RowDataPacket[]>(query, queryParams);
    
    res.json({
        success: true,
        data: trips
    });
});

export const getTripPassengers = catchAsync(async (req: Request, res: Response) => {
    const { tripId } = req.params;
    const driverId = (req as any).user.driver_id;
    
    // Verify trip belongs to driver
    const [tripCheck] = await pool.query<any[] & mysql.RowDataPacket[]>(
        'SELECT id FROM trips WHERE id = ? AND driver_id = ?',
        [tripId, driverId]
    );
    
    if (!tripCheck.length) {
        return res.status(403).json({
            success: false,
            message: 'Trip not assigned to you'
        });
    }
    
    const [passengers] = await pool.query<any[] & mysql.RowDataPacket[]>(`
        SELECT b.*, u.name as booker_name, u.phone_number as booker_phone,
               b.passenger_name, b.passenger_phone, b.seat_numbers,
               b.booking_reference, b.payment_status, b.status as booking_status,
               b.checked_in_at, b.special_requests
        FROM bookings b
        INNER JOIN users u ON b.user_id = u.id
        WHERE b.trip_id = ?
        ORDER BY b.created_at ASC
    `, [tripId]);
    
    res.json({
        success: true,
        data: passengers
    });
});

export const checkInPassenger = catchAsync(async (req: Request, res: Response) => {
    const { bookingId } = req.params;
    const driverId = (req as any).user.driver_id;
    
    // Verify booking belongs to driver's trip
    const [booking] = await pool.query<any[] & mysql.RowDataPacket[]>(`
        SELECT b.id, b.status, t.driver_id
        FROM bookings b
        INNER JOIN trips t ON b.trip_id = t.id
        WHERE b.id = ? AND t.driver_id = ?
    `, [bookingId, driverId]);
    
    if (!booking.length) {
        return res.status(403).json({
            success: false,
            message: 'Booking not found in your trips'
        });
    }
    
    if (booking[0].status !== 'confirmed') {
        return res.status(400).json({
            success: false,
            message: 'Booking is not confirmed'
        });
    }
    
    await pool.query(
        'UPDATE bookings SET checked_in_at = NOW(), updated_at = NOW() WHERE id = ?',
        [bookingId]
    );
    
    res.json({
        success: true,
        message: 'Passenger checked in successfully'
    });
});

export const updateTripStatus = catchAsync(async (req: Request, res: Response) => {
    const { tripId } = req.params;
    const { status, location } = req.body;
    const driverId = (req as any).user.driver_id;
    
    // Verify trip belongs to driver
    const [trip] = await pool.query<any[] & mysql.RowDataPacket[]>(
        'SELECT id, status as current_status FROM trips WHERE id = ? AND driver_id = ?',
        [tripId, driverId]
    );
    
    if (!trip.length) {
        return res.status(403).json({
            success: false,
            message: 'Trip not assigned to you'
        });
    }
    
    let updateFields = 'status = ?, updated_at = NOW()';
    let updateParams = [status];
    
    if (status === 'in_progress' && trip[0].current_status === 'boarding') {
        updateFields += ', actual_departure = NOW()';
    } else if (status === 'completed' && trip[0].current_status === 'in_progress') {
        updateFields += ', actual_arrival = NOW()';
    }
    
    updateParams.push(tripId);
    
    await pool.query(
        `UPDATE trips SET ${updateFields} WHERE id = ?`,
        updateParams
    );
    
    // Update driver location if provided
    if (location) {
        await pool.query(
            `UPDATE drivers SET current_location_lat = ?, current_location_lng = ?, 
                              last_location_update = NOW() WHERE id = ?`,
            [location.lat, location.lng, driverId]
        );
    }
    
    res.json({
        success: true,
        message: `Trip status updated to ${status}`
    });
});