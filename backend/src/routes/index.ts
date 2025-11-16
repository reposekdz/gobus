import { Router } from 'express';
import authRoutes from '../auth/auth.routes';
import routesRoutes from '../api/routes/routes.routes';
import bookingRoutes from '../api/bookings/booking.routes';
import companyRoutes from '../api/companies/company.routes';
import driverRoutes from '../api/drivers/driver.routes';
import userRoutes from '../api/users/user.routes';
import tripRoutes from '../api/trips/trip.routes';
import walletRoutes from '../api/wallet/wallet.routes';
import paymentRoutes from '../api/payments/payments.routes';
import notificationRoutes from '../api/notifications/notifications.routes';
import messageRoutes from '../api/messages/message.routes';
import adminRoutes from '../api/admin/admin.routes';
import agentRoutes from '../api/agent/agent.routes';
import packageRoutes from '../api/packages/packages.routes';
import charterRoutes from '../api/charters/charters.routes';
import lostAndFoundRoutes from '../api/lost-and-found/lost-and-found.routes';
import loyaltyRoutes from '../api/loyalty/loyalty.routes';
import priceAlertsRoutes from '../api/price-alerts/price-alerts.routes';
import destinationsRoutes from '../api/destinations/destinations.routes';
import settingsRoutes from '../api/settings/settings.routes';
import advertisementsRoutes from '../api/advertisements/advertisements.routes';
import stationsRoutes from '../api/locations/stations.routes';

const router = Router();

// Health check endpoint
router.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'GoBus API is running',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// API info endpoint
router.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'GoBus API v1.0.0',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        endpoints: {
            auth: '/api/v1/auth',
            routes: '/api/v1/routes',
            bookings: '/api/v1/bookings',
            companies: '/api/v1/companies',
            drivers: '/api/v1/drivers',
            users: '/api/v1/users',
            trips: '/api/v1/trips',
            wallet: '/api/v1/wallet',
            payments: '/api/v1/payments',
            notifications: '/api/v1/notifications',
            messages: '/api/v1/messages',
            admin: '/api/v1/admin',
            agents: '/api/v1/agents',
            packages: '/api/v1/packages',
            charters: '/api/v1/charters',
            lostAndFound: '/api/v1/lost-and-found',
            loyalty: '/api/v1/loyalty',
            priceAlerts: '/api/v1/price-alerts',
            destinations: '/api/v1/destinations',
            settings: '/api/v1/settings',
            advertisements: '/api/v1/advertisements'
        }
    });
});

// Mount routes
router.use('/auth', authRoutes);
router.use('/routes', routesRoutes);
router.use('/bookings', bookingRoutes);
router.use('/companies', companyRoutes);
router.use('/drivers', driverRoutes);
router.use('/users', userRoutes);
router.use('/trips', tripRoutes);
router.use('/wallet', walletRoutes);
router.use('/payments', paymentRoutes);
router.use('/notifications', notificationRoutes);
router.use('/messages', messageRoutes);
router.use('/admin', adminRoutes);
router.use('/agents', agentRoutes);
router.use('/packages', packageRoutes);
router.use('/charters', charterRoutes);
router.use('/lost-and-found', lostAndFoundRoutes);
router.use('/loyalty', loyaltyRoutes);
router.use('/price-alerts', priceAlertsRoutes);
router.use('/destinations', destinationsRoutes);
router.use('/settings', settingsRoutes);
router.use('/advertisements', advertisementsRoutes);
router.use('/stations', stationsRoutes);

export default router;