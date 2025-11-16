import { Request, Response } from 'express';
import { pool } from '../../config/db';
import { catchAsync } from '../../middleware/error.middleware';
import bcrypt from 'bcryptjs';
import * as mysql from 'mysql2/promise';

export const getDrivers = catchAsync(async (req: Request, res: Response) => {
    const { page = 1, limit = 20, search, status, company_id } = req.query;
    
    let query = `
        SELECT d.*, u.name, u.email, u.phone_number, u.profile_picture,
               c.name as company_name,
               COUNT(DISTINCT t.id) as total_trips,
               AVG(r.rating) as average_rating,
               COUNT(DISTINCT r.id) as total_reviews
        FROM drivers d
        INNER JOIN users u ON d.user_id = u.id
        LEFT JOIN companies c ON d.company_id = c.id
        LEFT JOIN trips t ON d.id = t.driver_id
        LEFT JOIN reviews r ON d.id = r.driver_id
        WHERE 1=1
    `;
    
    const queryParams: any[] = [];
    
    if (search) {
        query += ` AND (u.name LIKE ? OR u.email LIKE ? OR d.license_number LIKE ?)`;
        queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    
    if (status) {
        query += ` AND d.status = ?`;
        queryParams.push(status);
    }
    
    if (company_id) {
        query += ` AND d.company_id = ?`;
        queryParams.push(company_id);
    }
    
    query += ` GROUP BY d.id ORDER BY u.name ASC`;
    
    const offset = (Number(page) - 1) * Number(limit);
    query += ` LIMIT ? OFFSET ?`;
    queryParams.push(Number(limit), offset);
    
    const [drivers] = await pool.query<any[] & mysql.RowDataPacket[]>(query, queryParams);
    
    // Get total count
    let countQuery = `
        SELECT COUNT(DISTINCT d.id) as total
        FROM drivers d
        INNER JOIN users u ON d.user_id = u.id
        WHERE 1=1
    `;
    
    const countParams: any[] = [];
    if (search) {
        countQuery += ` AND (u.name LIKE ? OR u.email LIKE ? OR d.license_number LIKE ?)`;
        countParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (status) {
        countQuery += ` AND d.status = ?`;
        countParams.push(status);
    }
    if (company_id) {
        countQuery += ` AND d.company_id = ?`;
        countParams.push(company_id);
    }
    
    const [countResult] = await pool.query<any[] & mysql.RowDataPacket[]>(countQuery, countParams);
    const total = countResult[0].total;
    
    res.json({
        success: true,
        data: drivers,
        pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / Number(limit))
        }
    });
});

export const getDriverById = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    
    const [drivers] = await pool.query<any[] & mysql.RowDataPacket[]>(`
        SELECT d.*, u.name, u.email, u.phone_number, u.profile_picture, u.created_at as user_created_at,
               c.name as company_name, c.logo as company_logo,
               COUNT(DISTINCT t.id) as total_trips,
               COUNT(DISTINCT CASE WHEN t.status = 'completed' THEN t.id END) as completed_trips,
               AVG(r.rating) as average_rating,
               COUNT(DISTINCT r.id) as total_reviews,
               SUM(CASE WHEN t.status = 'completed' THEN t.distance ELSE 0 END) as total_distance
        FROM drivers d
        INNER JOIN users u ON d.user_id = u.id
        LEFT JOIN companies c ON d.company_id = c.id
        LEFT JOIN trips t ON d.id = t.driver_id
        LEFT JOIN reviews r ON d.id = r.driver_id
        WHERE d.id = ?
        GROUP BY d.id
    `, [id]);
    
    if (drivers.length === 0) {
        return res.status(404).json({
            success: false,
            message: 'Driver not found'
        });
    }
    
    // Get recent trips
    const [recentTrips] = await pool.query<any[] & mysql.RowDataPacket[]>(`
        SELECT t.*, r.from_city, r.to_city, c.name as company_name
        FROM trips t
        INNER JOIN routes r ON t.route_id = r.id
        INNER JOIN companies c ON r.company_id = c.id
        WHERE t.driver_id = ?
        ORDER BY t.departure_date DESC
        LIMIT 10
    `, [id]);
    
    // Get recent reviews
    const [recentReviews] = await pool.query<any[] & mysql.RowDataPacket[]>(`
        SELECT r.*, u.name as passenger_name, u.profile_picture as passenger_picture
        FROM reviews r
        INNER JOIN users u ON r.user_id = u.id
        WHERE r.driver_id = ?
        ORDER BY r.created_at DESC
        LIMIT 5
    `, [id]);
    
    const driver = {
        ...drivers[0],
        recent_trips: recentTrips,
        recent_reviews: recentReviews
    };
    
    res.json({
        success: true,
        data: driver
    });
});

