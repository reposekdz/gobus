import { Request, Response } from 'express';
import { pool } from '../../config/db';
import { catchAsync } from '../../middleware/error.middleware';
import bcrypt from 'bcryptjs';
import * as mysql from 'mysql2/promise';

export const createCompany = catchAsync(async (req: Request, res: Response) => {
    const {
        name, email, password, phone, license_number, address, 
        description, commission_rate = 10.00
    } = req.body;
    
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();
        
        // Create user account for company
        const password_hash = await bcrypt.hash(password, 12);
        const serial_code = `CMP${Math.floor(1000 + Math.random() * 9000)}`;
        
        const [userResult] = await connection.query<mysql.ResultSetHeader>(
            `INSERT INTO users (name, email, phone_number, password_hash, role, serial_code, is_verified)
             VALUES (?, ?, ?, ?, 'company', ?, 1)`,
            [name, email, phone, password_hash, serial_code]
        );
        
        // Create company record
        const [companyResult] = await connection.query<mysql.ResultSetHeader>(
            `INSERT INTO companies (user_id, name, license_number, address, description, 
                                  email, phone, commission_rate, is_verified, is_active)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 1)`,
            [userResult.insertId, name, license_number, address, description, 
             email, phone, commission_rate]
        );
        
        await connection.commit();
        
        res.status(201).json({
            success: true,
            data: {
                id: companyResult.insertId,
                user_id: userResult.insertId,
                name, email, phone, serial_code,
                message: 'Company created successfully. Login credentials sent to company email.'
            }
        });
        
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
});

export const createAgent = catchAsync(async (req: Request, res: Response) => {
    const {
        name, email, password, phone, location, 
        commission_rate = 5.00, supervisor_id
    } = req.body;
    
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();
        
        const password_hash = await bcrypt.hash(password, 12);
        const serial_code = `AGT${Math.floor(1000 + Math.random() * 9000)}`;
        const agent_code = `A${Math.floor(100000 + Math.random() * 900000)}`;
        
        const [userResult] = await connection.query<mysql.ResultSetHeader>(
            `INSERT INTO users (name, email, phone_number, password_hash, role, serial_code, is_verified)
             VALUES (?, ?, ?, ?, 'agent', ?, 1)`,
            [name, email, phone, password_hash, serial_code]
        );
        
        const [agentResult] = await connection.query<mysql.ResultSetHeader>(
            `INSERT INTO agents (user_id, agent_code, commission_rate, location, supervisor_id, status)
             VALUES (?, ?, ?, ?, ?, 'active')`,
            [userResult.insertId, agent_code, commission_rate, location, supervisor_id]
        );
        
        await connection.commit();
        
        res.status(201).json({
            success: true,
            data: {
                id: agentResult.insertId,
                user_id: userResult.insertId,
                name, email, phone, agent_code, serial_code,
                message: 'Agent created successfully. Login credentials sent to agent email.'
            }
        });
        
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
});

export const getCompanies = catchAsync(async (req: Request, res: Response) => {
    const { page = 1, limit = 20, search, status } = req.query;
    
    let query = `
        SELECT c.*, u.name as contact_name, u.email, u.phone_number,
               COUNT(DISTINCT d.id) as total_drivers,
               COUNT(DISTINCT b.id) as total_buses,
               COUNT(DISTINCT r.id) as total_routes,
               AVG(rev.rating) as average_rating
        FROM companies c
        INNER JOIN users u ON c.user_id = u.id
        LEFT JOIN drivers d ON c.id = d.company_id AND d.status = 'active'
        LEFT JOIN buses b ON c.id = b.company_id AND b.status = 'active'
        LEFT JOIN routes r ON c.id = r.company_id AND r.is_active = 1
        LEFT JOIN reviews rev ON c.id = rev.company_id
        WHERE 1=1
    `;
    
    const queryParams: any[] = [];
    
    if (search) {
        query += ` AND (c.name LIKE ? OR u.email LIKE ? OR c.license_number LIKE ?)`;
        queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    
    if (status) {
        query += ` AND c.is_active = ?`;
        queryParams.push(status === 'active' ? 1 : 0);
    }
    
    query += ` GROUP BY c.id ORDER BY c.created_at DESC`;
    
    const offset = (Number(page) - 1) * Number(limit);
    query += ` LIMIT ? OFFSET ?`;
    queryParams.push(Number(limit), offset);
    
    const [companies] = await pool.query<any[] & mysql.RowDataPacket[]>(query, queryParams);
    
    res.json({
        success: true,
        data: companies,
        pagination: {
            page: Number(page),
            limit: Number(limit),
            total: companies.length
        }
    });
});

export const updateCompanyStatus = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { is_active, is_verified } = req.body;
    
    await pool.query(
        `UPDATE companies SET is_active = ?, is_verified = ?, updated_at = NOW() WHERE id = ?`,
        [is_active, is_verified, id]
    );
    
    res.json({
        success: true,
        message: 'Company status updated successfully'
    });
});