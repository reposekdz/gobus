import { Request, Response } from 'express';
import { pool } from '../../config/db';
import { catchAsync } from '../../middleware/error.middleware';
import bcrypt from 'bcryptjs';
import * as mysql from 'mysql2/promise';

export const createDriver = catchAsync(async (req: Request, res: Response) => {
    const companyId = (req as any).user.company_id;
    const {
        name, email, password, phone, license_number, license_expiry,
        experience_years, emergency_contact_name, emergency_contact_phone
    } = req.body;
    
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();
        
        const password_hash = await bcrypt.hash(password, 12);
        const serial_code = `DRV${Math.floor(1000 + Math.random() * 9000)}`;
        
        const [userResult] = await connection.query<mysql.ResultSetHeader>(
            `INSERT INTO users (name, email, phone_number, password_hash, role, serial_code, is_verified)
             VALUES (?, ?, ?, ?, 'driver', ?, 1)`,
            [name, email, phone, password_hash, serial_code]
        );
        
        const [driverResult] = await connection.query<mysql.ResultSetHeader>(
            `INSERT INTO drivers (user_id, company_id, license_number, license_expiry, 
                                experience_years, emergency_contact_name, emergency_contact_phone, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, 'active')`,
            [userResult.insertId, companyId, license_number, license_expiry,
             experience_years, emergency_contact_name, emergency_contact_phone]
        );
        
        await connection.commit();
        
        res.status(201).json({
            success: true,
            data: {
                id: driverResult.insertId,
                name, email, phone, license_number, serial_code,
                credentials: { email, password },
                message: 'Driver created successfully. Credentials provided above.'
            }
        });
        
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
});

export const assignBusToDriver = catchAsync(async (req: Request, res: Response) => {
    const { driverId, busId } = req.body;
    const companyId = (req as any).user.company_id;
    
    // Verify driver and bus belong to company
    const [driver] = await pool.query<any[] & mysql.RowDataPacket[]>(
        'SELECT id FROM drivers WHERE id = ? AND company_id = ?',
        [driverId, companyId]
    );
    
    const [bus] = await pool.query<any[] & mysql.RowDataPacket[]>(
        'SELECT id FROM buses WHERE id = ? AND company_id = ?',
        [busId, companyId]
    );
    
    if (!driver.length || !bus.length) {
        return res.status(404).json({
            success: false,
            message: 'Driver or bus not found in your company'
        });
    }
    
    // Update bus assignment
    await pool.query(
        'UPDATE buses SET assigned_driver_id = ?, updated_at = NOW() WHERE id = ?',
        [driverId, busId]
    );
    
    res.json({
        success: true,
        message: 'Bus assigned to driver successfully'
    });
});

export const createBus = catchAsync(async (req: Request, res: Response) => {
    const companyId = (req as any).user.company_id;
    const {
        plate_number, model, manufacturer, year, capacity, bus_type,
        amenities, fuel_type
    } = req.body;
    
    const [result] = await pool.query<mysql.ResultSetHeader>(
        `INSERT INTO buses (company_id, plate_number, model, manufacturer, year, 
                           capacity, bus_type, amenities, fuel_type, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
        [companyId, plate_number, model, manufacturer, year, capacity, 
         bus_type, JSON.stringify(amenities), fuel_type]
    );
    
    res.status(201).json({
        success: true,
        data: { id: result.insertId, plate_number, model, capacity },
        message: 'Bus added successfully'
    });
});

export const getCompanyDrivers = catchAsync(async (req: Request, res: Response) => {
    const companyId = (req as any).user.company_id;
    
    const [drivers] = await pool.query<any[] & mysql.RowDataPacket[]>(`
        SELECT d.*, u.name, u.email, u.phone_number, u.profile_picture,
               b.plate_number as assigned_bus,
               COUNT(DISTINCT t.id) as total_trips,
               AVG(r.rating) as average_rating
        FROM drivers d
        INNER JOIN users u ON d.user_id = u.id
        LEFT JOIN buses b ON d.id = b.assigned_driver_id
        LEFT JOIN trips t ON d.id = t.driver_id
        LEFT JOIN reviews r ON d.id = r.driver_id
        WHERE d.company_id = ?
        GROUP BY d.id
        ORDER BY u.name ASC
    `, [companyId]);
    
    res.json({
        success: true,
        data: drivers
    });
});

export const getCompanyBuses = catchAsync(async (req: Request, res: Response) => {
    const companyId = (req as any).user.company_id;
    
    const [buses] = await pool.query<any[] & mysql.RowDataPacket[]>(`
        SELECT b.*, u.name as driver_name, d.license_number,
               COUNT(DISTINCT t.id) as total_trips
        FROM buses b
        LEFT JOIN drivers d ON b.assigned_driver_id = d.id
        LEFT JOIN users u ON d.user_id = u.id
        LEFT JOIN trips t ON b.id = t.bus_id
        WHERE b.company_id = ?
        GROUP BY b.id
        ORDER BY b.plate_number ASC
    `, [companyId]);
    
    res.json({
        success: true,
        data: buses
    });
});