export const createDriver = catchAsync(async (req: Request, res: Response) => {
    const {
        name,
        email,
        phone_number,
        password,
        license_number,
        license_expiry,
        experience_years,
        company_id,
        emergency_contact_name,
        emergency_contact_phone,
        address
    } = req.body;
    
    // Check if user already exists
    const [existingUsers] = await pool.query<any[] & mysql.RowDataPacket[]>(
        'SELECT id FROM users WHERE email = ? OR phone_number = ?',
        [email, phone_number]
    );
    
    if (existingUsers.length > 0) {
        return res.status(400).json({
            success: false,
            message: 'User with this email or phone number already exists'
        });
    }
    
    // Check if license number already exists
    const [existingDrivers] = await pool.query<any[] & mysql.RowDataPacket[]>(
        'SELECT id FROM drivers WHERE license_number = ?',
        [license_number]
    );
    
    if (existingDrivers.length > 0) {
        return res.status(400).json({
            success: false,
            message: 'Driver with this license number already exists'
        });
    }
    
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();
        
        // Create user
        const password_hash = await bcrypt.hash(password, 10);
        const serial_code = `DRV${Math.floor(1000 + Math.random() * 9000)}`;
        
        const [userResult] = await connection.query<mysql.ResultSetHeader>(
            `INSERT INTO users (name, email, phone_number, password_hash, role, serial_code, address)
             VALUES (?, ?, ?, ?, 'driver', ?, ?)`,
            [name, email, phone_number, password_hash, serial_code, address]
        );
        
        const userId = userResult.insertId;
        
        // Create driver
        const [driverResult] = await connection.query<mysql.ResultSetHeader>(
            `INSERT INTO drivers (user_id, company_id, license_number, license_expiry, experience_years, 
                                emergency_contact_name, emergency_contact_phone, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, 'active')`,
            [userId, company_id, license_number, license_expiry, experience_years, 
             emergency_contact_name, emergency_contact_phone]
        );
        
        await connection.commit();
        
        // Fetch the created driver
        const [newDriver] = await pool.query<any[] & mysql.RowDataPacket[]>(`
            SELECT d.*, u.name, u.email, u.phone_number, c.name as company_name
            FROM drivers d
            INNER JOIN users u ON d.user_id = u.id
            LEFT JOIN companies c ON d.company_id = c.id
            WHERE d.id = ?
        `, [driverResult.insertId]);
        
        res.status(201).json({
            success: true,
            data: newDriver[0],
            message: 'Driver created successfully'
        });
        
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
});

export const updateDriver = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const {
        license_number,
        license_expiry,
        experience_years,
        emergency_contact_name,
        emergency_contact_phone,
        status,
        company_id
    } = req.body;
    
    // Check if driver exists
    const [existingDriver] = await pool.query<any[] & mysql.RowDataPacket[]>(
        'SELECT user_id FROM drivers WHERE id = ?',
        [id]
    );
    
    if (existingDriver.length === 0) {
        return res.status(404).json({
            success: false,
            message: 'Driver not found'
        });
    }
    
    // Check if license number is already taken by another driver
    if (license_number) {
        const [duplicateLicense] = await pool.query<any[] & mysql.RowDataPacket[]>(
            'SELECT id FROM drivers WHERE license_number = ? AND id != ?',
            [license_number, id]
        );
        
        if (duplicateLicense.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'License number already exists for another driver'
            });
        }
    }
    
    const [result] = await pool.query<mysql.ResultSetHeader>(
        `UPDATE drivers SET 
            license_number = COALESCE(?, license_number),
            license_expiry = COALESCE(?, license_expiry),
            experience_years = COALESCE(?, experience_years),
            emergency_contact_name = COALESCE(?, emergency_contact_name),
            emergency_contact_phone = COALESCE(?, emergency_contact_phone),
            status = COALESCE(?, status),
            company_id = COALESCE(?, company_id),
            updated_at = NOW()
         WHERE id = ?`,
        [license_number, license_expiry, experience_years, emergency_contact_name, 
         emergency_contact_phone, status, company_id, id]
    );
    
    if (result.affectedRows === 0) {
        return res.status(404).json({
            success: false,
            message: 'Driver not found'
        });
    }
    
    // Fetch updated driver
    const [updatedDriver] = await pool.query<any[] & mysql.RowDataPacket[]>(`
        SELECT d.*, u.name, u.email, u.phone_number, c.name as company_name
        FROM drivers d
        INNER JOIN users u ON d.user_id = u.id
        LEFT JOIN companies c ON d.company_id = c.id
        WHERE d.id = ?
    `, [id]);
    
    res.json({
        success: true,
        data: updatedDriver[0],
        message: 'Driver updated successfully'
    });
});

