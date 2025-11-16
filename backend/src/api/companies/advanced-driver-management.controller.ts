import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../../config/database';
import { sendEmail } from '../../services/email.service';
import { generateSecurePassword } from '../../utils/password.utils';
import { logger } from '../../utils/logger';

interface CreateDriverRequest {
  name: string;
  email: string;
  phone: string;
  address: string;
  license_number: string;
  license_expiry: string;
  id_number: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  experience_years: number;
  salary_type: 'fixed' | 'commission' | 'hybrid';
  base_salary?: number;
  commission_rate?: number;
}

interface AssignBusRequest {
  driver_id: string;
  bus_id: string;
  assignment_type: 'primary' | 'secondary' | 'temporary';
  start_date: string;
  end_date?: string;
  notes?: string;
}

export class AdvancedDriverManagementController {
  // Create new driver with auto-generated credentials
  static async createDriver(req: Request, res: Response) {
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();
      
      const {
        name, email, phone, address, license_number, license_expiry,
        id_number, emergency_contact_name, emergency_contact_phone,
        experience_years, salary_type, base_salary, commission_rate
      }: CreateDriverRequest = req.body;

      const companyId = req.user?.company_id;
      if (!companyId) {
        return res.status(403).json({
          success: false,
          message: 'Company access required'
        });
      }

      // Check if driver already exists
      const [existingDriver] = await connection.execute(
        'SELECT id FROM users WHERE email = ? OR phone = ?',
        [email, phone]
      );

      if (Array.isArray(existingDriver) && existingDriver.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'Driver with this email or phone already exists'
        });
      }

      // Generate secure credentials
      const driverId = uuidv4();
      const driverPassword = generateSecurePassword();
      const hashedPassword = await bcrypt.hash(driverPassword, 14);

      // Create driver user account
      await connection.execute(`
        INSERT INTO users (
          id, email, password, name, phone, role, company_id,
          is_verified, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, 'driver', ?, true, NOW(), NOW())
      `, [driverId, email, hashedPassword, name, phone, companyId]);

      // Create driver profile
      const driverProfileId = uuidv4();
      await connection.execute(`
        INSERT INTO drivers (
          id, user_id, company_id, license_number, license_expiry, id_number,
          address, emergency_contact_name, emergency_contact_phone,
          experience_years, salary_type, base_salary, commission_rate,
          status, rating, total_trips, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', 5.0, 0, NOW(), NOW())
      `, [
        driverProfileId, driverId, companyId, license_number, license_expiry,
        id_number, address, emergency_contact_name, emergency_contact_phone,
        experience_years, salary_type, base_salary || 0, commission_rate || 0
      ]);

      // Create driver wallet
      await connection.execute(`
        INSERT INTO driver_wallets (
          id, driver_id, balance, currency, status, created_at, updated_at
        ) VALUES (?, ?, 0.00, 'RWF', 'active', NOW(), NOW())
      `, [uuidv4(), driverId]);

      // Get company information
      const [companyRows] = await connection.execute(
        'SELECT name FROM companies WHERE id = ?',
        [companyId]
      );
      const company = companyRows[0] as any;

      await connection.commit();

      // Send credentials via email
      await sendEmail({
        to: email,
        subject: `Welcome to ${company.name} - Driver Account Created`,
        template: 'driver-welcome',
        data: {
          driverName: name,
          companyName: company.name,
          email,
          password: driverPassword,
          loginUrl: `${process.env.DRIVER_URL}/login`,
          supportEmail: process.env.EMAIL_SUPPORT,
          licenseNumber: license_number
        }
      });

      logger.info(`Driver created successfully: ${driverId}`, {
        driverId,
        companyId,
        managerId: req.user?.id,
        driverName: name
      });

      res.status(201).json({
        success: true,
        message: 'Driver created successfully',
        data: {
          driver: {
            id: driverId,
            name,
            email,
            phone,
            license_number,
            status: 'active',
            credentials_sent: true
          }
        }
      });

    } catch (error) {
      await connection.rollback();
      logger.error('Error creating driver:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create driver',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    } finally {
      connection.release();
    }
  }

  // Assign bus to driver
  static async assignBusToDriver(req: Request, res: Response) {
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();
      
      const {
        driver_id, bus_id, assignment_type, start_date, end_date, notes
      }: AssignBusRequest = req.body;

      const companyId = req.user?.company_id;

      // Verify driver and bus belong to company
      const [driverCheck] = await connection.execute(`
        SELECT d.id, u.name as driver_name 
        FROM drivers d 
        JOIN users u ON d.user_id = u.id 
        WHERE u.id = ? AND d.company_id = ?
      `, [driver_id, companyId]);

      const [busCheck] = await connection.execute(
        'SELECT id, plate_number, model FROM buses WHERE id = ? AND company_id = ?',
        [bus_id, companyId]
      );

      if (!Array.isArray(driverCheck) || driverCheck.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Driver not found or not in your company'
        });
      }

      if (!Array.isArray(busCheck) || busCheck.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Bus not found or not in your company'
        });
      }

      const driver = driverCheck[0] as any;
      const bus = busCheck[0] as any;

      // Check for existing primary assignment if this is primary
      if (assignment_type === 'primary') {
        const [existingPrimary] = await connection.execute(`
          SELECT id FROM bus_assignments 
          WHERE bus_id = ? AND assignment_type = 'primary' 
          AND status = 'active' AND (end_date IS NULL OR end_date > NOW())
        `, [bus_id]);

        if (Array.isArray(existingPrimary) && existingPrimary.length > 0) {
          return res.status(409).json({
            success: false,
            message: 'Bus already has a primary driver assigned'
          });
        }
      }

      // Create assignment
      const assignmentId = uuidv4();
      await connection.execute(`
        INSERT INTO bus_assignments (
          id, driver_id, bus_id, company_id, assignment_type,
          start_date, end_date, notes, status, assigned_by, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, NOW(), NOW())
      `, [
        assignmentId, driver_id, bus_id, companyId, assignment_type,
        start_date, end_date, notes, req.user?.id
      ]);

      // Update bus status if primary assignment
      if (assignment_type === 'primary') {
        await connection.execute(
          'UPDATE buses SET assigned_driver_id = ?, status = "assigned" WHERE id = ?',
          [driver_id, bus_id]
        );
      }

      await connection.commit();

      logger.info(`Bus assigned to driver: ${assignmentId}`, {
        assignmentId,
        driverId: driver_id,
        busId: bus_id,
        assignmentType: assignment_type,
        companyId,
        assignedBy: req.user?.id
      });

      res.status(201).json({
        success: true,
        message: 'Bus assigned to driver successfully',
        data: {
          assignment: {
            id: assignmentId,
            driver_name: driver.driver_name,
            bus_info: `${bus.model} (${bus.plate_number})`,
            assignment_type,
            start_date,
            status: 'active'
          }
        }
      });

    } catch (error) {
      await connection.rollback();
      logger.error('Error assigning bus to driver:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to assign bus to driver',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    } finally {
      connection.release();
    }
  }

  // Get all drivers for company
  static async getCompanyDrivers(req: Request, res: Response) {
    try {
      const companyId = req.user?.company_id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const search = req.query.search as string || '';
      const status = req.query.status as string || '';

      const offset = (page - 1) * limit;

      let whereClause = 'WHERE d.company_id = ?';
      const params: any[] = [companyId];

      if (search) {
        whereClause += ' AND (u.name LIKE ? OR u.email LIKE ? OR d.license_number LIKE ?)';
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
      }

      if (status) {
        whereClause += ' AND d.status = ?';
        params.push(status);
      }

      const [drivers] = await db.execute(`
        SELECT 
          u.id, u.name, u.email, u.phone, u.created_at,
          d.license_number, d.license_expiry, d.experience_years,
          d.salary_type, d.base_salary, d.commission_rate, d.status,
          d.rating, d.total_trips,
          b.plate_number as assigned_bus,
          ba.assignment_type,
          dw.balance as wallet_balance,
          COUNT(DISTINCT t.id) as active_trips
        FROM drivers d
        JOIN users u ON d.user_id = u.id
        LEFT JOIN bus_assignments ba ON d.user_id = ba.driver_id AND ba.status = 'active'
        LEFT JOIN buses b ON ba.bus_id = b.id
        LEFT JOIN driver_wallets dw ON d.user_id = dw.driver_id
        LEFT JOIN trips t ON d.user_id = t.driver_id AND t.status IN ('scheduled', 'in_progress')
        ${whereClause}
        GROUP BY u.id
        ORDER BY u.created_at DESC
        LIMIT ? OFFSET ?
      `, [...params, limit, offset]);

      const [countResult] = await db.execute(`
        SELECT COUNT(DISTINCT u.id) as total
        FROM drivers d
        JOIN users u ON d.user_id = u.id
        ${whereClause}
      `, params);

      const total = (countResult as any)[0].total;

      res.json({
        success: true,
        data: {
          drivers,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          }
        }
      });

    } catch (error) {
      logger.error('Error fetching company drivers:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch drivers',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Get driver performance analytics
  static async getDriverPerformance(req: Request, res: Response) {
    try {
      const { driverId } = req.params;
      const companyId = req.user?.company_id;
      const { period = '30d' } = req.query;

      let dateFilter = '';
      switch (period) {
        case '7d':
          dateFilter = 'AND DATE(t.departure_time) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)';
          break;
        case '30d':
          dateFilter = 'AND DATE(t.departure_time) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)';
          break;
        case '90d':
          dateFilter = 'AND DATE(t.departure_time) >= DATE_SUB(CURDATE(), INTERVAL 90 DAY)';
          break;
      }

      // Verify driver belongs to company
      const [driverCheck] = await db.execute(
        'SELECT id FROM drivers WHERE user_id = ? AND company_id = ?',
        [driverId, companyId]
      );

      if (!Array.isArray(driverCheck) || driverCheck.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Driver not found'
        });
      }

      const [performance] = await db.execute(`
        SELECT 
          COUNT(DISTINCT t.id) as total_trips,
          SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) as completed_trips,
          SUM(CASE WHEN t.status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_trips,
          AVG(r.rating) as average_rating,
          COUNT(DISTINCT r.id) as total_reviews,
          SUM(b.total_amount) as total_revenue,
          AVG(TIMESTAMPDIFF(MINUTE, t.departure_time, t.arrival_time)) as avg_trip_duration,
          COUNT(DISTINCT DATE(t.departure_time)) as active_days
        FROM trips t
        LEFT JOIN reviews r ON t.id = r.trip_id
        LEFT JOIN bookings b ON t.id = b.trip_id AND b.status = 'confirmed'
        WHERE t.driver_id = ? ${dateFilter}
      `, [driverId]);

      const [dailyStats] = await db.execute(`
        SELECT 
          DATE(t.departure_time) as date,
          COUNT(*) as trips,
          SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) as completed,
          AVG(r.rating) as avg_rating
        FROM trips t
        LEFT JOIN reviews r ON t.id = r.trip_id
        WHERE t.driver_id = ? ${dateFilter}
        GROUP BY DATE(t.departure_time)
        ORDER BY date DESC
      `, [driverId]);

      res.json({
        success: true,
        data: {
          summary: performance[0],
          daily_stats: dailyStats,
          period
        }
      });

    } catch (error) {
      logger.error('Error fetching driver performance:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch driver performance',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Update driver status
  static async updateDriverStatus(req: Request, res: Response) {
    try {
      const { driverId } = req.params;
      const { status, reason } = req.body;
      const companyId = req.user?.company_id;

      const [result] = await db.execute(
        'UPDATE drivers SET status = ?, updated_at = NOW() WHERE user_id = ? AND company_id = ?',
        [status, driverId, companyId]
      );

      if ((result as any).affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'Driver not found'
        });
      }

      logger.info(`Driver status updated: ${driverId}`, {
        driverId,
        newStatus: status,
        companyId,
        updatedBy: req.user?.id,
        reason
      });

      res.json({
        success: true,
        message: 'Driver status updated successfully'
      });

    } catch (error) {
      logger.error('Error updating driver status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update driver status',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
}