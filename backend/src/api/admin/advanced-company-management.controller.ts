import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import { db } from '../../config/database';
import { sendEmail } from '../../services/email.service';
import { generateSecurePassword } from '../../utils/password.utils';
import { logger } from '../../utils/logger';

interface CreateCompanyRequest {
  name: string;
  email: string;
  phone: string;
  address: string;
  license_number: string;
  tax_id: string;
  description?: string;
  logo_url?: string;
  website?: string;
  manager_name: string;
  manager_email: string;
  manager_phone: string;
  subscription_plan: 'basic' | 'premium' | 'enterprise';
  commission_rate: number;
}

interface CreateAgentRequest {
  company_id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  id_number: string;
  agent_type: 'sales' | 'support' | 'manager';
  permissions: string[];
  commission_rate?: number;
}

export class AdvancedCompanyManagementController {
  // Create new company with auto-generated credentials
  static async createCompany(req: Request, res: Response) {
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();
      
      const {
        name, email, phone, address, license_number, tax_id,
        description, logo_url, website, manager_name, manager_email,
        manager_phone, subscription_plan, commission_rate
      }: CreateCompanyRequest = req.body;

      // Generate secure credentials
      const companyId = uuidv4();
      const managerPassword = generateSecurePassword();
      const hashedPassword = await bcrypt.hash(managerPassword, 14);
      const apiKey = `gbc_${uuidv4().replace(/-/g, '')}`;
      const apiSecret = `gbs_${uuidv4().replace(/-/g, '')}`;

      // Create company
      const [companyResult] = await connection.execute(`
        INSERT INTO companies (
          id, name, email, phone, address, license_number, tax_id,
          description, logo_url, website, subscription_plan, commission_rate,
          api_key, api_secret, status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', NOW(), NOW())
      `, [
        companyId, name, email, phone, address, license_number, tax_id,
        description, logo_url, website, subscription_plan, commission_rate,
        apiKey, apiSecret
      ]);

      // Create company manager account
      const managerId = uuidv4();
      await connection.execute(`
        INSERT INTO users (
          id, email, password, name, phone, role, company_id,
          is_verified, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, 'company_manager', ?, true, NOW(), NOW())
      `, [managerId, manager_email, hashedPassword, manager_name, manager_phone, companyId]);

      // Create company wallet
      await connection.execute(`
        INSERT INTO company_wallets (
          id, company_id, balance, currency, status, created_at, updated_at
        ) VALUES (?, ?, 0.00, 'RWF', 'active', NOW(), NOW())
      `, [uuidv4(), companyId]);

      // Create default company settings
      await connection.execute(`
        INSERT INTO company_settings (
          company_id, booking_fee_percentage, cancellation_fee_percentage,
          refund_policy_hours, max_advance_booking_days, auto_confirm_bookings,
          enable_loyalty_program, loyalty_points_ratio, created_at, updated_at
        ) VALUES (?, 2.5, 10.0, 24, 90, true, true, 0.02, NOW(), NOW())
      `, [companyId]);

      await connection.commit();

      // Send credentials via email
      await sendEmail({
        to: manager_email,
        subject: 'Welcome to GoBus - Company Account Created',
        template: 'company-welcome',
        data: {
          companyName: name,
          managerName: manager_name,
          email: manager_email,
          password: managerPassword,
          loginUrl: `${process.env.COMPANY_URL}/login`,
          apiKey,
          apiSecret,
          supportEmail: process.env.EMAIL_SUPPORT
        }
      });

      logger.info(`Company created successfully: ${companyId}`, {
        companyId,
        adminId: req.user?.id,
        companyName: name
      });

      res.status(201).json({
        success: true,
        message: 'Company created successfully',
        data: {
          company: {
            id: companyId,
            name,
            email,
            subscription_plan,
            status: 'active'
          },
          manager: {
            id: managerId,
            name: manager_name,
            email: manager_email,
            credentials_sent: true
          },
          api_credentials: {
            api_key: apiKey,
            note: 'API secret sent via email'
          }
        }
      });

    } catch (error) {
      await connection.rollback();
      logger.error('Error creating company:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create company',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    } finally {
      connection.release();
    }
  }