export const deleteDriver = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    
    // Check if driver has active trips
    const [activeTrips] = await pool.query<any[] & mysql.RowDataPacket[]>(
        'SELECT COUNT(*) as count FROM trips WHERE driver_id = ? AND status IN ("scheduled", "in_progress")',
        [id]
    );
    
    if (activeTrips[0].count > 0) {
        return res.status(400).json({
            success: false,
            message: 'Cannot delete driver with active trips. Please complete or reassign all trips first.'
        });
    }
    
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();
        
        // Get user_id before deleting driver
        const [driver] = await connection.query<any[] & mysql.RowDataPacket[]>(
            'SELECT user_id FROM drivers WHERE id = ?',
            [id]
        );
        
        if (driver.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Driver not found'
            });
        }
        
        const userId = driver[0].user_id;
        
        // Delete driver record
        await connection.query('DELETE FROM drivers WHERE id = ?', [id]);
        
        // Delete user record
        await connection.query('DELETE FROM users WHERE id = ?', [userId]);
        
        await connection.commit();
        
        res.json({
            success: true,
            message: 'Driver deleted successfully'
        });
        
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
});

export const getDriverPerformance = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { period = '30' } = req.query; // days
    
    const [performance] = await pool.query<any[] & mysql.RowDataPacket[]>(`
        SELECT 
            COUNT(DISTINCT t.id) as total_trips,
            COUNT(DISTINCT CASE WHEN t.status = 'completed' THEN t.id END) as completed_trips,
            COUNT(DISTINCT CASE WHEN t.status = 'cancelled' THEN t.id END) as cancelled_trips,
            AVG(r.rating) as average_rating,
            COUNT(DISTINCT r.id) as total_reviews,
            SUM(CASE WHEN t.status = 'completed' THEN t.distance ELSE 0 END) as total_distance,
            AVG(CASE WHEN t.status = 'completed' THEN TIMESTAMPDIFF(MINUTE, t.actual_departure, t.actual_arrival) END) as avg_trip_duration,
            COUNT(DISTINCT CASE WHEN r.rating >= 4 THEN r.id END) as positive_reviews
        FROM drivers d
        LEFT JOIN trips t ON d.id = t.driver_id AND t.departure_date >= DATE_SUB(NOW(), INTERVAL ? DAY)
        LEFT JOIN reviews r ON d.id = r.driver_id AND r.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
        WHERE d.id = ?
        GROUP BY d.id
    `, [period, period, id]);
    
    if (performance.length === 0) {
        return res.status(404).json({
            success: false,
            message: 'Driver not found'
        });
    }
    
    // Get daily performance for the period
    const [dailyPerformance] = await pool.query<any[] & mysql.RowDataPacket[]>(`
        SELECT 
            DATE(t.departure_date) as date,
            COUNT(t.id) as trips_count,
            AVG(r.rating) as avg_rating
        FROM trips t
        LEFT JOIN reviews r ON t.id = r.trip_id
        WHERE t.driver_id = ? AND t.departure_date >= DATE_SUB(NOW(), INTERVAL ? DAY)
        GROUP BY DATE(t.departure_date)
        ORDER BY date ASC
    `, [id, period]);
    
    res.json({
        success: true,
        data: {
            summary: performance[0],
            daily_performance: dailyPerformance,
            period_days: Number(period)
        }
    });
});

export const assignDriverToTrip = catchAsync(async (req: Request, res: Response) => {
    const { driverId, tripId } = req.body;
    
    // Check if driver exists and is active
    const [driver] = await pool.query<any[] & mysql.RowDataPacket[]>(
        'SELECT id, status FROM drivers WHERE id = ?',
        [driverId]
    );
    
    if (driver.length === 0) {
        return res.status(404).json({
            success: false,
            message: 'Driver not found'
        });
    }
    
    if (driver[0].status !== 'active') {
        return res.status(400).json({
            success: false,
            message: 'Driver is not active'
        });
    }
    
    // Check if trip exists and is not already assigned
    const [trip] = await pool.query<any[] & mysql.RowDataPacket[]>(
        'SELECT id, driver_id, status FROM trips WHERE id = ?',
        [tripId]
    );
    
    if (trip.length === 0) {
        return res.status(404).json({
            success: false,
            message: 'Trip not found'
        });
    }
    
    if (trip[0].driver_id) {
        return res.status(400).json({
            success: false,
            message: 'Trip is already assigned to a driver'
        });
    }
    
    // Assign driver to trip
    await pool.query(
        'UPDATE trips SET driver_id = ?, updated_at = NOW() WHERE id = ?',
        [driverId, tripId]
    );
    
    res.json({
        success: true,
        message: 'Driver assigned to trip successfully'
    });
});