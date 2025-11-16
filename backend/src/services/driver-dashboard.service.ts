import { pool } from '../config/db';
import { AppError } from '../utils/AppError';
import logger from '../utils/logger';
import * as mysql from 'mysql2/promise';

/**
 * Driver Dashboard Service
 * Manages driver view of passengers, seats, and boarding confirmations
 */

export class DriverDashboardService {
  /**
   * Get driver's assigned trips with passenger bookings
   */
  static async getDriverTrips(driverId: number, filters?: {
    status?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<any[]> {
    try {
      let query = `
        SELECT 
          t.*,
          r.name as route_name, r.from_city_id, r.to_city_id,
          b.plate_number, b.model, b.capacity,
          c.name as company_name,
          COUNT(DISTINCT bk.id) as total_bookings,
          COUNT(DISTINCT CASE WHEN bk.status = 'confirmed' THEN bk.id END) as confirmed_bookings
        FROM trips t
        JOIN routes r ON t.route_id = r.id
        JOIN buses b ON t.bus_id = b.id
        JOIN companies c ON t.company_id = c.id
        LEFT JOIN bookings bk ON t.id = bk.trip_id
        WHERE t.driver_id = ?
      `;

      const params: any[] = [driverId];

      if (filters?.status) {
        query += ` AND t.status = ?`;
        params.push(filters.status);
      }

      if (filters?.dateFrom) {
        query += ` AND DATE(t.departure_time) >= ?`;
        params.push(filters.dateFrom);
      }

      if (filters?.dateTo) {
        query += ` AND DATE(t.departure_time) <= ?`;
        params.push(filters.dateTo);
      }

      query += ` GROUP BY t.id ORDER BY t.departure_time ASC`;

      const [trips] = await pool.execute<mysql.RowDataPacket[]>(query, params);

      return trips;
    } catch (error: any) {
      logger.error('Error getting driver trips', {
        error: error.message,
        driverId
      });
      throw new AppError('Failed to retrieve trips', 500);
    }
  }

  /**
   * Get passengers for a specific trip with seat information
   */
  static async getTripPassengers(tripId: number, driverId: number): Promise<any[]> {
    try {
      // Verify trip belongs to driver
      const [trips] = await pool.execute<mysql.RowDataPacket[]>(
        `SELECT id, driver_id, bus_id, route_id FROM trips WHERE id = ?`,
        [tripId]
      );

      if (!trips.length) {
        throw new AppError('Trip not found', 404);
      }

      const trip = trips[0];

      // Verify driver
      const [drivers] = await pool.execute<mysql.RowDataPacket[]>(
        `SELECT d.id FROM drivers d WHERE d.user_id = ? AND d.id = ?`,
        [driverId, trip.driver_id]
      );

      if (!drivers.length && trip.driver_id !== driverId) {
        throw new AppError('Trip does not belong to this driver', 403);
      }

      // Get all bookings with passenger info and seat numbers
      const [bookings] = await pool.execute<mysql.RowDataPacket[]>(
        `SELECT 
          bk.*,
          u.name as passenger_name,
          u.phone as passenger_phone,
          u.email as passenger_email,
          u.serial_code as passenger_serial_code,
          dpc.check_in_status,
          dpc.check_in_time,
          dpc.notes as check_in_notes
         FROM bookings bk
         JOIN users u ON bk.user_id = u.id
         LEFT JOIN driver_passenger_checkins dpc ON bk.id = dpc.booking_id AND dpc.trip_id = ?
         WHERE bk.trip_id = ? AND bk.status = 'confirmed'
         ORDER BY JSON_EXTRACT(bk.seat_numbers, '$[0]') ASC`,
        [tripId, tripId]
      );

      // Parse seat numbers and organize by seat
      const passengersBySeat: Record<string, any> = {};
      
      bookings.forEach((booking: any) => {
        const seatNumbers = JSON.parse(booking.seat_numbers || '[]');
        seatNumbers.forEach((seatNumber: string) => {
          if (!passengersBySeat[seatNumber]) {
            passengersBySeat[seatNumber] = [];
          }
          passengersBySeat[seatNumber].push({
            bookingId: booking.id,
            bookingReference: booking.booking_reference,
            passengerName: booking.passenger_name,
            passengerPhone: booking.passenger_phone,
            passengerEmail: booking.passenger_email,
            passengerSerialCode: booking.passenger_serial_code,
            seatNumber,
            checkInStatus: booking.check_in_status || 'pending',
            checkInTime: booking.check_in_time,
            checkInNotes: booking.check_in_notes,
            totalAmount: booking.total_amount,
            paymentStatus: booking.payment_status
          });
        });
      });

      return Object.keys(passengersBySeat).sort().map(seatNumber => ({
        seatNumber,
        passengers: passengersBySeat[seatNumber]
      }));
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Error getting trip passengers', {
        error: error.message,
        tripId,
        driverId
      });
      throw new AppError('Failed to retrieve passengers', 500);
    }
  }

