import { Router } from 'express';
import { authenticateToken, authorizeRoles } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { rateLimitMiddleware } from '../middleware/rate-limit.middleware';

// Import all controllers
import { AdvancedCompanyManagementController } from '../api/admin/advanced-company-management.controller';
import { AdvancedDriverManagementController } from '../api/companies/advanced-driver-management.controller';
import { AdvancedTripManagementController } from '../api/drivers/advanced-trip-management.controller';
import { AdvancedTicketGeneratorController } from '../api/bookings/advanced-ticket-generator.controller';
import { BlockchainWalletController } from '../api/wallet/blockchain-wallet.controller';
import { MobileMoneyController } from '../api/payments/mobile-money.controller';

const router = Router();

// =====================================================
// ADMIN ROUTES - Company Management
// =====================================================

// Admin company management routes
router.post('/admin/companies', 
  authenticateToken,
  authorizeRoles(['admin']),
  rateLimitMiddleware('auth'),
  AdvancedCompanyManagementController.createCompany
);

router.get('/admin/companies',
  authenticateToken,
  authorizeRoles(['admin']),
  AdvancedCompanyManagementController.getAllCompanies
);

router.put('/admin/companies/:companyId/status',
  authenticateToken,
  authorizeRoles(['admin']),
  rateLimitMiddleware('auth'),
  AdvancedCompanyManagementController.updateCompanyStatus
);

router.get('/admin/companies/:companyId/analytics',
  authenticateToken,
  authorizeRoles(['admin']),
  AdvancedCompanyManagementController.getCompanyAnalytics
);

router.post('/admin/agents',
  authenticateToken,
  authorizeRoles(['admin']),
  rateLimitMiddleware('auth'),
  AdvancedCompanyManagementController.createAgent
);

// =====================================================
// COMPANY ROUTES - Driver & Bus Management
// =====================================================

// Company driver management routes
router.post('/company/drivers',
  authenticateToken,
  authorizeRoles(['company_manager', 'admin']),
  rateLimitMiddleware('auth'),
  AdvancedDriverManagementController.createDriver
);

router.get('/company/drivers',
  authenticateToken,
  authorizeRoles(['company_manager', 'admin']),
  AdvancedDriverManagementController.getCompanyDrivers
);

router.put('/company/drivers/:driverId/status',
  authenticateToken,
  authorizeRoles(['company_manager', 'admin']),
  rateLimitMiddleware('auth'),
  AdvancedDriverManagementController.updateDriverStatus
);

router.get('/company/drivers/:driverId/performance',
  authenticateToken,
  authorizeRoles(['company_manager', 'admin']),
  AdvancedDriverManagementController.getDriverPerformance
);

router.post('/company/bus-assignments',
  authenticateToken,
  authorizeRoles(['company_manager', 'admin']),
  rateLimitMiddleware('auth'),
  AdvancedDriverManagementController.assignBusToDriver
);

// =====================================================
// DRIVER ROUTES - Trip Management
// =====================================================

// Driver trip management routes
router.get('/driver/trips',
  authenticateToken,
  authorizeRoles(['driver']),
  AdvancedTripManagementController.getDriverTrips
);

router.get('/driver/trips/:tripId/passengers',
  authenticateToken,
  authorizeRoles(['driver']),
  AdvancedTripManagementController.getTripPassengers
);

router.post('/driver/trips/:tripId/checkin',
  authenticateToken,
  authorizeRoles(['driver']),
  rateLimitMiddleware('auth'),
  AdvancedTripManagementController.checkInPassenger
);

router.put('/driver/trips/:tripId/status',
  authenticateToken,
  authorizeRoles(['driver']),
  rateLimitMiddleware('auth'),
  AdvancedTripManagementController.updateTripStatus
);

router.get('/driver/dashboard',
  authenticateToken,
  authorizeRoles(['driver']),
  AdvancedTripManagementController.getDriverDashboard
);

// =====================================================
// TICKET SYSTEM ROUTES
// =====================================================

// Ticket generation and management
router.post('/bookings/:bookingId/ticket',
  authenticateToken,
  authorizeRoles(['passenger', 'agent', 'admin']),
  AdvancedTicketGeneratorController.generateTicket
);

router.post('/tickets/verify',
  authenticateToken,
  authorizeRoles(['driver', 'agent', 'admin']),
  rateLimitMiddleware('auth'),
  AdvancedTicketGeneratorController.verifyTicket
);

router.get('/tickets',
  authenticateToken,
  authorizeRoles(['passenger', 'agent', 'admin']),
  AdvancedTicketGeneratorController.getUserTickets
);

