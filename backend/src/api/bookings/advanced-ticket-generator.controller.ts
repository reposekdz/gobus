import { Request, Response } from 'express';
import QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../../config/database';
import { logger } from '../../utils/logger';
import sharp from 'sharp';
import { sendEmail } from '../../services/email.service';

interface TicketData {
  booking_id: string;
  passenger_name: string;
  trip_id: string;
  route: string;
  departure_time: string;
  seat_numbers: string[];
  company_info: {
    name: string;
    logo_url?: string;
    primary_color: string;
    secondary_color: string;
  };
  qr_data: {
    ticket_id: string;
    booking_reference: string;
    verification_code: string;
  };
}

export class AdvancedTicketGeneratorController {
  // Generate interactive ticket with QR code
  static async generateTicket(req: Request, res: Response) {
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();
      
      const { bookingId } = req.params;
      const userId = req.user?.id;

      // Get booking details with company branding
      const [bookingData] = await connection.execute(`
        SELECT 
          bk.id as booking_id,
          bk.booking_reference,
          bk.seat_numbers,
          bk.passenger_count,
          bk.total_amount,
          bk.status,
          u.name as passenger_name,
          u.email as passenger_email,
          u.phone as passenger_phone,
          t.id as trip_id,
          t.departure_time,
          t.arrival_time,
          t.status as trip_status,
          r.origin,
          r.destination,
          r.distance,
          r.estimated_duration,
          b.plate_number,
          b.model as bus_model,
          b.capacity,
          c.id as company_id,
          c.name as company_name,
          c.logo_url,
          c.primary_color,
          c.secondary_color,
          c.phone as company_phone,
          c.email as company_email
        FROM bookings bk
        JOIN users u ON bk.user_id = u.id
        JOIN trips t ON bk.trip_id = t.id
        JOIN routes r ON t.route_id = r.id
        JOIN buses b ON t.bus_id = b.id
        JOIN companies c ON bk.company_id = c.id
        WHERE bk.id = ? AND bk.user_id = ? AND bk.status IN ('confirmed', 'checked_in')
      `, [bookingId, userId]);

      if (!Array.isArray(bookingData) || bookingData.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Booking not found or not accessible'
        });
      }

      const booking = bookingData[0] as any;

      // Check if ticket already exists
      const [existingTicket] = await connection.execute(
        'SELECT id, ticket_number, qr_code FROM tickets WHERE booking_id = ?',
        [bookingId]
      );

      let ticketId: string;
      let ticketNumber: string;
      let qrCode: string;

      if (Array.isArray(existingTicket) && existingTicket.length > 0) {
        // Use existing ticket
        const ticket = existingTicket[0] as any;
        ticketId = ticket.id;
        ticketNumber = ticket.ticket_number;
        qrCode = ticket.qr_code;
      } else {
        // Generate new ticket
        ticketId = uuidv4();
        ticketNumber = `GB${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
        
        // Generate verification code
        const verificationCode = Math.random().toString(36).substr(2, 8).toUpperCase();
        
        // Create QR code data
        const qrData = {
          ticket_id: ticketId,
          booking_id: bookingId,
          booking_reference: booking.booking_reference,
          passenger_name: booking.passenger_name,
          trip_id: booking.trip_id,
          departure_time: booking.departure_time,
          seat_numbers: JSON.parse(booking.seat_numbers),
          company_id: booking.company_id,
          verification_code: verificationCode,
          generated_at: new Date().toISOString()
        };

        // Generate QR code
        qrCode = await QRCode.toDataURL(JSON.stringify(qrData), {
          errorCorrectionLevel: 'H',
          type: 'image/png',
          quality: 0.92,
          margin: 1,
          color: {
            dark: booking.primary_color || '#000000',
            light: '#FFFFFF'
          },
          width: 200
        });

        // Save ticket to database
        await connection.execute(`
          INSERT INTO tickets (
            id, booking_id, trip_id, company_id, ticket_number,
            qr_code, qr_data, verification_code, status, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', NOW(), NOW())
        `, [
          ticketId, bookingId, booking.trip_id, booking.company_id,
          ticketNumber, qrCode, JSON.stringify(qrData), verificationCode
        ]);
      }

      await connection.commit();

      logger.info(`Ticket generated: ${ticketId}`, {
        ticketId,
        bookingId,
        userId,
        companyId: booking.company_id
      });

      res.json({
        success: true,
        message: 'Ticket generated successfully',
        data: {
          ticket: {
            id: ticketId,
            ticket_number: ticketNumber,
            qr_code: qrCode,
            booking_reference: booking.booking_reference,
            passenger_name: booking.passenger_name,
            passenger_phone: booking.passenger_phone,
            trip: {
              origin: booking.origin,
              destination: booking.destination,
              departure_time: booking.departure_time,
              arrival_time: booking.arrival_time,
              bus_info: `${booking.bus_model} (${booking.plate_number})`
            },
            seat_numbers: JSON.parse(booking.seat_numbers),
            total_amount: booking.total_amount,
            company: {
              name: booking.company_name,
              logo_url: booking.logo_url,
              phone: booking.company_phone,
              primary_color: booking.primary_color,
              secondary_color: booking.secondary_color
            },
            status: 'active'
          }
        }
      });

    } catch (error) {
      await connection.rollback();
      logger.error('Error generating ticket:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate ticket',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    } finally {
      connection.release();
    }
  }

  // Verify ticket QR code
  static async verifyTicket(req: Request, res: Response) {
    try {
      const { qrData } = req.body;
      const scannerId = req.user?.id;

      let parsedData;
      try {
        parsedData = JSON.parse(qrData);
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: 'Invalid QR code format'
        });
      }

      const { ticket_id, verification_code } = parsedData;

      // Verify ticket exists and is valid
      const [ticketData] = await db.execute(`
        SELECT 
          t.*,
          bk.booking_reference,
          bk.status as booking_status,
          bk.seat_numbers,
          u.name as passenger_name,
          u.phone as passenger_phone,
          tr.departure_time,
          tr.status as trip_status,
          r.origin,
          r.destination,
          c.name as company_name
        FROM tickets t
        JOIN bookings bk ON t.booking_id = bk.id
        JOIN users u ON bk.user_id = u.id
        JOIN trips tr ON t.trip_id = tr.id
        JOIN routes r ON tr.route_id = r.id
        JOIN companies c ON t.company_id = c.id
        WHERE t.id = ? AND t.verification_code = ? AND t.status = 'active'
      `, [ticket_id, verification_code]);

      if (!Array.isArray(ticketData) || ticketData.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Invalid or expired ticket'
        });
      }

      const ticket = ticketData[0] as any;

      // Log verification
      await db.execute(`
        INSERT INTO ticket_verifications (
          id, ticket_id, verified_by, verification_time, verification_result, created_at
        ) VALUES (?, ?, ?, NOW(), 'valid', NOW())
      `, [uuidv4(), ticket_id, scannerId]);

      logger.info(`Ticket verified: ${ticket_id}`, {
        ticketId: ticket_id,
        scannerId,
        passengerName: ticket.passenger_name,
        tripId: ticket.trip_id
      });

      res.json({
        success: true,
        message: 'Ticket verified successfully',
        data: {
          ticket: {
            id: ticket_id,
            ticket_number: ticket.ticket_number,
            passenger_name: ticket.passenger_name,
            passenger_phone: ticket.passenger_phone,
            booking_reference: ticket.booking_reference,
            seat_numbers: JSON.parse(ticket.seat_numbers),
            trip: {
              origin: ticket.origin,
              destination: ticket.destination,
              departure_time: ticket.departure_time,
              status: ticket.trip_status
            },
            company_name: ticket.company_name,
            booking_status: ticket.booking_status
          },
          verification: {
            verified_at: new Date().toISOString(),
            verified_by: scannerId,
            status: 'valid'
          }
        }
      });

    } catch (error) {
      logger.error('Error verifying ticket:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to verify ticket',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Get user's tickets
  static async getUserTickets(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { status, page = 1, limit = 20 } = req.query;

      const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

      let whereClause = 'WHERE bk.user_id = ?';
      const params: any[] = [userId];

      if (status) {
        whereClause += ' AND t.status = ?';
        params.push(status);
      }

      const [tickets] = await db.execute(`
        SELECT 
          t.id,
          t.ticket_number,
          t.qr_code,
          t.status,
          t.created_at,
          bk.booking_reference,
          bk.seat_numbers,
          bk.total_amount,
          tr.departure_time,
          tr.arrival_time,
          tr.status as trip_status,
          r.origin,
          r.destination,
          b.plate_number,
          b.model as bus_model,
          c.name as company_name,
          c.logo_url,
          c.primary_color
        FROM tickets t
        JOIN bookings bk ON t.booking_id = bk.id
        JOIN trips tr ON t.trip_id = tr.id
        JOIN routes r ON tr.route_id = r.id
        JOIN buses b ON tr.bus_id = b.id
        JOIN companies c ON t.company_id = c.id
        ${whereClause}
        ORDER BY tr.departure_time DESC
        LIMIT ? OFFSET ?
      `, [...params, parseInt(limit as string), offset]);

      const [countResult] = await db.execute(`
        SELECT COUNT(DISTINCT t.id) as total
        FROM tickets t
        JOIN bookings bk ON t.booking_id = bk.id
        ${whereClause}
      `, params);

      const total = (countResult as any)[0].total;

      res.json({
        success: true,
        data: {
          tickets,
          pagination: {
            page: parseInt(page as string),
            limit: parseInt(limit as string),
            total,
            pages: Math.ceil(total / parseInt(limit as string))
          }
        }
      });

    } catch (error) {
      logger.error('Error fetching user tickets:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch tickets',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
}