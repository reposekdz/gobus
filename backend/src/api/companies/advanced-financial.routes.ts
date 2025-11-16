import { Router } from 'express';
import { authenticateToken, requireRole } from '../../middleware/auth.middleware';
import {
  getFinancialDashboard,
  getRevenueAnalytics,
  advancedWithdrawal,
  bulkWithdrawal,
  setWithdrawalSchedule,
  getWithdrawalHistory,
  generateFinancialReport
} from './advanced-financial.controller';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Financial dashboard - companies only
router.get('/financial-dashboard', requireRole(['company']), getFinancialDashboard);

// Revenue analytics - companies only
router.get('/revenue-analytics', requireRole(['company']), getRevenueAnalytics);

// Advanced withdrawal - companies only
router.post('/advanced-withdrawal', requireRole(['company']), advancedWithdrawal);

// Bulk withdrawal - admin only
router.post('/bulk-withdrawal', requireRole(['admin']), bulkWithdrawal);

// Withdrawal schedule management - companies only
router.post('/withdrawal-schedule', requireRole(['company']), setWithdrawalSchedule);

// Withdrawal history with advanced filtering - companies only
router.get('/withdrawal-history', requireRole(['company']), getWithdrawalHistory);

// Financial reports - companies and admin
router.get('/financial-report', requireRole(['company', 'admin']), generateFinancialReport);

export default router;