import { pool } from '../../config/db';
import { AppError } from '../../utils/AppError';
import * as mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

export const getAllCompanies = async () => {
    const [rows] = await pool.query("SELECT id, name, logo_url, description, cover_url FROM companies WHERE status = 'Active'");
    return rows;
};

export const getCompanyById = async (id: string) => {
    const [rows] = await pool.query('SELECT * FROM companies WHERE id = ?', [id]);
    if ((rows as any[]).length === 0) {
        throw new AppError('Company not found', 404);
    }
    return (rows as any)[0];
};

export const getCompanyDetailsById = async (id: string) => {
    const companyId = parseInt(id, 10);
    if (isNaN(companyId)) {
        throw new AppError('Invalid company ID', 400);
    }

    const [companyRows] = await pool.query<any[] & mysql.RowDataPacket[]>('SELECT * FROM companies WHERE id = ?', [companyId]);
    if (companyRows.length === 0) {
        throw new AppError('Company not found', 404);
    }
    const company = companyRows[0];

    const [fleet] = await pool.query('SELECT *, image_url as image FROM buses WHERE company_id = ?', [companyId]);
    const [routes] = await pool.query('SELECT *, origin as `from`, destination as `to` FROM routes WHERE company_id = ?', [companyId]);
    const [services] = await pool.query('SELECT * FROM services WHERE company_id = ?', [companyId]);
    const [promotions] = await pool.query('SELECT * FROM promotions WHERE company_id = ?', [companyId]);
    const [gallery] = await pool.query("SELECT id, image_url as src, category FROM gallery WHERE company_id = ?", [companyId]);
    const [reviews] = await pool.query(`
        SELECT r.rating, r.comment, u.name as author 
        FROM reviews r 
        JOIN users u ON r.user_id = u.id 
        WHERE r.company_id = ?
    `, [companyId]);
    
    // Simple stats mocks for now, real implementation would require complex aggregation
    const stats = { passengers: '2M+', fleet: (fleet as any[]).length, routes: (routes as any[]).length };
    
    // Mock schedule for now
    const schedule = {
      'Kigali-Rubavu': [
        { time: '07:00', arrival: '10:30', bus: 'Yutong Explorer', price: '4,500 RWF' },
      ]
    };

    return {
        ...company,
        fleet,
        routes,
        services,
        promotions,
        gallery,
        reviews,
        stats,
        schedule
    };
};

export const getDashboardData = async (companyId: number) => {
    if (!companyId) throw new AppError('Unauthorized', 401);

    const today = new Date().toISOString().split('T')[0];
    
    const [[{ driverCount }]] = await pool.query<any[] & mysql.RowDataPacket[]>("SELECT COUNT(*) as driverCount FROM users WHERE role = 'driver' AND company_id = ?", [companyId]);
    const [[{ busCount, activeBuses }]] = await pool.query<any[] & mysql.RowDataPacket[]>("SELECT COUNT(*) as busCount, SUM(IF(status = 'On Route', 1, 0)) as activeBuses FROM buses WHERE company_id = ?", [companyId]);
    const [[{ todayRevenue }]] = await pool.query<any[] & mysql.RowDataPacket[]>("SELECT SUM(b.total_price) as todayRevenue FROM bookings b JOIN trips t ON b.trip_id = t.id JOIN routes r ON t.route_id = r.id WHERE r.company_id = ? AND DATE(b.created_at) = ?", [companyId, today]);
    
    const [popularRouteRows] = await pool.query<any[] & mysql.RowDataPacket[]>(`
        SELECT CONCAT(r.origin, ' - ', r.destination) as route, COUNT(b.id) as bookings 
        FROM bookings b 
        JOIN trips t ON b.trip_id = t.id 
        JOIN routes r ON t.route_id = r.id 
        WHERE r.company_id = ? 
        GROUP BY r.id 
        ORDER BY bookings DESC 
        LIMIT 1
    `, [companyId]);

    const [liveFleet] = await pool.query<any[] & mysql.RowDataPacket[]>(`
        SELECT b.id, b.plate_number as plate, CONCAT(r.origin, ' - ', r.destination) as route
        FROM buses b
        JOIN trips t ON b.id = t.bus_id
        JOIN routes r ON t.route_id = r.id
        WHERE b.company_id = ? AND b.status = 'On Route' AND DATE(t.departure_time) = ?
    `, [companyId, today]);
    
    const [driverLeaderboard] = await pool.query<any[] & mysql.RowDataPacket[]>(`
        SELECT name, avatar_url
        FROM users 
        WHERE role = 'driver' AND company_id = ?
        LIMIT 5
    `, [companyId]);


    return {
        stats: {
            driverCount,
            busCount,
            activeBuses: activeBuses || 0,
            todayRevenue: todayRevenue || 0,
            popularRoute: popularRouteRows[0]?.route || 'N/A'
        },
        liveFleet,
        driverLeaderboard
    };
};


