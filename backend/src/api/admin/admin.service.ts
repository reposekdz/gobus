import { pool } from '../../config/db';
import { AppError } from '../../utils/AppError';
import * as mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

// --- Company Services ---
export const createCompany = async (companyData: any) => {
    const { name, ownerName, ownerEmail, password, ...contactDetails } = companyData;

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
        const [existingUsers] = await connection.query('SELECT id FROM users WHERE email = ?', [ownerEmail]);
        if ((existingUsers as any[]).length > 0) {
            throw new AppError('A user with this email already exists.', 400);
        }

        const password_hash = await bcrypt.hash(password, 10);
        const [userResult] = await connection.query<mysql.ResultSetHeader>(
            'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
            [ownerName, ownerEmail, password_hash, 'company']
        );
        const ownerId = userResult.insertId;

        const [companyResult] = await connection.query<mysql.ResultSetHeader>(
            'INSERT INTO companies (name, owner_id, contact_email, contact_phone, address, status) VALUES (?, ?, ?, ?, ?, ?)',
            [name, ownerId, contactDetails.contactEmail, contactDetails.contactPhone, contactDetails.address, 'Active']
        );
        const companyId = companyResult.insertId;

        await connection.query('UPDATE users SET company_id = ? WHERE id = ?', [companyId, ownerId]);

        await connection.commit();
        const [companyRows] = await pool.query('SELECT * FROM companies WHERE id = ?', [companyId]);
        return (companyRows as any)[0];
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

export const getAllCompanies = async () => {
    const [rows] = await pool.query(`
        SELECT c.*, u.name as owner_name, u.email as owner_email 
        FROM companies c 
        JOIN users u ON c.owner_id = u.id
    `);
    return rows;
};

export const updateCompanyById = async (id: string, updateData: any) => {
    const { name, status } = updateData;
    const [result] = await pool.query('UPDATE companies SET name = ?, status = ? WHERE id = ?', [name, status, id]);
    if ((result as mysql.OkPacket).affectedRows === 0) {
        throw new AppError('Company not found', 404);
    }
    const [rows] = await pool.query('SELECT * FROM companies WHERE id = ?', [id]);
    return (rows as any)[0];
};

export const deleteCompanyById = async (id: string) => {
    // In a real app with cascading deletes handled by DB, this would be simpler.
    // For now, we assume related data might be orphaned or handled by DB constraints.
    const [result] = await pool.query('DELETE FROM companies WHERE id = ?', [id]);
     if ((result as mysql.OkPacket).affectedRows === 0) {
        throw new AppError('Company not found', 404);
    }
    return;
};

// --- Driver Services ---
export const createDriver = async (driverData: any) => {
    const { name, email, password, phone, companyId } = driverData;
    const password_hash = await bcrypt.hash(password, 10);
    const [result] = await pool.query<mysql.ResultSetHeader>(
        'INSERT INTO users (name, email, password_hash, phone_number, role, company_id) VALUES (?, ?, ?, ?, ?, ?)',
        [name, email, password_hash, phone, 'driver', companyId]
    );
    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [result.insertId]);
    return (rows as any)[0];
};

export const getAllDrivers = async () => {
    const [rows] = await pool.query(`
        SELECT u.*, c.name as company_name 
        FROM users u 
        LEFT JOIN companies c ON u.company_id = c.id 
        WHERE u.role = 'driver'
    `);
    return rows;
};

export const updateDriverById = async (id: string, updateData: any) => {
    const { name, phone, companyId } = updateData;
    const [result] = await pool.query('UPDATE users SET name = ?, phone_number = ?, company_id = ? WHERE id = ? AND role = "driver"', [name, phone, companyId, id]);
    if ((result as mysql.OkPacket).affectedRows === 0) {
        throw new AppError('Driver not found', 404);
    }
    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
    return (rows as any)[0];
};

export const deleteDriverById = async (id: string) => {
    const [result] = await pool.query('DELETE FROM users WHERE id = ? AND role = "driver"', [id]);
    if ((result as mysql.OkPacket).affectedRows === 0) {
        throw new AppError('Driver not found', 404);
    }
    return;
};

// --- Agent Services ---
export const createAgent = async (agentData: any) => {
    const { name, email, password, phone, location } = agentData;
    const password_hash = await bcrypt.hash(password, 10);
    const [result] = await pool.query<mysql.ResultSetHeader>(
        'INSERT INTO users (name, email, password_hash, phone_number, role, location) VALUES (?, ?, ?, ?, ?, ?)',
        [name, email, password_hash, phone, 'agent', location]
    );
     const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [result.insertId]);
    return (rows as any)[0];
};

export const getAllAgents = async () => {
    const [rows] = await pool.query("SELECT * FROM users WHERE role = 'agent'");
    return rows;
};

