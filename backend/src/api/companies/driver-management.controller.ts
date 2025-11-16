import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../../config/database';

export class DriverManagementController {
  // Add new driver to company
  static async addDriver(req: Request, res: Response) {
    try {
      const { name, email, phone_number, license_number } = req.body;
      const companyId = req.user?.company_id;

      // Generate secure password
      const password = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
      const hashedPassword = await bcrypt.hash(password, 12);

      // Create driver user
      const [result] = await db.execute(`
        INSERT INTO users (name, email, password_hash, phone_number, role, company_id, status)
        VALUES (?, ?, ?, ?, 'driver', ?, 'Active')
      `, [name, email, hashedPassword, phone_number, companyId]);

      const driverId = (result as any).insertId;

      res.status(201).json({
        success: true,
        message: 'Driver added successfully',
        data: {
          id: driverId,
          name,
          email,
          phone_number,
          license_number,
          password, // Send password in response for demo
          status: 'Active'
        }
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to add driver',
        error: error.message
      });
    }
  }

  // Get all company drivers
  static async getDrivers(req: Request, res: Response) {
    try {
      const companyId = req.user?.company_id;

      const [drivers] = await db.execute(`
        SELECT 
          u.id, u.name, u.email, u.phone_number, u.status,
          b.plate_number as assigned_bus,
          COUNT(t.id) as total_trips
        FROM users u
        LEFT JOIN buses b ON u.id = b.driver_id
        LEFT JOIN trips t ON u.id = t.driver_id
        WHERE u.company_id = ? AND u.role = 'driver'
        GROUP BY u.id
        ORDER BY u.created_at DESC
      `, [companyId]);

      res.json({
        success: true,
        data: { drivers }
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch drivers',
        error: error.message
      });
    }
  }

  // Assign bus to driver
  static async assignBus(req: Request, res: Response) {
    try {
      const { driver_id, bus_id } = req.body;
      const companyId = req.user?.company_id;

      // Unassign any previous bus from this driver
      await db.execute('UPDATE buses SET driver_id = NULL WHERE driver_id = ?', [driver_id]);

      // Assign new bus to driver
      await db.execute(
        'UPDATE buses SET driver_id = ? WHERE id = ? AND company_id = ?',
        [driver_id, bus_id, companyId]
      );

      res.json({
        success: true,
        message: 'Bus assigned to driver successfully'
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to assign bus',
        error: error.message
      });
    }
  }

  // Update driver status
  static async updateDriverStatus(req: Request, res: Response) {
    try {
      const { driverId } = req.params;
      const { status } = req.body;
      const companyId = req.user?.company_id;

      await db.execute(
        'UPDATE users SET status = ? WHERE id = ? AND company_id = ? AND role = "driver"',
        [status, driverId, companyId]
      );

      res.json({
        success: true,
        message: 'Driver status updated successfully'
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to update driver status',
        error: error.message
      });
    }
  }
}