// --- Service functions for company managers managing their drivers ---
export const getDriversByCompany = async (companyId: number) => {
    if (!companyId) {
        throw new AppError('Company manager is not associated with a company.', 400);
    }
    const [rows] = await pool.query(`
        SELECT 
            u.id, u.name, u.email, u.phone_number, u.status, u.avatar_url, u.assigned_bus_id,
            c.name as company_name
        FROM users u
        LEFT JOIN companies c ON u.company_id = c.id
        WHERE u.role = 'driver' AND u.company_id = ?
    `, [companyId]);
    return rows;
};

export const createDriver = async (driverData: any, companyId: number) => {
    const { name, email, password, phone } = driverData;
    
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if ((existing as any[]).length > 0) {
        throw new AppError('A user with this email already exists.', 400);
    }

    const password_hash = await bcrypt.hash(password, 10);
    const [result] = await pool.query<mysql.ResultSetHeader>(
        'INSERT INTO users (name, email, password_hash, phone_number, role, company_id, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [name, email, password_hash, phone, 'driver', companyId, 'Active']
    );
    
    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [result.insertId]);
    const driver = (rows as any)[0];
    delete driver.password_hash;
    return driver;
};

export const updateDriver = async (driverId: string, updateData: any, companyId: number) => {
    const { name, phone, status } = updateData;
    const [result] = await pool.query<mysql.OkPacket>(
        'UPDATE users SET name = ?, phone_number = ?, status = ? WHERE id = ? AND company_id = ? AND role = "driver"',
        [name, phone, status, driverId, companyId]
    );

    if (result.affectedRows === 0) {
        throw new AppError('Driver not found or you do not have permission to edit this driver.', 404);
    }
    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [driverId]);
    return (rows as any)[0];
};

export const deleteDriver = async (driverId: string, companyId: number) => {
    const [result] = await pool.query<mysql.OkPacket>(
        'DELETE FROM users WHERE id = ? AND company_id = ? AND role = "driver"',
        [driverId, companyId]
    );
    if (result.affectedRows === 0) {
        throw new AppError('Driver not found or you do not have permission to delete this driver.', 404);
    }
    return;
};

export const checkDriverOwnership = async (driverId: string, companyId: number) => {
    const [rows] = await pool.query('SELECT id FROM users WHERE id = ? AND company_id = ? AND role = "driver"', [driverId, companyId]);
    if ((rows as any[]).length === 0) {
        throw new AppError('Driver not found or not part of your company.', 404);
    }
};