  /**
   * Get seat map for a trip showing all booked seats
   */
  static async getTripSeatMap(tripId: number, driverId: number): Promise<{
    totalSeats: number;
    availableSeats: number;
    bookedSeats: string[];
    seatDetails: Record<string, any>;
  }> {
    try {
      // Verify trip belongs to driver
      const [trips] = await pool.execute<mysql.RowDataPacket[]>(
        `SELECT t.id, t.bus_id, t.driver_id, t.total_seats, t.available_seats, b.capacity
         FROM trips t
         JOIN buses b ON t.bus_id = b.id
         WHERE t.id = ?`,
        [tripId]
      );

      if (!trips.length) {
        throw new AppError('Trip not found', 404);
      }

      const trip = trips[0];

      // Verify driver
      if (trip.driver_id !== driverId) {
        throw new AppError('Trip does not belong to this driver', 403);
      }

      // Get all booked seats
      const [bookings] = await pool.execute<mysql.RowDataPacket[]>(
        `SELECT 
          bk.id, bk.booking_reference, bk.seat_numbers,
          u.name as passenger_name, u.phone as passenger_phone,
          dpc.check_in_status
         FROM bookings bk
         JOIN users u ON bk.user_id = u.id
         LEFT JOIN driver_passenger_checkins dpc ON bk.id = dpc.booking_id
         WHERE bk.trip_id = ? AND bk.status = 'confirmed'`,
        [tripId]
      );

      const bookedSeats: string[] = [];
      const seatDetails: Record<string, any> = {};
      const totalSeats = trip.total_seats || trip.capacity;

      bookings.forEach((booking: any) => {
        const seatNumbers = JSON.parse(booking.seat_numbers || '[]');
        seatNumbers.forEach((seatNumber: string) => {
          if (!bookedSeats.includes(seatNumber)) {
            bookedSeats.push(seatNumber);
          }
          
          if (!seatDetails[seatNumber]) {
            seatDetails[seatNumber] = [];
          }

          seatDetails[seatNumber].push({
            bookingId: booking.id,
            bookingReference: booking.booking_reference,
            passengerName: booking.passenger_name,
            passengerPhone: booking.passenger_phone,
            checkInStatus: booking.check_in_status || 'pending'
          });
        });
      });

      return {
        totalSeats,
        availableSeats: totalSeats - bookedSeats.length,
        bookedSeats: bookedSeats.sort(),
        seatDetails
      };
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Error getting seat map', {
        error: error.message,
        tripId,
        driverId
      });
      throw new AppError('Failed to retrieve seat map', 500);
    }
  }

  /**
   * Confirm passenger boarding (check-in)
   */
  static async confirmBoarding(params: {
    tripId: number;
    driverId: number;
    bookingId: number;
    checkInStatus: 'checked_in' | 'no_show' | 'cancelled';
    notes?: string;
  }): Promise<void> {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Verify trip belongs to driver
      const [trips] = await connection.execute<mysql.RowDataPacket[]>(
        `SELECT id, driver_id FROM trips WHERE id = ?`,
        [params.tripId]
      );

      if (!trips.length) {
        throw new AppError('Trip not found', 404);
      }

      if (trips[0].driver_id !== params.driverId) {
        throw new AppError('Trip does not belong to this driver', 403);
      }

      // Verify booking exists and belongs to trip
      const [bookings] = await connection.execute<mysql.RowDataPacket[]>(
        `SELECT id, trip_id, seat_numbers, status FROM bookings WHERE id = ? AND trip_id = ?`,
        [params.bookingId, params.tripId]
      );

      if (!bookings.length) {
        throw new AppError('Booking not found for this trip', 404);
      }

      const booking = bookings[0];
      const seatNumbers = JSON.parse(booking.seat_numbers || '[]');

      // Check if check-in already exists
      const [existingCheckins] = await connection.execute<mysql.RowDataPacket[]>(
        `SELECT id FROM driver_passenger_checkins
         WHERE trip_id = ? AND booking_id = ?`,
        [params.tripId, params.bookingId]
      );

      if (existingCheckins.length > 0) {
        // Update existing check-in
        await connection.execute(
          `UPDATE driver_passenger_checkins
           SET check_in_status = ?,
               check_in_time = CASE WHEN ? = 'checked_in' THEN NOW() ELSE check_in_time END,
               notes = ?,
               updated_at = NOW()
           WHERE trip_id = ? AND booking_id = ?`,
          [
            params.checkInStatus,
            params.checkInStatus,
            params.notes || null,
            params.tripId,
            params.bookingId
          ]
        );
      } else {
        // Create new check-in
        await connection.execute(
          `INSERT INTO driver_passenger_checkins (
            trip_id, driver_id, booking_id,
            passenger_name, seat_number,
            check_in_status, check_in_time, notes,
            created_at, updated_at
          ) VALUES (
            ?, ?, ?,
            (SELECT name FROM users WHERE id = (SELECT user_id FROM bookings WHERE id = ?)),
            ?,
            ?, ?, ?,
            NOW(), NOW()
          )`,
          [
            params.tripId,
            params.driverId,
            params.bookingId,
            params.bookingId,
            seatNumbers[0] || 'N/A',
            params.checkInStatus,
            params.checkInStatus === 'checked_in' ? new Date() : null,
            params.notes || null
          ]
        );
      }

      // Update booking status if checked in
      if (params.checkInStatus === 'checked_in') {
        await connection.execute(
          `UPDATE bookings SET status = 'checked_in', updated_at = NOW() WHERE id = ?`,
          [params.bookingId]
        );
      }

      await connection.commit();

      logger.info('Boarding confirmed', {
        tripId: params.tripId,
        driverId: params.driverId,
        bookingId: params.bookingId,
        checkInStatus: params.checkInStatus
      });
    } catch (error: any) {
      await connection.rollback();
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Error confirming boarding', {
        error: error.message,
        params
      });
      throw new AppError('Failed to confirm boarding', 500);
    } finally {
      connection.release();
    }
  }

  /**
   * Get driver statistics
   */
  static async getDriverStats(driverId: number): Promise<{
    totalTrips: number;
    totalPassengers: number;
    completedTrips: number;
    upcomingTrips: number;
    averageRating: number;
  }> {
    try {
      const [stats] = await pool.execute<mysql.RowDataPacket[]>(
        `SELECT 
          COUNT(DISTINCT t.id) as total_trips,
          COUNT(DISTINCT CASE WHEN t.status = 'completed' THEN t.id END) as completed_trips,
          COUNT(DISTINCT CASE WHEN t.status IN ('scheduled', 'boarding') AND t.departure_time > NOW() THEN t.id END) as upcoming_trips,
          COUNT(DISTINCT bk.id) as total_passengers,
          AVG(d.rating) as average_rating
         FROM drivers d
         JOIN trips t ON d.id = t.driver_id
         LEFT JOIN bookings bk ON t.id = bk.trip_id AND bk.status = 'confirmed'
         WHERE d.user_id = ?`,
        [driverId]
      );

      return {
        totalTrips: parseInt(stats[0].total_trips || '0'),
        totalPassengers: parseInt(stats[0].total_passengers || '0'),
        completedTrips: parseInt(stats[0].completed_trips || '0'),
        upcomingTrips: parseInt(stats[0].upcoming_trips || '0'),
        averageRating: parseFloat(stats[0].average_rating || '0')
      };
    } catch (error: any) {
      logger.error('Error getting driver stats', {
        error: error.message,
        driverId
      });
      throw new AppError('Failed to retrieve driver statistics', 500);
    }
  }
}