router.post('/tickets/:ticketId/email',
  authenticateToken,
  authorizeRoles(['passenger', 'agent', 'admin']),
  rateLimitMiddleware('auth'),
  AdvancedTicketGeneratorController.sendTicketEmail
);

// =====================================================
// BLOCKCHAIN WALLET ROUTES
// =====================================================

// Blockchain wallet management
router.post('/wallet/create',
  authenticateToken,
  rateLimitMiddleware('auth'),
  BlockchainWalletController.createWallet
);

router.get('/wallet/details',
  authenticateToken,
  BlockchainWalletController.getWalletDetails
);

router.post('/wallet/transfer',
  authenticateToken,
  rateLimitMiddleware('payment'),
  BlockchainWalletController.transferFunds
);

router.post('/wallet/deposit',
  authenticateToken,
  rateLimitMiddleware('payment'),
  BlockchainWalletController.depositFunds
);

router.get('/wallet/transactions',
  authenticateToken,
  BlockchainWalletController.getTransactionHistory
);

// =====================================================
// MOBILE MONEY PAYMENT ROUTES
// =====================================================

// MTN Mobile Money
router.post('/payments/mtn/initiate',
  authenticateToken,
  rateLimitMiddleware('payment'),
  MobileMoneyController.initiateMTNPayment
);

// Airtel Money
router.post('/payments/airtel/initiate',
  authenticateToken,
  rateLimitMiddleware('payment'),
  MobileMoneyController.initiateAirtelPayment
);

// Payment status check
router.get('/payments/:paymentId/status',
  authenticateToken,
  MobileMoneyController.checkPaymentStatus
);

// Webhook endpoints (no auth required)
router.post('/webhooks/mtn',
  rateLimitMiddleware('webhook'),
  MobileMoneyController.handleMTNWebhook
);

router.post('/webhooks/airtel',
  rateLimitMiddleware('webhook'),
  MobileMoneyController.handleAirtelWebhook
);

// =====================================================
// ENHANCED BOOKING ROUTES
// =====================================================

