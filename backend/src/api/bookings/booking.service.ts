import { pool } from '../../config/db';
import { AppError } from '../../utils/AppError';
import * as mysql from 'mysql2/promise';
import { verifyPin } from '../wallet/wallet.service';
import * as notificationService from '../notifications/notifications.service';
import logger from '../../utils/logger';

interface BookingDetails {
    tripId: string;
    seats: string[];
    paymentMethod: string;
    totalPrice: number;
    pin?: string;
}

export const createBooking = async (userId: number, details: BookingDetails) => {
    const { tripId, seats, paymentMethod, totalPrice, pin } = details;
    
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
        const [tripRows] = await connection.query<any[] & mysql.RowDataPacket[]>(`
            SELECT t.status, b.capacity, r.base_price 
            FROM trips t 
            JOIN buses b ON t.bus_id = b.id
            JOIN routes r ON t.route_id = r.id
            WHERE t.id = ? FOR UPDATE`, [tripId]); // Lock the trip row
        
        if (tripRows.length === 0) throw new AppError('Trip not found', 404);
        const trip = tripRows[0];
        if (trip.status !== 'Scheduled') throw new AppError('This trip is no longer available for booking', 400);

        // --- Critical Section: Check Seat Availability ---
        const [bookedSeats] = await connection.query('SELECT seat_number FROM seats WHERE trip_id = ?', [tripId]);
        const bookedSeatSet = new Set((bookedSeats as any[]).map(s => s.seat_number));

        for (const seat of seats) {
            if (bookedSeatSet.has(seat)) {
                throw new AppError(`Seat ${seat} is not available`, 409);
            }
        }
        
        // --- Payment Processing ---
        if (paymentMethod === 'wallet') {
            await verifyPin(userId, pin!);
            
            const [walletResult] = await connection.query<mysql.OkPacket>('UPDATE wallets SET balance = balance - ? WHERE user_id = ? AND balance >= ?', [totalPrice, userId, totalPrice]);
            if (walletResult.affectedRows === 0) {
                throw new AppError('Insufficient wallet balance', 400);
            }
            
            // Log wallet transaction
            const [walletRows] = await connection.query<any[] & mysql.RowDataPacket[]>('SELECT id FROM wallets WHERE user_id = ?', [userId]);
            const walletId = walletRows[0].id;
            await connection.query(
                'INSERT INTO wallet_transactions (wallet_id, amount, type, description) VALUES (?, ?, ?, ?)',
                [walletId, -totalPrice, 'purchase', `Ticket purchase for trip #${tripId}`]
            );

        }
        // Other payment methods like 'momo' are handled client-side first, then confirmed here.

        const bookingId = `GB-${Date.now().toString().slice(-6)}`;
        const [bookingResult] = await connection.query<mysql.ResultSetHeader>(
            'INSERT INTO bookings (user_id, trip_id, booking_id, total_price, status, payment_method) VALUES (?, ?, ?, ?, ?, ?)',
            [userId, tripId, bookingId, totalPrice, 'Confirmed', paymentMethod]
        );
        const newBookingId = bookingResult.insertId;

        const seatInsertPromises = seats.map(seat => 
            connection.query('INSERT INTO seats (booking_id, trip_id, seat_number) VALUES (?, ?, ?)', [newBookingId, tripId, seat])
        );
        await Promise.all(seatInsertPromises);

        // --- Award Loyalty Points ---
        const pointsEarned = Math.floor(totalPrice / 100); // 1 point for every 100 RWF
        if (pointsEarned > 0) {
            await connection.query('UPDATE users SET loyalty_points = loyalty_points + ? WHERE id = ?', [pointsEarned, userId]);
            await connection.query(
                'INSERT INTO loyalty_transactions (user_id, points, type, description, related_booking_id) VALUES (?, ?, ?, ?, ?)',
                [userId, pointsEarned, 'earn', `Earned from trip #${tripId}`, newBookingId]
            );
        }

        await connection.commit();

        // Send push notification after successful booking
        try {
            await notificationService.sendNotification(userId, {
                title: 'Booking Confirmed!',
                body: `Your ticket for trip #${tripId} has been booked successfully.`,
                data: { bookingId: newBookingId, screen: 'TicketDetails' } // For deep linking on mobile
            });
        } catch (notificationError) {
            // Don't fail the booking if notification fails. Just log it.
            logger.error(`Failed to send booking confirmation notification for user ${userId}:`, notificationError);
        }
        
        return {
            bookingId: bookingId,
            seats: seats,
            totalPrice: totalPrice,
            createdAt: new Date().toISOString()
        };

    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

export const getBookingsForUser = async (userId: number) => {
    const [rows] = await pool.query(`
        SELECT 
            b.id as _id, b.booking_id as bookingId, b.total_price as totalPrice, b.created_at as createdAt,
            GROUP_CONCAT(s.seat_number) as seats,
            t.departure_time as departureTime, t.arrival_time as arrivalTime,
            r.origin, r.destination,
            c.name as company_name
        FROM bookings b
        JOIN trips t ON b.trip_id = t.id
        JOIN routes r ON t.route_id = r.id
        JOIN companies c ON r.company_id = c.id
        JOIN seats s ON b.id = s.booking_id
        WHERE b.user_id = ?
        GROUP BY b.id
        ORDER BY t.departure_time DESC
    `, [userId]);
    
    // Re-structure to match frontend expectations
    return (rows as any[]).map(row => ({
        _id: row._id,
        bookingId: row.bookingId,
        totalPrice: row.totalPrice,
        seats: row.seats.split(','),
        trip: {
            departureTime: row.departureTime,
            arrivalTime: row.arrivalTime,
            route: {
                from: row.origin,
                to: row.destination,
                company: {
                    name: row.company_name
                }
            }
        }
    }));
};