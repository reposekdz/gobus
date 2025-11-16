import cron from 'node-cron';
import logger from '../utils/logger';
import { JobService } from '../jobs';
import { pool } from '../config/db';
import { cache } from '../config/redis';

export const initScheduler = async () => {
    try {
        // Clean expired bookings every 5 minutes
        cron.schedule('*/5 * * * *', async () => {
            try {
                logger.info('Running expired booking cleanup');
                
                const [expiredBookings] = await pool.execute(`
                    SELECT id FROM bookings 
                    WHERE status = 'pending' 
                    AND created_at < DATE_SUB(NOW(), INTERVAL 15 MINUTE)
                `);
                
                for (const booking of expiredBookings as any[]) {
                    await JobService.addBookingJob('expire-booking', { bookingId: booking.id });
                }
                
                logger.info(`Queued ${(expiredBookings as any[]).length} expired bookings for cleanup`);
            } catch (error) {
                logger.error('Error in expired booking cleanup:', error);
            }
        });

        // Generate daily reports at 6 AM
        cron.schedule('0 6 * * *', async () => {
            try {
                logger.info('Generating daily reports');
                
                await JobService.addEmailJob('send-daily-report', {
                    date: new Date().toISOString().split('T')[0]
                });
                
                logger.info('Daily report generation queued');
            } catch (error) {
                logger.error('Error generating daily reports:', error);
            }
        });

        // Clean cache every hour
        cron.schedule('0 * * * *', async () => {
            try {
                logger.info('Cleaning expired cache entries');
                
                // Clean search cache
                await cache.flushPattern('search:*');
                
                logger.info('Cache cleanup completed');
            } catch (error) {
                logger.error('Error in cache cleanup:', error);
            }
        });

        // Update bus locations every 30 seconds
        cron.schedule('*/30 * * * * *', async () => {
            try {
                // Update active trip locations
                const [activeTrips] = await pool.execute(`
                    SELECT t.id, t.bus_id, t.route_id 
                    FROM trips t 
                    WHERE t.status = 'active' 
                    AND t.departure_time <= NOW() 
                    AND t.arrival_time >= NOW()
                `);
                
                // Simulate location updates (in production, this would come from GPS devices)
                for (const trip of activeTrips as any[]) {
                    await cache.set(`bus_location:${trip.bus_id}`, {
                        tripId: trip.id,
                        latitude: Math.random() * 180 - 90,
                        longitude: Math.random() * 360 - 180,
                        timestamp: new Date().toISOString()
                    }, 60);
                }
            } catch (error) {
                logger.error('Error updating bus locations:', error);
            }
        });

        // Send reminder notifications 2 hours before departure
        cron.schedule('*/10 * * * *', async () => {
            try {
                const [upcomingBookings] = await pool.execute(`
                    SELECT b.id, b.user_id, t.departure_time, r.origin, r.destination
                    FROM bookings b
                    JOIN trips t ON b.trip_id = t.id
                    JOIN routes r ON t.route_id = r.id
                    WHERE b.status = 'confirmed'
                    AND t.departure_time BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 2 HOUR)
                    AND b.reminder_sent = 0
                `);
                
                for (const booking of upcomingBookings as any[]) {
                    await JobService.addEmailJob('send-reminder', {
                        bookingId: booking.id,
                        userId: booking.user_id,
                        departureTime: booking.departure_time,
                        route: `${booking.origin} to ${booking.destination}`
                    });
                    
                    // Mark reminder as sent
                    await pool.execute(
                        'UPDATE bookings SET reminder_sent = 1 WHERE id = ?',
                        [booking.id]
                    );
                }
                
                if ((upcomingBookings as any[]).length > 0) {
                    logger.info(`Sent ${(upcomingBookings as any[]).length} departure reminders`);
                }
            } catch (error) {
                logger.error('Error sending departure reminders:', error);
            }
        });

        // Weekly analytics report every Sunday at 8 AM
        cron.schedule('0 8 * * 0', async () => {
            try {
                logger.info('Generating weekly analytics report');
                
                await JobService.addEmailJob('send-weekly-report', {
                    weekStart: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
                    weekEnd: new Date().toISOString()
                });
                
                logger.info('Weekly analytics report queued');
            } catch (error) {
                logger.error('Error generating weekly report:', error);
            }
        });

        // Clean old logs daily at 2 AM
        cron.schedule('0 2 * * *', async () => {
            try {
                logger.info('Cleaning old system logs');
                
                // Clean logs older than 30 days
                await pool.execute(`
                    DELETE FROM system_logs 
                    WHERE created_at < DATE_SUB(NOW(), INTERVAL 30 DAY)
                `);
                
                logger.info('Old logs cleanup completed');
            } catch (error) {
                logger.error('Error cleaning old logs:', error);
            }
        });

        logger.info('All scheduled tasks initialized successfully');
        
    } catch (error) {
        logger.error('Failed to initialize scheduler:', error);
        throw error;
    }
};