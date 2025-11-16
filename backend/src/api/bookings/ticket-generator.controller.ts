import { Request, Response } from 'express';
import { pool } from '../../config/db';
import { catchAsync } from '../../middleware/error.middleware';
import QRCode from 'qrcode';
import * as mysql from 'mysql2/promise';

export const generateTicket = catchAsync(async (req: Request, res: Response) => {
    const { bookingId } = req.params;
    
    const [booking] = await pool.query<any[] & mysql.RowDataPacket[]>(`
        SELECT b.*, t.*, r.from_city_id, r.to_city_id,
               fc.name as from_city, tc.name as to_city,
               bu.plate_number, bu.model, bu.capacity,
               c.name as company_name, c.logo as company_logo,
               c.address as company_address, c.phone as company_phone,
               d.license_number as driver_license,
               u.name as driver_name, u.phone_number as driver_phone
        FROM bookings b
        INNER JOIN trips t ON b.trip_id = t.id
        INNER JOIN routes r ON t.route_id = r.id
        INNER JOIN cities fc ON r.from_city_id = fc.id
        INNER JOIN cities tc ON r.to_city_id = tc.id
        INNER JOIN buses bu ON t.bus_id = bu.id
        INNER JOIN companies c ON r.company_id = c.id
        LEFT JOIN drivers d ON t.driver_id = d.id
        LEFT JOIN users u ON d.user_id = u.id
        WHERE b.id = ?
    `, [bookingId]);
    
    if (!booking.length) {
        return res.status(404).json({
            success: false,
            message: 'Booking not found'
        });
    }
    
    const ticketData = booking[0];
    
    const qrData = {
        bookingId: ticketData.id,
        reference: ticketData.booking_reference,
        passenger: ticketData.passenger_name,
        from: ticketData.from_city,
        to: ticketData.to_city,
        date: ticketData.departure_date,
        time: ticketData.departure_time,
        seats: JSON.parse(ticketData.seat_numbers),
        bus: ticketData.plate_number,
        company: ticketData.company_name,
        amount: ticketData.total_amount,
        timestamp: new Date().toISOString()
    };
    
    const qrCodeUrl = await QRCode.toDataURL(JSON.stringify(qrData), {
        errorCorrectionLevel: 'M',
        type: 'image/png',
        quality: 0.92,
        margin: 1,
        color: {
            dark: '#000000',
            light: '#FFFFFF'
        }
    });
    
    const ticket = {
        booking: {
            id: ticketData.id,
            reference: ticketData.booking_reference,
            status: ticketData.status,
            payment_status: ticketData.payment_status
        },
        passenger: {
            name: ticketData.passenger_name,
            phone: ticketData.passenger_phone,
            email: ticketData.passenger_email
        },
        trip: {
            from_city: ticketData.from_city,
            to_city: ticketData.to_city,
            departure_date: ticketData.departure_date,
            departure_time: ticketData.departure_time,
            arrival_time: ticketData.arrival_time
        },
        bus: {
            plate_number: ticketData.plate_number,
            model: ticketData.model,
            capacity: ticketData.capacity
        },
        company: {
            name: ticketData.company_name,
            logo: ticketData.company_logo,
            address: ticketData.company_address,
            phone: ticketData.company_phone
        },
        driver: {
            name: ticketData.driver_name,
            phone: ticketData.driver_phone,
            license: ticketData.driver_license
        },
        seats: JSON.parse(ticketData.seat_numbers),
        amount: {
            total: ticketData.total_amount,
            discount: ticketData.discount_amount
        },
        qr_code: qrCodeUrl,
        qr_data: qrData,
        generated_at: new Date().toISOString()
    };
    
    res.json({
        success: true,
        data: ticket
    });
});

export const validateTicket = catchAsync(async (req: Request, res: Response) => {
    const { qrData } = req.body;
    
    try {
        const ticketInfo = JSON.parse(qrData);
        
        const [booking] = await pool.query<any[] & mysql.RowDataPacket[]>(`
            SELECT b.*, t.status as trip_status, t.departure_date, t.departure_time
            FROM bookings b
            INNER JOIN trips t ON b.trip_id = t.id
            WHERE b.id = ? AND b.booking_reference = ?
        `, [ticketInfo.bookingId, ticketInfo.reference]);
        
        if (!booking.length) {
            return res.status(404).json({
                success: false,
                message: 'Invalid ticket'
            });
        }
        
        const bookingData = booking[0];
        
        const tripDate = new Date(bookingData.departure_date).toDateString();
        const today = new Date().toDateString();
        
        const validation = {
            is_valid: bookingData.status === 'confirmed' && 
                     bookingData.payment_status === 'completed',
            is_today: tripDate === today,
            is_checked_in: !!bookingData.checked_in_at,
            booking_status: bookingData.status,
            payment_status: bookingData.payment_status,
            trip_status: bookingData.trip_status,
            passenger_name: bookingData.passenger_name,
            seats: JSON.parse(bookingData.seat_numbers),
            departure_time: bookingData.departure_time
        };
        
        res.json({
            success: true,
            data: validation
        });
        
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Invalid QR code format'
        });
    }
});