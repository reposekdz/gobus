

import { pool } from '../../config/db';
import { AppError } from '../../utils/AppError';
import { io } from '../../server';
import * as mysql from 'mysql2/promise';

interface TripQuery {
    from: string;
    to: string;
    date: string;
    companyId?: string;
}

// Function to get available seats for multiple trips efficiently
async function getAvailableSeatsForTrips(tripIds: number[]) {
    if (tripIds.length === 0) {
        return {};
    }
    const placeholders = tripIds.map(() => '?').join(',');
    const [seatCounts] = await pool.query(`
        SELECT t.id as trip_id, b.capacity, COUNT(s.id) as booked_seats
        FROM trips t
        JOIN buses b ON t.bus_id = b.id
        LEFT JOIN seats s ON t.id = s.trip_id
        WHERE t.id IN (${placeholders})
        GROUP BY t.id, b.capacity
    `, tripIds);

    const availableSeatsMap: { [key: number]: number } = {};
    (seatCounts as any[]).forEach(row => {
        availableSeatsMap[row.trip_id] = row.capacity - row.booked_seats;
    });
    return availableSeatsMap;
}


export const findTrips = async (query: TripQuery) => {
    const { from, to, date, companyId } = query;

    if (!from || !to || !date) {
        throw new AppError('Please provide from, to, and date query parameters.', 400);
    }
    
    let sql = `
        SELECT 
            t.id, t.departure_time, t.arrival_time,
            r.base_price, r.estimated_duration_minutes,
            c.name as company_name, c.logo_url,
            b.model, b.amenities,
            d.name as driver_name, d.avatar_url as driver_avatar_url
        FROM trips t
        JOIN routes r ON t.route_id = r.id
        JOIN companies c ON r.company_id = c.id
        JOIN buses b ON t.bus_id = b.id
        JOIN users d ON t.driver_id = d.id
        WHERE r.origin = ? AND r.destination = ? AND DATE(t.departure_time) = ? AND t.status = 'Scheduled'
    `;
    const params: (string|number)[] = [from, to, date];

    if (companyId) {
        sql += ' AND c.id = ?';
        params.push(companyId);
    }
    
    const [trips] = await pool.query(sql, params);

    const tripIds = (trips as any[]).map(t => t.id);
    const availableSeatsMap = await getAvailableSeatsForTrips(tripIds);

    // Re-structure data to match frontend expectations
    const formattedTrips = (trips as any[]).map(trip => ({
        _id: trip.id,
        departureTime: trip.departure_time,
        arrivalTime: trip.arrival_time,
        availableSeats: availableSeatsMap[trip.id] || 0,
        route: {
            basePrice: trip.base_price,
            estimatedDurationMinutes: trip.estimated_duration_minutes,
            company: {
                name: trip.company_name,
                logoUrl: trip.logo_url,
            }
        },
        bus: {
            model: trip.model,
            amenities: trip.amenities ? (trip.amenities as string).split(',') : [],
        },
        driver: {
            name: trip.driver_name,
            avatarUrl: trip.driver_avatar_url,
        },
        seatMap: {} // To match the old structure, will be populated on detail view
    }));


    return formattedTrips;
};

export const findTripById = async (id: string) => {
    const [rows] = await pool.query(`
        SELECT 
            t.id, t.departure_time, t.arrival_time, t.status,
            r.origin, r.destination, r.base_price,
            b.id as bus_id, b.capacity,
            c.name as company_name
        FROM trips t
        JOIN routes r ON t.route_id = r.id
        JOIN buses b ON t.bus_id = b.id
        JOIN companies c ON r.company_id = c.id
        WHERE t.id = ?
    `, [id]);
    
    if ((rows as any[]).length === 0) {
        throw new AppError('Trip not found', 404);
    }
    const trip = (rows as any)[0];
    
    const [bookedSeats] = await pool.query('SELECT seat_number FROM seats WHERE trip_id = ?', [id]);
    const bookedSeatSet = new Set((bookedSeats as any[]).map(s => s.seat_number));

    const seatMap: { [key: string]: string } = {};
    for (let i = 1; i <= Math.ceil(trip.capacity / 4); i++) {
        for (const char of ['A', 'B', 'C', 'D']) {
             // Don't create more seats than capacity
            if (Object.keys(seatMap).length >= trip.capacity) break;
            const seatId = `${i}${char}`;
            seatMap[seatId] = bookedSeatSet.has(seatId) ? 'occupied' : 'available';
        }
    }
    
    // Re-structure to match frontend expectations
    return {
        _id: trip.id,
        departureTime: trip.departure_time,
        seatMap: seatMap,
        route: {
            from: trip.origin,
            to: trip.destination,
            basePrice: trip.base_price,
            company: { name: trip.company_name }
        },
        bus: { capacity: trip.capacity }
    };
};


