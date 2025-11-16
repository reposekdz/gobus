import { pool } from '../config/db';
import { AppError } from '../utils/AppError';
import logger from '../utils/logger';
import * as mysql from 'mysql2/promise';
import { v4 as uuidv4 } from 'uuid';

/**
 * Company Assignment Service
 * Manages company-car-driver assignments based on routes and bus stations
 */

interface BusDriverAssignmentParams {
  companyId: number;
  busId: number;
  driverId: number;
  routeId?: number;
  busStationId?: number;
  assignmentType: 'route' | 'station' | 'general';
  startDate: string;
  endDate?: string;
  notes?: string;
  assignedBy: number;
}

export class CompanyAssignmentService {
  /**
   * Assign bus and driver based on route or station
   */
  static async assignBusDriver(params: BusDriverAssignmentParams): Promise<{
    assignmentId: number;
    message: string;
  }> {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Verify bus belongs to company
      const [buses] = await connection.execute<mysql.RowDataPacket[]>(
        `SELECT id, plate_number, status FROM buses WHERE id = ? AND company_id = ?`,
        [params.busId, params.companyId]
      );

      if (!buses.length) {
        throw new AppError('Bus not found or does not belong to your company', 404);
      }

      const bus = buses[0];
      if (bus.status !== 'active') {
        throw new AppError('Bus is not active', 400);
      }

      // Verify driver belongs to company
      const [drivers] = await connection.execute<mysql.RowDataPacket[]>(
        `SELECT d.id, d.status, u.name as driver_name
         FROM drivers d
         JOIN users u ON d.user_id = u.id
         WHERE d.id = ? AND d.company_id = ?`,
        [params.driverId, params.companyId]
      );

      if (!drivers.length) {
        throw new AppError('Driver not found or does not belong to your company', 404);
      }

      const driver = drivers[0];
      if (driver.status !== 'active') {
        throw new AppError('Driver is not active', 400);
      }

      // Verify route if provided
      if (params.routeId) {
        const [routes] = await connection.execute<mysql.RowDataPacket[]>(
          `SELECT id, name FROM routes WHERE id = ? AND company_id = ?`,
          [params.routeId, params.companyId]
        );

        if (!routes.length) {
          throw new AppError('Route not found or does not belong to your company', 404);
        }
      }

      // Verify bus station if provided
      if (params.busStationId) {
        const [stations] = await connection.execute<mysql.RowDataPacket[]>(
          `SELECT id, name FROM bus_stations WHERE id = ? AND is_active = 1`,
          [params.busStationId]
        );

        if (!stations.length) {
          throw new AppError('Bus station not found or inactive', 404);
        }
      }

      // Check for existing active assignments
      const [existingAssignments] = await connection.execute<mysql.RowDataPacket[]>(
        `SELECT id FROM bus_driver_assignments
         WHERE bus_id = ? AND status = 'active'
         AND (end_date IS NULL OR end_date >= CURDATE())`,
        [params.busId]
      );

      if (existingAssignments.length > 0) {
        throw new AppError('Bus already has an active assignment', 409);
      }

      // Create assignment
      const [result] = await connection.execute<mysql.ResultSetHeader>(
        `INSERT INTO bus_driver_assignments (
          company_id, bus_id, driver_id, route_id, bus_station_id,
          assignment_type, start_date, end_date, status, assigned_by, notes,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, NOW(), NOW())`,
        [
          params.companyId,
          params.busId,
          params.driverId,
          params.routeId || null,
          params.busStationId || null,
          params.assignmentType,
          params.startDate,
          params.endDate || null,
          params.assignedBy,
          params.notes || null
        ]
      );

      const assignmentId = result.insertId;

      // Update bus status
      await connection.execute(
        `UPDATE buses SET status = 'assigned', updated_at = NOW() WHERE id = ?`,
        [params.busId]
      );

      await connection.commit();

      logger.info('Bus-driver assignment created', {
        assignmentId,
        companyId: params.companyId,
        busId: params.busId,
        driverId: params.driverId,
        routeId: params.routeId,
        assignmentType: params.assignmentType
      });

      return {
        assignmentId,
        message: `Successfully assigned ${bus.plate_number} to ${driver.driver_name}`
      };
    } catch (error: any) {
      await connection.rollback();
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Error creating bus-driver assignment', {
        error: error.message,
        params
      });
      throw new AppError('Failed to create assignment', 500);
    } finally {
      connection.release();
    }
  }

  /**
   * Get assignments for a company
   */
  static async getAssignments(companyId: number, filters?: {
    status?: 'active' | 'completed' | 'cancelled';
    assignmentType?: 'route' | 'station' | 'general';
    routeId?: number;
    busStationId?: number;
  }): Promise<any[]> {
    try {
      let query = `
        SELECT 
          bda.*,
          b.plate_number, b.model, b.capacity,
          d.id as driver_id, u.name as driver_name, u.phone as driver_phone,
          r.name as route_name, r.from_city_id, r.to_city_id,
          bs.name as station_name, bs.address as station_address,
          assigner.name as assigned_by_name
        FROM bus_driver_assignments bda
        JOIN buses b ON bda.bus_id = b.id
        JOIN drivers d ON bda.driver_id = d.id
        JOIN users u ON d.user_id = u.id
        LEFT JOIN routes r ON bda.route_id = r.id
        LEFT JOIN bus_stations bs ON bda.bus_station_id = bs.id
        LEFT JOIN users assigner ON bda.assigned_by = assigner.id
        WHERE bda.company_id = ?
      `;

      const params: any[] = [companyId];

      if (filters?.status) {
        query += ` AND bda.status = ?`;
        params.push(filters.status);
      }

      if (filters?.assignmentType) {
        query += ` AND bda.assignment_type = ?`;
        params.push(filters.assignmentType);
      }

      if (filters?.routeId) {
        query += ` AND bda.route_id = ?`;
        params.push(filters.routeId);
      }

      if (filters?.busStationId) {
        query += ` AND bda.bus_station_id = ?`;
        params.push(filters.busStationId);
      }

      query += ` ORDER BY bda.created_at DESC`;

      const [assignments] = await pool.execute<mysql.RowDataPacket[]>(query, params);

      return assignments;
    } catch (error: any) {
      logger.error('Error getting assignments', {
        error: error.message,
        companyId,
        filters
      });
      throw new AppError('Failed to retrieve assignments', 500);
    }
  }

  /**
   * Cancel assignment
   */
  static async cancelAssignment(assignmentId: number, companyId: number, cancelledBy: number): Promise<void> {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Verify assignment belongs to company
      const [assignments] = await connection.execute<mysql.RowDataPacket[]>(
        `SELECT bus_id, status FROM bus_driver_assignments
         WHERE id = ? AND company_id = ?`,
        [assignmentId, companyId]
      );

      if (!assignments.length) {
        throw new AppError('Assignment not found', 404);
      }

      const assignment = assignments[0];

      if (assignment.status !== 'active') {
        throw new AppError('Assignment is not active', 400);
      }

      // Update assignment status
      await connection.execute(
        `UPDATE bus_driver_assignments
         SET status = 'cancelled', end_date = CURDATE(), updated_at = NOW()
         WHERE id = ?`,
        [assignmentId]
      );

      // Update bus status
      await connection.execute(
        `UPDATE buses SET status = 'active', updated_at = NOW() WHERE id = ?`,
        [assignment.bus_id]
      );

      await connection.commit();

      logger.info('Assignment cancelled', {
        assignmentId,
        companyId,
        cancelledBy
      });
    } catch (error: any) {
      await connection.rollback();
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Error cancelling assignment', {
        error: error.message,
        assignmentId,
        companyId
      });
      throw new AppError('Failed to cancel assignment', 500);
    } finally {
      connection.release();
    }
  }
}