  // Create agent for a company
  static async createAgent(req: Request, res: Response) {
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();
      
      const {
        company_id, name, email, phone, address, id_number,
        agent_type, permissions, commission_rate
      }: CreateAgentRequest = req.body;

      // Verify company exists
      const [companyRows] = await connection.execute(
        'SELECT id, name FROM companies WHERE id = ? AND status = "active"',
        [company_id]
      );

      if (!Array.isArray(companyRows) || companyRows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Company not found or inactive'
        });
      }

      const company = companyRows[0] as any;

      // Generate secure credentials
      const agentId = uuidv4();
      const agentPassword = generateSecurePassword();
      const hashedPassword = await bcrypt.hash(agentPassword, 14);

      // Create agent user account
      await connection.execute(`
        INSERT INTO users (
          id, email, password, name, phone, role, company_id,
          is_verified, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, 'agent', ?, true, NOW(), NOW())
      `, [agentId, email, hashedPassword, name, phone, company_id]);

      // Create agent profile
      await connection.execute(`
        INSERT INTO agents (
          id, user_id, company_id, agent_type, id_number, address,
          commission_rate, permissions, status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', NOW(), NOW())
      `, [
        uuidv4(), agentId, company_id, agent_type, id_number, address,
        commission_rate || 5.0, JSON.stringify(permissions)
      ]);

      await connection.commit();

      // Send credentials via email
      await sendEmail({
        to: email,
        subject: `Welcome to ${company.name} - Agent Account Created`,
        template: 'agent-welcome',
        data: {
          agentName: name,
          companyName: company.name,
          email,
          password: agentPassword,
          agentType: agent_type,
          loginUrl: `${process.env.COMPANY_URL}/agent/login`,
          supportEmail: process.env.EMAIL_SUPPORT
        }
      });

      logger.info(`Agent created successfully: ${agentId}`, {
        agentId,
        companyId: company_id,
        adminId: req.user?.id,
        agentType: agent_type
      });

      res.status(201).json({
        success: true,
        message: 'Agent created successfully',
        data: {
          agent: {
            id: agentId,
            name,
            email,
            agent_type,
            company_name: company.name,
            status: 'active',
            credentials_sent: true
          }
        }
      });

    } catch (error) {
      await connection.rollback();
      logger.error('Error creating agent:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create agent',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    } finally {
      connection.release();
    }
  }

  // Get all companies with detailed information
  static async getAllCompanies(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const search = req.query.search as string || '';
      const status = req.query.status as string || '';
      const subscription = req.query.subscription as string || '';

      const offset = (page - 1) * limit;

      let whereClause = 'WHERE 1=1';
      const params: any[] = [];

      if (search) {
        whereClause += ' AND (c.name LIKE ? OR c.email LIKE ? OR c.license_number LIKE ?)';
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
      }

      if (status) {
        whereClause += ' AND c.status = ?';
        params.push(status);
      }

      if (subscription) {
        whereClause += ' AND c.subscription_plan = ?';
        params.push(subscription);
      }

      const [companies] = await db.execute(`
        SELECT 
          c.*,
          cw.balance as wallet_balance,
          COUNT(DISTINCT u.id) as total_users,
          COUNT(DISTINCT b.id) as total_buses,
          COUNT(DISTINCT r.id) as total_routes,
          SUM(CASE WHEN bk.status = 'confirmed' THEN 1 ELSE 0 END) as total_bookings,
          SUM(CASE WHEN bk.status = 'confirmed' THEN bk.total_amount ELSE 0 END) as total_revenue
        FROM companies c
        LEFT JOIN company_wallets cw ON c.id = cw.company_id
        LEFT JOIN users u ON c.id = u.company_id
        LEFT JOIN buses b ON c.id = b.company_id
        LEFT JOIN routes r ON c.id = r.company_id
        LEFT JOIN bookings bk ON c.id = bk.company_id
        ${whereClause}
        GROUP BY c.id
        ORDER BY c.created_at DESC
        LIMIT ? OFFSET ?
      `, [...params, limit, offset]);

      const [countResult] = await db.execute(`
        SELECT COUNT(DISTINCT c.id) as total
        FROM companies c
        ${whereClause}
      `, params);

      const total = (countResult as any)[0].total;

      res.json({
        success: true,
        data: {
          companies,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          }
        }
      });

    } catch (error) {
      logger.error('Error fetching companies:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch companies',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Update company status and settings
  static async updateCompanyStatus(req: Request, res: Response) {
    try {
      const { companyId } = req.params;
      const { status, reason } = req.body;

      const [result] = await db.execute(
        'UPDATE companies SET status = ?, updated_at = NOW() WHERE id = ?',
        [status, companyId]
      );

      if ((result as any).affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'Company not found'
        });
      }

      // Log status change
      await db.execute(`
        INSERT INTO company_status_logs (
          id, company_id, old_status, new_status, reason, changed_by, created_at
        ) VALUES (?, ?, 
          (SELECT status FROM companies WHERE id = ? LIMIT 1), 
          ?, ?, ?, NOW()
        )
      `, [uuidv4(), companyId, companyId, status, reason, req.user?.id]);

      logger.info(`Company status updated: ${companyId}`, {
        companyId,
        newStatus: status,
        adminId: req.user?.id,
        reason
      });

      res.json({
        success: true,
        message: 'Company status updated successfully'
      });

    } catch (error) {
      logger.error('Error updating company status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update company status',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Get company analytics
  static async getCompanyAnalytics(req: Request, res: Response) {
    try {
      const { companyId } = req.params;
      const { period = '30d' } = req.query;

      let dateFilter = '';
      switch (period) {
        case '7d':
          dateFilter = 'AND DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)';
          break;
        case '30d':
          dateFilter = 'AND DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)';
          break;
        case '90d':
          dateFilter = 'AND DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 90 DAY)';
          break;
        case '1y':
          dateFilter = 'AND DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 1 YEAR)';
          break;
      }

      const [analytics] = await db.execute(`
        SELECT 
          COUNT(DISTINCT b.id) as total_bookings,
          SUM(CASE WHEN b.status = 'confirmed' THEN b.total_amount ELSE 0 END) as total_revenue,
          SUM(CASE WHEN b.status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_bookings,
          AVG(r.rating) as average_rating,
          COUNT(DISTINCT u.id) as active_users,
          COUNT(DISTINCT bus.id) as active_buses
        FROM companies c
        LEFT JOIN bookings b ON c.id = b.company_id ${dateFilter}
        LEFT JOIN reviews r ON c.id = r.company_id ${dateFilter}
        LEFT JOIN users u ON c.id = u.company_id AND u.last_login >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        LEFT JOIN buses bus ON c.id = bus.company_id AND bus.status = 'active'
        WHERE c.id = ?
        GROUP BY c.id
      `, [companyId]);

      const [dailyStats] = await db.execute(`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as bookings,
          SUM(total_amount) as revenue
        FROM bookings 
        WHERE company_id = ? AND status = 'confirmed' ${dateFilter}
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      `, [companyId]);

      res.json({
        success: true,
        data: {
          summary: analytics[0],
          daily_stats: dailyStats,
          period
        }
      });

    } catch (error) {
      logger.error('Error fetching company analytics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch company analytics',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
}