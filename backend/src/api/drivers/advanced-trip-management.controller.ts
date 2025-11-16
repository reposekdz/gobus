import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../../config/database';
import { logger } from '../../utils/logger';
import { sendPushNotification } from '../../services/notification.service';

interface UpdateTripStatusRequest {
  status: 'scheduled' | 'boarding' | 'in_progress' | 'completed' | 'cancelled' | 'delayed';
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  notes?: string;
  delay_minutes?: number;
}

interface PassengerCheckInRequest {
  booking_id: string;
  seat_number: string;
  check_in_time?: string;
  notes?: string;
}

export class AdvancedTripManagementController {
  // Get driver's assigned trips
  static async getDriverTrips(req: Request, res: Response) {
    try {
      const driverId = req.user?.id;
      const { status, date, page = 1, limit = 20 } = req.query;

      const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

      let whereClause = 'WHERE t.driver_id = ?';
      const params: any[] = [driverId];

      if (status) {
        whereClause += ' AND t.status = ?';
        params.push(status);
      }

      if (date) {
        whereClause += ' AND DATE(t.departure_time) = ?';
        params.push(date);
      }

      const [trips] = await db.execute(`
        SELECT 
          t.*,
          r.origin, r.destination, r.distance, r.estimated_duration,
          b.plate_number, b.model, b.capacity,
          c.name as company_name,
          COUNT(DISTINCT bk.id) as total_bookings,
          COUNT(DISTINCT CASE WHEN bk.status = 'confirmed' THEN bk.id END) as confirmed_bookings,
          SUM(CASE WHEN bk.status = 'confirmed' THEN bk.total_amount ELSE 0 END) as total_revenue,
          AVG(rev.rating) as trip_rating
        FROM trips t
        JOIN routes r ON t.route_id = r.id
        JOIN buses b ON t.bus_id = b.id
        JOIN companies c ON t.company_id = c.id
        LEFT JOIN bookings bk ON t.id = bk.trip_id
        LEFT JOIN reviews rev ON t.id = rev.trip_id
        ${whereClause}
        GROUP BY t.id
        ORDER BY t.departure_time ASC
        LIMIT ? OFFSET ?
      `, [...params, parseInt(limit as string), offset]);

      const [countResult] = await db.execute(`
        SELECT COUNT(DISTINCT t.id) as total
        FROM trips t
        ${whereClause}
      `, params);

      const total = (countResult as any)[0].total;

      res.json({
        success: true,
        data: {
          trips,
          pagination: {
            page: parseInt(page as string),
            limit: parseInt(limit as string),
            total,
            pages: Math.ceil(total / parseInt(limit as string))
          }
        }
      });

    } catch (error) {
      logger.error('Error fetching driver trips:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch trips',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Get passengers for a specific trip
  static async getTripPassengers(req: Request, res: Response) {
    try {
      const { tripId } = req.params;
      const driverId = req.user?.id;

      // Verify trip belongs to driver
      const [tripCheck] = await db.execute(
        'SELECT id FROM trips WHERE id = ? AND driver_id = ?',
        [tripId, driverId]
      );

      if (!Array.isArray(tripCheck) || tripCheck.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Trip not found or not assigned to you'
        });
      }

      const [passengers] = await db.execute(`
        SELECT 
          bk.id as booking_id,
          bk.booking_reference,
          bk.seat_numbers,
          bk.passenger_count,
          bk.total_amount,
          bk.status as booking_status,
          bk.created_at as booking_time,
          u.name as passenger_name,
          u.phone as passenger_phone,
          u.email as passenger_email,
          pi.id_number,
          pi.emergency_contact_name,
          pi.emergency_contact_phone,
          pc.check_in_time,
          pc.check_in_status,
          pc.seat_number as checked_seat,
          pc.notes as check_in_notes,
          tk.qr_code,
          tk.ticket_number
        FROM bookings bk
        JOIN users u ON bk.user_id = u.id
        LEFT JOIN passenger_info pi ON bk.id = pi.booking_id
        LEFT JOIN passenger_checkins pc ON bk.id = pc.booking_id
        LEFT JOIN tickets tk ON bk.id = tk.booking_id
        WHERE bk.trip_id = ? AND bk.status IN ('confirmed', 'checked_in')
        ORDER BY bk.created_at ASC
      `, [tripId]);

      // Get trip summary
      const [tripSummary] = await db.execute(`
        SELECT 
          t.departure_time,
          t.arrival_time,
          t.status as trip_status,
          r.origin,
          r.destination,
          b.plate_number,
          b.capacity,
          COUNT(DISTINCT bk.id) as total_bookings,
          SUM(bk.passenger_count) as total_passengers,
          SUM(CASE WHEN pc.check_in_status = 'checked_in' THEN 1 ELSE 0 END) as checked_in_count
        FROM trips t
        JOIN routes r ON t.route_id = r.id
        JOIN buses b ON t.bus_id = b.id
        LEFT JOIN bookings bk ON t.id = bk.trip_id AND bk.status IN ('confirmed', 'checked_in')
        LEFT JOIN passenger_checkins pc ON bk.id = pc.booking_id
        WHERE t.id = ?
        GROUP BY t.id
      `, [tripId]);

      res.json({
        success: true,
        data: {
          trip_summary: tripSummary[0],
          passengers,
          stats: {
            total_passengers: passengers.length,
            checked_in: passengers.filter((p: any) => p.check_in_status === 'checked_in').length,
            pending_checkin: passengers.filter((p: any) => !p.check_in_status).length
          }
        }
      });

    } catch (error) {
      logger.error('Error fetching trip passengers:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch trip passengers',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Check in passenger
  static async checkInPassenger(req: Request, res: Response) {
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();
      
      const { tripId } = req.params;
      const { booking_id, seat_number, check_in_time, notes }: PassengerCheckInRequest = req.body;
      const driverId = req.user?.id;

      // Verify trip belongs to driver
      const [tripCheck] = await connection.execute(
        'SELECT id, status FROM trips WHERE id = ? AND driver_id = ?',
        [tripId, driverId]
      );

      if (!Array.isArray(tripCheck) || tripCheck.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Trip not found or not assigned to you'
        });
      }

      const trip = tripCheck[0] as any;

      if (!['scheduled', 'boarding'].includes(trip.status)) {
        return res.status(400).json({
          success: false,
          message: 'Cannot check in passengers for this trip status'
        });
      }

      // Verify booking exists and belongs to trip
      const [bookingCheck] = await connection.execute(`
        SELECT bk.id, bk.user_id, bk.seat_numbers, u.name, u.phone
        FROM bookings bk
        JOIN users u ON bk.user_id = u.id
        WHERE bk.id = ? AND bk.trip_id = ? AND bk.status = 'confirmed'
      `, [booking_id, tripId]);

      if (!Array.isArray(bookingCheck) || bookingCheck.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Booking not found or not confirmed'
        });
      }

      const booking = bookingCheck[0] as any;

      // Check if already checked in
      const [existingCheckin] = await connection.execute(
        'SELECT id FROM passenger_checkins WHERE booking_id = ?',
        [booking_id]
      );

      if (Array.isArray(existingCheckin) && existingCheckin.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'Passenger already checked in'
        });
      }

      // Create check-in record
      const checkinId = uuidv4();
      await connection.execute(`
        INSERT INTO passenger_checkins (
          id, booking_id, trip_id, driver_id, seat_number,
          check_in_time, check_in_status, notes, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, 'checked_in', ?, NOW(), NOW())
      `, [
        checkinId, booking_id, tripId, driverId, seat_number,
        check_in_time || new Date().toISOString(), notes
      ]);

      // Update booking status
      await connection.execute(
        'UPDATE bookings SET status = "checked_in", updated_at = NOW() WHERE id = ?',
        [booking_id]
      );

      await connection.commit();

      // Send notification to passenger
      await sendPushNotification({
        userId: booking.user_id,
        title: 'Check-in Confirmed',
        body: `You have been checked in for your trip. Seat: ${seat_number}`,
        data: {
          type: 'checkin_confirmed',
          trip_id: tripId,
          booking_id,
          seat_number
        }
      });

      logger.info(`Passenger checked in: ${booking_id}`, {
        bookingId: booking_id,
        tripId,
        driverId,
        passengerName: booking.name,
        seatNumber: seat_number
      });

      res.json({
        success: true,
        message: 'Passenger checked in successfully',
        data: {
          checkin_id: checkinId,
          passenger_name: booking.name,
          seat_number,
          check_in_time: check_in_time || new Date().toISOString()
        }
      });

    } catch (error) {
      await connection.rollback();
      logger.error('Error checking in passenger:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to check in passenger',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    } finally {
      connection.release();
    }
  }

  // Update trip status and location
  static async updateTripStatus(req: Request, res: Response) {
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();
      
      const { tripId } = req.params;
      const { status, location, notes, delay_minutes }: UpdateTripStatusRequest = req.body;
      const driverId = req.user?.id;

      // Verify trip belongs to driver
      const [tripCheck] = await connection.execute(
        'SELECT id, status as current_status FROM trips WHERE id = ? AND driver_id = ?',
        [tripId, driverId]
      );

      if (!Array.isArray(tripCheck) || tripCheck.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Trip not found or not assigned to you'
        });
      }

      const trip = tripCheck[0] as any;

      // Update trip status
      await connection.execute(`
        UPDATE trips SET 
          status = ?, 
          current_location = ?, 
          delay_minutes = ?,
          updated_at = NOW()
        WHERE id = ?
      `, [
        status,
        location ? JSON.stringify(location) : null,
        delay_minutes || 0,
        tripId
      ]);

      // Log status change
      await connection.execute(`
        INSERT INTO trip_status_logs (
          id, trip_id, old_status, new_status, location, notes,
          changed_by, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
      `, [
        uuidv4(), tripId, trip.current_status, status,
        location ? JSON.stringify(location) : null, notes, driverId
      ]);

      // Update arrival time if completed
      if (status === 'completed') {
        await connection.execute(
          'UPDATE trips SET actual_arrival_time = NOW() WHERE id = ?',
          [tripId]
        );
      }

      await connection.commit();

      // Get all passengers for notifications
      const [passengers] = await connection.execute(`
        SELECT DISTINCT bk.user_id, u.name
        FROM bookings bk
        JOIN users u ON bk.user_id = u.id
        WHERE bk.trip_id = ? AND bk.status IN ('confirmed', 'checked_in')
      `, [tripId]);

      // Send notifications to passengers
      const notificationPromises = (passengers as any[]).map(passenger => 
        sendPushNotification({
          userId: passenger.user_id,
          title: `Trip Status Update`,
          body: `Your trip status has been updated to: ${status}${delay_minutes ? ` (Delayed by ${delay_minutes} minutes)` : ''}`,
          data: {
            type: 'trip_status_update',
            trip_id: tripId,
            status,
            location,
            delay_minutes
          }
        })
      );

      await Promise.allSettled(notificationPromises);

      logger.info(`Trip status updated: ${tripId}`, {
        tripId,
        oldStatus: trip.current_status,
        newStatus: status,
        driverId,
        location,
        delayMinutes: delay_minutes
      });

      res.json({
        success: true,
        message: 'Trip status updated successfully',
        data: {
          trip_id: tripId,
          status,
          location,
          passengers_notified: passengers.length
        }
      });

    } catch (error) {
      await connection.rollback();
      logger.error('Error updating trip status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update trip status',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    } finally {
      connection.release();
    }
  }

  // Get driver dashboard summary
  static async getDriverDashboard(req: Request, res: Response) {
    try {
      const driverId = req.user?.id;
      const today = new Date().toISOString().split('T')[0];

      // Today's trips
      const [todayTrips] = await db.execute(`
        SELECT 
          COUNT(*) as total_trips,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_trips,
          SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as active_trips,
          SUM(CASE WHEN status = 'scheduled' THEN 1 ELSE 0 END) as upcoming_trips
        FROM trips 
        WHERE driver_id = ? AND DATE(departure_time) = ?
      `, [driverId, today]);

      // Current month stats
      const [monthlyStats] = await db.execute(`
        SELECT 
          COUNT(DISTINCT t.id) as total_trips,
          SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) as completed_trips,
          COUNT(DISTINCT bk.id) as total_bookings,
          SUM(CASE WHEN bk.status = 'confirmed' THEN bk.total_amount ELSE 0 END) as total_revenue,
          AVG(r.rating) as average_rating
        FROM trips t
        LEFT JOIN bookings bk ON t.id = bk.trip_id
        LEFT JOIN reviews r ON t.id = r.trip_id
        WHERE t.driver_id = ? AND MONTH(t.departure_time) = MONTH(NOW()) AND YEAR(t.departure_time) = YEAR(NOW())
      `, [driverId]);

      // Next trip
      const [nextTrip] = await db.execute(`
        SELECT 
          t.id, t.departure_time, t.status,
          r.origin, r.destination,
          b.plate_number,
          COUNT(bk.id) as passenger_count
        FROM trips t
        JOIN routes rt ON t.route_id = rt.id
        JOIN buses b ON t.bus_id = b.id
        LEFT JOIN bookings bk ON t.id = bk.trip_id AND bk.status IN ('confirmed', 'checked_in')
        WHERE t.driver_id = ? AND t.departure_time > NOW() AND t.status = 'scheduled'
        GROUP BY t.id
        ORDER BY t.departure_time ASC
        LIMIT 1
      `, [driverId]);

      // Wallet balance
      const [wallet] = await db.execute(
        'SELECT balance FROM driver_wallets WHERE driver_id = ?',
        [driverId]
      );

      res.json({
        success: true,
        data: {
          today: todayTrips[0],
          monthly: monthlyStats[0],
          next_trip: nextTrip[0] || null,
          wallet_balance: wallet[0]?.balance || 0
        }
      });

    } catch (error) {
      logger.error('Error fetching driver dashboard:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch dashboard data',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
}