export const updateAgentById = async (id: string, updateData: any) => {
    const { name, phone, location } = updateData;
    const [result] = await pool.query('UPDATE users SET name = ?, phone_number = ?, location = ? WHERE id = ? AND role = "agent"', [name, phone, location, id]);
    if ((result as mysql.OkPacket).affectedRows === 0) {
        throw new AppError('Agent not found', 404);
    }
     const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
    return (rows as any)[0];
};

export const deleteAgentById = async (id: string) => {
    const [result] = await pool.query('DELETE FROM users WHERE id = ? AND role = "agent"', [id]);
    if ((result as mysql.OkPacket).affectedRows === 0) {
        throw new AppError('Agent not found', 404);
    }
    return;
};


// --- User Services ---
export const getAllUsers = async () => {
    const [rows] = await pool.query(`
        SELECT u.id, u.name, u.email, u.role, u.created_at, u.status, u.avatar_url, c.name as company_name 
        FROM users u 
        LEFT JOIN companies c ON u.company_id = c.id
    `);
    return rows;
};

// --- Dashboard Analytics ---
export const getDashboardAnalytics = async () => {
    const [[{ count: companies }]] = await pool.query<any[] & mysql.RowDataPacket[]>("SELECT COUNT(*) as count FROM companies WHERE status = 'Active'");
    const [[{ count: agents }]] = await pool.query<any[] & mysql.RowDataPacket[]>("SELECT COUNT(*) as count FROM users WHERE role = 'agent'");
    const [[{ totalRevenue, totalPassengers }]] = await pool.query<any[] & mysql.RowDataPacket[]>("SELECT SUM(total_price) as totalRevenue, COUNT(id) as totalPassengers FROM bookings WHERE status != 'Cancelled'");
    
    // Mock data for charts as queries would be complex
    const revenueData = [
        { day: 'Mon', revenue: 1200000 }, { day: 'Tue', revenue: 1500000 }, { day: 'Wed', revenue: 1350000 },
        { day: 'Thu', revenue: 1800000 }, { day: 'Fri', revenue: 2500000 }, { day: 'Sat', revenue: 3200000 }, { day: 'Sun', revenue: 2800000 }
    ];
    const passengerData = [
        { day: 'Mon', passengers: 1200 }, { day: 'Tue', passengers: 1500 }, { day: 'Wed', passengers: 1350 },
        { day: 'Thu', passengers: 1800 }, { day: 'Fri', passengers: 2500 }, { day: 'Sat', passengers: 3200 }, { day: 'Sun', passengers: 2800 }
    ];
    const [companyRevenue] = await pool.query(`
        SELECT c.name, SUM(b.total_price) as revenue 
        FROM bookings b 
        JOIN trips t ON b.trip_id = t.id 
        JOIN routes r ON t.route_id = r.id 
        JOIN companies c ON r.company_id = c.id
        GROUP BY c.id 
        ORDER BY revenue DESC
    `);
    
    const [highValueTransactions] = await pool.query(`
        SELECT id, amount, type, description, created_at FROM wallet_transactions ORDER BY ABS(amount) DESC LIMIT 5
    `);

    return {
        stats: { 
            companies,
            agents,
            totalRevenue: totalRevenue || 0,
            totalPassengers: totalPassengers || 0
        },
        revenueData,
        passengerData,
        companyRevenue,
        highValueTransactions
    };
};

export const getFinancialsData = async () => {
    // These queries would be more complex with date ranges in a real app
    const [[{ totalRevenue }]] = await pool.query<any[] & mysql.RowDataPacket[]>("SELECT SUM(total_price) as totalRevenue FROM bookings WHERE status != 'Cancelled'");
    const [[{ commissionsPaid }]] = await pool.query<any[] & mysql.RowDataPacket[]>("SELECT SUM(amount) as commissionsPaid FROM wallet_transactions WHERE type = 'commission'");
    
    // Mocking these as they are not directly available in schema
    const companyPayouts = 18500000;
    const promotionsUsed = 85000;

    const [transactions] = await pool.query(`
        (SELECT 'Ticket Sale' as type, CONCAT(c.name, ': ', r.origin, '-', r.destination) as details, b.total_price as amount, b.created_at as date FROM bookings b JOIN trips t ON b.trip_id = t.id JOIN routes r ON t.route_id = r.id JOIN companies c ON r.company_id = c.id ORDER BY b.created_at DESC LIMIT 5)
        UNION
        (SELECT 'Agent Commission' as type, CONCAT('Agent #', u.id) as details, wt.amount, wt.created_at as date FROM wallet_transactions wt JOIN wallets w ON wt.wallet_id = w.id JOIN users u ON w.user_id = u.id WHERE wt.type = 'commission' ORDER BY wt.created_at DESC LIMIT 5)
        ORDER BY date DESC
    `);

    return {
        stats: {
            totalRevenue: totalRevenue || 0,
            commissionsPaid: commissionsPaid || 0,
            companyPayouts,
            promotionsUsed
        },
        transactions
    }
};