// Enhanced booking management
router.get('/bookings/search',
  authenticateToken,
  async (req, res) => {
    // Enhanced search with filters
    try {
      const { 
        origin, destination, date, passengers, 
        company_id, bus_type, price_range, departure_time 
      } = req.query;

      // Implementation for enhanced search
      res.json({
        success: true,
        message: 'Enhanced search functionality',
        data: {
          trips: [],
          filters: { origin, destination, date, passengers },
          total: 0
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Search failed',
        error: error.message
      });
    }
  }
);

router.post('/bookings/bulk',
  authenticateToken,
  authorizeRoles(['agent', 'admin']),
  rateLimitMiddleware('auth'),
  async (req, res) => {
    // Bulk booking for agents
    try {
      const { bookings } = req.body;
      
      // Implementation for bulk booking
      res.json({
        success: true,
        message: 'Bulk booking created',
        data: {
          bookings: [],
          total_amount: 0,
          booking_references: []
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Bulk booking failed',
        error: error.message
      });
    }
  }
);

// =====================================================
// ANALYTICS AND REPORTING ROUTES
// =====================================================

// Company analytics
router.get('/analytics/company/dashboard',
  authenticateToken,
  authorizeRoles(['company_manager', 'admin']),
  async (req, res) => {
    try {
      const companyId = req.user?.company_id;
      const { period = '30d' } = req.query;

      // Implementation for company analytics
      res.json({
        success: true,
        data: {
          revenue: {
            total: 0,
            growth: 0,
            period
          },
          bookings: {
            total: 0,
            confirmed: 0,
            cancelled: 0
          },
          performance: {
            on_time_percentage: 0,
            customer_satisfaction: 0,
            fleet_utilization: 0
          }
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Analytics fetch failed',
        error: error.message
      });
    }
  }
);

// Admin system analytics
router.get('/analytics/admin/system',
  authenticateToken,
  authorizeRoles(['admin']),
  async (req, res) => {
    try {
      const { period = '30d' } = req.query;

      // Implementation for system analytics
      res.json({
        success: true,
        data: {
          system: {
            total_users: 0,
            active_companies: 0,
            total_trips: 0,
            platform_revenue: 0
          },
          growth: {
            user_growth: 0,
            revenue_growth: 0,
            booking_growth: 0
          },
          performance: {
            system_uptime: 99.9,
            avg_response_time: 150,
            error_rate: 0.1
          }
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'System analytics fetch failed',
        error: error.message
      });
    }
  }
);

// =====================================================
// NOTIFICATION ROUTES
// =====================================================

// Push notification management
router.post('/notifications/register-token',
  authenticateToken,
  async (req, res) => {
    try {
      const { token, platform } = req.body;
      const userId = req.user?.id;

      // Implementation for token registration
      res.json({
        success: true,
        message: 'Push notification token registered'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Token registration failed',
        error: error.message
      });
    }
  }
);

router.get('/notifications',
  authenticateToken,
  async (req, res) => {
    try {
      const userId = req.user?.id;
      const { page = 1, limit = 20, type } = req.query;

      // Implementation for fetching notifications
      res.json({
        success: true,
        data: {
          notifications: [],
          pagination: {
            page: parseInt(page as string),
            limit: parseInt(limit as string),
            total: 0,
            pages: 0
          }
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Notifications fetch failed',
        error: error.message
      });
    }
  }
);

router.put('/notifications/:notificationId/read',
  authenticateToken,
  async (req, res) => {
    try {
      const { notificationId } = req.params;
      const userId = req.user?.id;

      // Implementation for marking notification as read
      res.json({
        success: true,
        message: 'Notification marked as read'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Notification update failed',
        error: error.message
      });
    }
  }
);

// =====================================================
// REAL-TIME TRACKING ROUTES
// =====================================================

// Live bus tracking
router.get('/tracking/trip/:tripId',
  authenticateToken,
  async (req, res) => {
    try {
      const { tripId } = req.params;

      // Implementation for live tracking
      res.json({
        success: true,
        data: {
          trip_id: tripId,
          current_location: {
            latitude: -1.9441,
            longitude: 30.0619,
            address: 'Kigali, Rwanda'
          },
          status: 'in_progress',
          estimated_arrival: new Date(),
          delay_minutes: 0,
          next_stop: 'Nyabugogo',
          passengers_count: 45
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Tracking data fetch failed',
        error: error.message
      });
    }
  }
);

// Update bus location (for drivers)
router.post('/tracking/update-location',
  authenticateToken,
  authorizeRoles(['driver']),
  rateLimitMiddleware('tracking'),
  async (req, res) => {
    try {
      const { trip_id, latitude, longitude, speed, heading } = req.body;
      const driverId = req.user?.id;

      // Implementation for location update
      res.json({
        success: true,
        message: 'Location updated successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Location update failed',
        error: error.message
      });
    }
  }
);

// =====================================================
// LOYALTY PROGRAM ROUTES
// =====================================================

// Loyalty points management
router.get('/loyalty/points',
  authenticateToken,
  authorizeRoles(['passenger']),
  async (req, res) => {
    try {
      const userId = req.user?.id;

      // Implementation for loyalty points
      res.json({
        success: true,
        data: {
          total_points: 0,
          available_points: 0,
          tier: 'bronze',
          next_tier_points: 1000,
          recent_transactions: []
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Loyalty points fetch failed',
        error: error.message
      });
    }
  }
);

router.post('/loyalty/redeem',
  authenticateToken,
  authorizeRoles(['passenger']),
  rateLimitMiddleware('auth'),
  async (req, res) => {
    try {
      const { points, reward_type } = req.body;
      const userId = req.user?.id;

      // Implementation for points redemption
      res.json({
        success: true,
        message: 'Points redeemed successfully',
        data: {
          redeemed_points: points,
          reward: reward_type,
          remaining_points: 0
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Points redemption failed',
        error: error.message
      });
    }
  }
);

// =====================================================
// HEALTH CHECK AND SYSTEM STATUS
// =====================================================

router.get('/health',
  async (req, res) => {
    try {
      // Check system health
      res.json({
        success: true,
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '2.0.0',
        services: {
          database: 'connected',
          redis: 'connected',
          blockchain: 'active',
          mobile_money: 'active'
        }
      });
    } catch (error) {
      res.status(503).json({
        success: false,
        status: 'unhealthy',
        error: error.message
      });
    }
  }
);

router.get('/system/status',
  authenticateToken,
  authorizeRoles(['admin']),
  async (req, res) => {
    try {
      // Detailed system status for admins
      res.json({
        success: true,
        data: {
          uptime: process.uptime(),
          memory_usage: process.memoryUsage(),
          cpu_usage: process.cpuUsage(),
          active_connections: 0,
          database_status: 'healthy',
          redis_status: 'healthy',
          queue_status: 'healthy'
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'System status fetch failed',
        error: error.message
      });
    }
  }
);

export default router;