interface BoardingData {
    driverId: number;
    tripId: string;
    ticketId: string;
}

export const confirmPassengerBoarding = async (data: BoardingData) => {
    const { driverId, tripId, ticketId } = data;

    const [bookingRows] = await pool.query<any[] & mysql.RowDataPacket[]>(`
        SELECT b.id, b.status, u.id as passenger_id, u.name as passenger_name, GROUP_CONCAT(s.seat_number) as seats
        FROM bookings b
        JOIN users u ON b.user_id = u.id
        JOIN seats s ON b.id = s.booking_id
        WHERE b.booking_id = ? AND b.trip_id = ?
        GROUP BY b.id, u.id, u.name
    `, [ticketId, tripId]);

    if (bookingRows.length === 0) {
        throw new AppError('Invalid ticket ID for this trip.', 404);
    }
    const booking = bookingRows[0];

    if (booking.status === 'Completed') {
        throw new AppError(`${booking.passenger_name} has already boarded.`, 409);
    }
    
    const [tripRows] = await pool.query<any[] & mysql.RowDataPacket[]>(`
        SELECT t.driver_id, r.origin, r.destination 
        FROM trips t
        JOIN routes r ON t.route_id = r.id
        WHERE t.id = ?
    `, [tripId]);
    if (tripRows.length === 0 || tripRows[0].driver_id !== driverId) {
        throw new AppError('You are not authorized to manage this trip.', 403);
    }
    const trip = tripRows[0];
    
    await pool.query('UPDATE bookings SET status = "Completed" WHERE id = ?', [booking.id]);
    
    // Log the boarding action
    await pool.query(
        'INSERT INTO boardings (booking_id, trip_id, driver_id) VALUES (?, ?, ?)',
        [booking.id, tripId, driverId]
    );

    // Emit a real-time notification to the driver's room for this trip
    io.to(`trip:${tripId}`).emit('passengerBoarded', {
        bookingId: booking.id, // Use the internal booking ID for updates
        newStatus: 'Completed',
    });

    // Also emit a notification to the specific passenger
    const notificationMessage = `Welcome, ${booking.passenger_name}! You have successfully boarded the bus for ${trip.origin} to ${trip.destination}.`;
    io.to(booking.passenger_id.toString()).emit('passengerBoarded', {
        message: notificationMessage,
        route: `${trip.origin} to ${trip.destination}`
    });

    return {
        passengerName: booking.passenger_name,
        seat: booking.seats,
    };
};

const checkTripAuthorization = async (tripId: string, driverId: number) => {
    const [tripRows] = await pool.query<any[] & mysql.RowDataPacket[]>('SELECT driver_id, status FROM trips WHERE id = ?', [tripId]);
    if (tripRows.length === 0) throw new AppError('Trip not found.', 404);
    if (tripRows[0].driver_id !== driverId) throw new AppError('You are not authorized to manage this trip.', 403);
    return tripRows[0];
};

export const getManifestForTrip = async (tripId: string, driverId: number) => {
    await checkTripAuthorization(tripId, driverId);
    const [rows] = await pool.query<any[] & mysql.RowDataPacket[]>(`
        SELECT u.name as passenger_name, b.status, b.id as booking_id, GROUP_CONCAT(s.seat_number) as seats
        FROM bookings b
        JOIN users u ON b.user_id = u.id
        JOIN seats s ON b.id = s.booking_id
        WHERE b.trip_id = ?
        GROUP BY b.id
        ORDER BY u.name
    `, [tripId]);
    return rows;
};

export const departTrip = async (tripId: string, driverId: number) => {
    const trip = await checkTripAuthorization(tripId, driverId);
    if (trip.status !== 'Scheduled') {
        throw new AppError(`Trip cannot depart. Current status: ${trip.status}`, 400);
    }
    await pool.query('UPDATE trips SET status = "Departed" WHERE id = ?', [tripId]);
};

export const arriveTrip = async (tripId: string, driverId: number) => {
    const trip = await checkTripAuthorization(tripId, driverId);
    if (trip.status !== 'Departed') {
        throw new AppError(`Trip cannot arrive. Current status: ${trip.status}`, 400);
    }
    await pool.query('UPDATE trips SET status = "Arrived" WHERE id = ?', [tripId]);
};