// --- Gallery Management (Enhanced) ---
export const addGalleryImage = async (
    companyId: number, 
    imageUrl: string, 
    imageType: 'bus' | 'station' | 'office' | 'team' | 'other',
    uploadedBy: number,
    title?: string,
    description?: string,
    displayOrder: number = 0,
    isFeatured: boolean = false
) => {
    if (!imageUrl || !imageType) {
        throw new AppError('Image URL and type are required.', 400);
    }
    
    // Validate image type
    const validTypes = ['bus', 'station', 'office', 'team', 'other'];
    if (!validTypes.includes(imageType)) {
        throw new AppError(`Invalid image type. Must be one of: ${validTypes.join(', ')}`, 400);
    }
    
    const [result] = await pool.query<mysql.ResultSetHeader>(
        `INSERT INTO company_gallery (
            company_id, image_url, image_type, title, description, 
            display_order, is_featured, uploaded_by, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [companyId, imageUrl, imageType, title || null, description || null, displayOrder, isFeatured ? 1 : 0, uploadedBy]
    );
    
    return { 
        id: result.insertId, 
        src: imageUrl, 
        image_type: imageType,
        title: title || null,
        description: description || null,
        display_order: displayOrder,
        is_featured: isFeatured
    };
};

export const getGalleryImages = async (companyId: number, filters?: {
    imageType?: string;
    isFeatured?: boolean;
    limit?: number;
}) => {
    let query = 'SELECT * FROM company_gallery WHERE company_id = ?';
    const params: any[] = [companyId];
    
    if (filters?.imageType) {
        query += ' AND image_type = ?';
        params.push(filters.imageType);
    }
    
    if (filters?.isFeatured !== undefined) {
        query += ' AND is_featured = ?';
        params.push(filters.isFeatured ? 1 : 0);
    }
    
    query += ' ORDER BY display_order ASC, created_at DESC';
    
    if (filters?.limit) {
        query += ' LIMIT ?';
        params.push(filters.limit);
    }
    
    const [images] = await pool.query<mysql.RowDataPacket[]>(query, params);
    return images;
};

export const updateGalleryImage = async (
    companyId: number,
    imageId: number,
    updates: {
        title?: string;
        description?: string;
        displayOrder?: number;
        isFeatured?: boolean;
        imageType?: string;
    }
) => {
    const updateFields: string[] = [];
    const params: any[] = [];
    
    if (updates.title !== undefined) {
        updateFields.push('title = ?');
        params.push(updates.title);
    }
    
    if (updates.description !== undefined) {
        updateFields.push('description = ?');
        params.push(updates.description);
    }
    
    if (updates.displayOrder !== undefined) {
        updateFields.push('display_order = ?');
        params.push(updates.displayOrder);
    }
    
    if (updates.isFeatured !== undefined) {
        updateFields.push('is_featured = ?');
        params.push(updates.isFeatured ? 1 : 0);
    }
    
    if (updates.imageType !== undefined) {
        updateFields.push('image_type = ?');
        params.push(updates.imageType);
    }
    
    if (updateFields.length === 0) {
        throw new AppError('No fields to update.', 400);
    }
    
    updateFields.push('updated_at = NOW()');
    params.push(imageId, companyId);
    
    const [result] = await pool.query<mysql.OkPacket>(
        `UPDATE company_gallery SET ${updateFields.join(', ')} WHERE id = ? AND company_id = ?`,
        params
    );
    
    if (result.affectedRows === 0) {
        throw new AppError('Image not found or you do not have permission to update it.', 404);
    }
    
    return { id: imageId, ...updates };
};

export const deleteGalleryImage = async (companyId: number, imageId: number) => {
    const [result] = await pool.query<mysql.OkPacket>(
        'DELETE FROM company_gallery WHERE id = ? AND company_id = ?',
        [imageId, companyId]
    );
    if (result.affectedRows === 0) {
        throw new AppError('Image not found or you do not have permission to delete it.', 404);
    }
    return;
};

// --- Bus Management by Company ---
export const getBusesByCompany = async (companyId: number) => {
    const [rows] = await pool.query('SELECT * FROM buses WHERE company_id = ?', [companyId]);
    return rows;
};

export const createBusForCompany = async (busData: any, companyId: number) => {
    const { plate, model, capacity, status, maintenanceDate } = busData;
    const [result] = await pool.query<mysql.ResultSetHeader>('INSERT INTO buses (company_id, plate_number, model, capacity, status, maintenanceDate) VALUES (?, ?, ?, ?, ?, ?)', [companyId, plate, model, capacity, status, maintenanceDate]);
    return { id: result.insertId, ...busData };
};

export const updateBusForCompany = async (busId: string, busData: any, companyId: number) => {
    const { plate, model, capacity, status, maintenanceDate } = busData;
    const [result] = await pool.query<mysql.OkPacket>('UPDATE buses SET plate_number = ?, model = ?, capacity = ?, status = ?, maintenanceDate = ? WHERE id = ? AND company_id = ?', [plate, model, capacity, status, maintenanceDate, busId, companyId]);
    if (result.affectedRows === 0) throw new AppError('Bus not found or permission denied', 404);
    return { id: busId, ...busData };
};

export const deleteBusForCompany = async (busId: string, companyId: number) => {
    const [result] = await pool.query<mysql.OkPacket>('DELETE FROM buses WHERE id = ? AND company_id = ?', [busId, companyId]);
    if (result.affectedRows === 0) throw new AppError('Bus not found or permission denied', 404);
};

// --- Route Management by Company ---
export const getRoutesByCompany = async (companyId: number) => {
    const [rows] = await pool.query('SELECT *, id, origin as `from`, destination as `to`, base_price as price, estimated_duration_minutes as duration FROM routes WHERE company_id = ?', [companyId]);
    return rows;
};

export const createRouteForCompany = async (routeData: any, companyId: number) => {
    const { from, to, price, duration } = routeData;
    const durationMinutes = parseFloat(duration) * 60; // Assuming duration is in hours (e.g., "3.5h")
    const [result] = await pool.query<mysql.ResultSetHeader>('INSERT INTO routes (company_id, origin, destination, base_price, estimated_duration_minutes) VALUES (?, ?, ?, ?, ?)', [companyId, from, to, price, durationMinutes]);
    return { id: result.insertId, ...routeData };
};

export const updateRouteForCompany = async (routeId: string, routeData: any, companyId: number) => {
    const { from, to, price, duration, status } = routeData;
    const durationMinutes = parseFloat(duration) * 60;
    const [result] = await pool.query<mysql.OkPacket>('UPDATE routes SET origin = ?, destination = ?, base_price = ?, estimated_duration_minutes = ?, status = ? WHERE id = ? AND company_id = ?', [from, to, price, durationMinutes, status || 'Active', routeId, companyId]);
    if (result.affectedRows === 0) throw new AppError('Route not found or permission denied', 404);
    return { id: routeId, ...routeData };
};

export const deleteRouteForCompany = async (routeId: string, companyId: number) => {
    const [result] = await pool.query<mysql.OkPacket>('DELETE FROM routes WHERE id = ? AND company_id = ?', [routeId, companyId]);
    if (result.affectedRows === 0) throw new AppError('Route not found or permission denied', 404);
};

// --- Passenger & Financials ---
export const getPassengersForCompany = async (companyId: number) => {
    const [rows] = await pool.query(`
        SELECT u.id, u.name, u.email, u.phone_number, b.booking_id as ticketId, r.origin, r.destination, t.departure_time as date, s.seat_number as seat
        FROM bookings b
        JOIN users u ON b.user_id = u.id
        JOIN trips t ON b.trip_id = t.id
        JOIN routes r ON t.route_id = r.id
        JOIN seats s ON b.id = s.booking_id
        WHERE r.company_id = ?
        ORDER BY t.departure_time DESC
        LIMIT 100
    `, [companyId]);
    // Transform route for frontend
    return (rows as any[]).map(r => ({...r, route: `${r.origin} - ${r.destination}`}));
};

export const getFinancialsForCompany = async (companyId: number) => {
    const [transactions] = await pool.query(`
        SELECT b.id, 'Ticket Revenue' as type, CONCAT(r.origin, ' - ', r.destination) as details, b.total_price as amount, b.created_at as date
        FROM bookings b
        JOIN trips t ON b.trip_id = t.id
        JOIN routes r ON t.route_id = r.id
        WHERE r.company_id = ? AND b.status = 'Completed'
        ORDER BY b.created_at DESC
        LIMIT 100
    `, [companyId]);
    return transactions;
};