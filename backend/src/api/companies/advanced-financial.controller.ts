import { Request, Response } from 'express';
import { pool } from '../../config/database';
import { AuthRequest } from '../../middleware/auth.middleware';
import { MTNDisbursementService } from '../../services/mtn-disbursement.service';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';

const mtnDisbursement = new MTNDisbursementService();

// Get company financial dashboard
export const getFinancialDashboard = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user?.id;
    
    const [revenueData] = await pool.execute(`
      SELECT 
        SUM(CASE WHEN DATE(created_at) = CURDATE() THEN net_amount ELSE 0 END) as today_revenue,
        SUM(CASE WHEN WEEK(created_at) = WEEK(NOW()) THEN net_amount ELSE 0 END) as week_revenue,
        SUM(CASE WHEN MONTH(created_at) = MONTH(NOW()) THEN net_amount ELSE 0 END) as month_revenue,
        SUM(net_amount) as total_revenue,
        COUNT(CASE WHEN DATE(created_at) = CURDATE() THEN 1 END) as today_bookings,
        COUNT(CASE WHEN WEEK(created_at) = WEEK(NOW()) THEN 1 END) as week_bookings,
        COUNT(CASE WHEN MONTH(created_at) = MONTH(NOW()) THEN 1 END) as month_bookings
      FROM company_revenues 
      WHERE company_id = ? AND payment_status = 'completed'
    `, [companyId]);

    const [pendingWithdrawals] = await pool.execute(`
      SELECT SUM(amount) as pending_amount, COUNT(*) as pending_count
      FROM transactions 
      WHERE from_user_id = ? AND type = 'withdrawal' AND status = 'pending'
    `, [companyId]);

    const [walletBalance] = await pool.execute(`
      SELECT wallet_balance FROM users WHERE id = ?
    `, [companyId]);

    const [topRoutes] = await pool.execute(`
      SELECT r.origin, r.destination, SUM(cr.net_amount) as revenue, COUNT(*) as bookings
      FROM company_revenues cr
      JOIN trips t ON cr.trip_id = t.id
      JOIN routes r ON t.route_id = r.id
      WHERE cr.company_id = ? AND cr.payment_status = 'completed'
      GROUP BY r.id
      ORDER BY revenue DESC
      LIMIT 5
    `, [companyId]);

    res.json({
      revenue: revenueData[0],
      pendingWithdrawals: pendingWithdrawals[0],
      walletBalance: walletBalance[0]?.wallet_balance || 0,
      topRoutes
    });
  } catch (error) {
    console.error('Error fetching financial dashboard:', error);
    res.status(500).json({ error: 'Failed to fetch financial data' });
  }
};

// Get detailed revenue analytics
export const getRevenueAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user?.id;
    const { period = '30', startDate, endDate } = req.query;

    let dateFilter = '';
    if (startDate && endDate) {
      dateFilter = `AND DATE(cr.created_at) BETWEEN '${startDate}' AND '${endDate}'`;
    } else {
      dateFilter = `AND cr.created_at >= DATE_SUB(NOW(), INTERVAL ${period} DAY)`;
    }

    const [dailyRevenue] = await pool.execute(`
      SELECT 
        DATE(cr.created_at) as date,
        SUM(cr.gross_amount) as gross_revenue,
        SUM(cr.platform_fee) as platform_fees,
        SUM(cr.net_amount) as net_revenue,
        COUNT(*) as bookings
      FROM company_revenues cr
      WHERE cr.company_id = ? AND cr.payment_status = 'completed' ${dateFilter}
      GROUP BY DATE(cr.created_at)
      ORDER BY date DESC
    `, [companyId]);

    const [paymentMethods] = await pool.execute(`
      SELECT 
        cr.payment_method,
        SUM(cr.net_amount) as revenue,
        COUNT(*) as transactions
      FROM company_revenues cr
      WHERE cr.company_id = ? AND cr.payment_status = 'completed' ${dateFilter}
      GROUP BY cr.payment_method
    `, [companyId]);

    const [busPerformance] = await pool.execute(`
      SELECT 
        b.license_plate,
        b.model,
        SUM(cr.net_amount) as revenue,
        COUNT(*) as trips,
        AVG(cr.net_amount) as avg_revenue_per_trip
      FROM company_revenues cr
      JOIN trips t ON cr.trip_id = t.id
      JOIN buses b ON t.bus_id = b.id
      WHERE cr.company_id = ? AND cr.payment_status = 'completed' ${dateFilter}
      GROUP BY b.id
      ORDER BY revenue DESC
    `, [companyId]);

    res.json({
      dailyRevenue,
      paymentMethods,
      busPerformance
    });
  } catch (error) {
    console.error('Error fetching revenue analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
};

// Advanced withdrawal with multiple options
export const advancedWithdrawal = async (req: AuthRequest, res: Response) => {
  try {
    const { amount, method, phoneNumber, bankAccount, pin, schedule } = req.body;
    const companyId = req.user?.id;

    if (!amount || !method || !pin) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (amount <= 0 || amount > 10000000) {
      return res.status(400).json({ error: 'Invalid amount (1-10,000,000 RWF)' });
    }

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Verify company and PIN
      const [companyRows] = await connection.execute(
        'SELECT wallet_balance, wallet_pin FROM users WHERE id = ? AND role = "company"',
        [companyId]
      ) as any;

      if (companyRows.length === 0) {
        throw new Error('Company not found');
      }

      const company = companyRows[0];

      if (!company.wallet_pin || !await bcrypt.compare(pin, company.wallet_pin)) {
        throw new Error('Invalid PIN');
      }

      if (company.wallet_balance < amount) {
        throw new Error('Insufficient balance');
      }

      let referenceId = '';
      let status = 'pending';

      // Process based on withdrawal method
      switch (method) {
        case 'mtn':
          if (!phoneNumber) {
            throw new Error('Phone number required for MTN withdrawal');
          }
          
          const isValidAccount = await mtnDisbursement.validateAccountHolder(phoneNumber);
          if (!isValidAccount) {
            throw new Error('Invalid MTN Mobile Money account');
          }

          const transferRequest = {
            amount: amount.toString(),
            currency: 'RWF',
            externalId: uuidv4(),
            payee: {
              partyIdType: 'MSISDN',
              partyId: phoneNumber
            },
            payerMessage: 'GoBus company withdrawal',
            payeeNote: 'Company earnings withdrawal'
          };

          referenceId = await mtnDisbursement.transfer(transferRequest);
          break;

        case 'bank':
          if (!bankAccount) {
            throw new Error('Bank account required for bank withdrawal');
          }
          // Bank transfer logic would go here
          referenceId = uuidv4();
          status = 'processing';
          break;

        case 'scheduled':
          if (!schedule) {
            throw new Error('Schedule required for scheduled withdrawal');
          }
          referenceId = uuidv4();
          status = 'scheduled';
          break;

        default:
          throw new Error('Invalid withdrawal method');
      }

      // Deduct from wallet
      await connection.execute(
        'UPDATE users SET wallet_balance = wallet_balance - ? WHERE id = ?',
        [amount, companyId]
      );

      // Create transaction record
      const transactionId = uuidv4();
      await connection.execute(`
        INSERT INTO transactions (
          id, from_user_id, amount, type, status, description, 
          external_reference, mtn_reference_id, withdrawal_method,
          withdrawal_details, scheduled_at
        ) VALUES (?, ?, ?, 'withdrawal', ?, ?, ?, ?, ?, ?, ?)`,
        [
          transactionId, companyId, amount, status,
          `${method.toUpperCase()} withdrawal`,
          uuidv4(), referenceId, method,
          JSON.stringify({ phoneNumber, bankAccount }),
          schedule ? new Date(schedule) : null
        ]
      );

      // Log withdrawal for audit
      await connection.execute(`
        INSERT INTO company_withdrawal_logs (
          id, company_id, transaction_id, amount, method, 
          reference_id, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
        [uuidv4(), companyId, transactionId, amount, method, referenceId, status]
      );

      await connection.commit();
      connection.release();

      res.json({
        message: 'Withdrawal request processed successfully',
        transactionId,
        referenceId,
        status,
        estimatedCompletion: method === 'mtn' ? '5 minutes' : method === 'bank' ? '1-2 business days' : 'As scheduled'
      });
    } catch (error: any) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error: any) {
    console.error('Error processing withdrawal:', error);
    res.status(500).json({ error: error.message || 'Failed to process withdrawal' });
  }
};

// Bulk withdrawal for multiple companies (admin only)
export const bulkWithdrawal = async (req: AuthRequest, res: Response) => {
  try {
    const { withdrawals } = req.body; // Array of {companyId, amount, method, details}
    
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const results = [];
    
    for (const withdrawal of withdrawals) {
      try {
        const { companyId, amount, method, phoneNumber } = withdrawal;
        
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        // Check company balance
        const [companyRows] = await connection.execute(
          'SELECT wallet_balance FROM users WHERE id = ? AND role = "company"',
          [companyId]
        ) as any;

        if (companyRows.length === 0 || companyRows[0].wallet_balance < amount) {
          results.push({ companyId, status: 'failed', error: 'Insufficient balance' });
          connection.release();
          continue;
        }

        // Process MTN withdrawal
        if (method === 'mtn') {
          const transferRequest = {
            amount: amount.toString(),
            currency: 'RWF',
            externalId: uuidv4(),
            payee: {
              partyIdType: 'MSISDN',
              partyId: phoneNumber
            },
            payerMessage: 'GoBus bulk withdrawal',
            payeeNote: 'Automated company settlement'
          };

          const referenceId = await mtnDisbursement.transfer(transferRequest);

          // Update balance and create transaction
          await connection.execute(
            'UPDATE users SET wallet_balance = wallet_balance - ? WHERE id = ?',
            [amount, companyId]
          );

          await connection.execute(`
            INSERT INTO transactions (
              id, from_user_id, amount, type, status, description, mtn_reference_id
            ) VALUES (?, ?, ?, 'withdrawal', 'pending', 'Bulk withdrawal', ?)`,
            [uuidv4(), companyId, amount, referenceId]
          );

          await connection.commit();
          results.push({ companyId, status: 'success', referenceId });
        }

        connection.release();
      } catch (error: any) {
        results.push({ companyId, status: 'failed', error: error.message });
      }
    }

    res.json({ results });
  } catch (error) {
    console.error('Error processing bulk withdrawal:', error);
    res.status(500).json({ error: 'Failed to process bulk withdrawal' });
  }
};

// Set automatic withdrawal schedule
export const setWithdrawalSchedule = async (req: AuthRequest, res: Response) => {
  try {
    const { frequency, minAmount, maxAmount, method, phoneNumber, enabled } = req.body;
    const companyId = req.user?.id;

    await pool.execute(`
      INSERT INTO company_withdrawal_schedules (
        id, company_id, frequency, min_amount, max_amount, 
        method, phone_number, enabled, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE
        frequency = VALUES(frequency),
        min_amount = VALUES(min_amount),
        max_amount = VALUES(max_amount),
        method = VALUES(method),
        phone_number = VALUES(phone_number),
        enabled = VALUES(enabled),
        updated_at = NOW()`,
      [uuidv4(), companyId, frequency, minAmount, maxAmount, method, phoneNumber, enabled]
    );

    res.json({ message: 'Withdrawal schedule updated successfully' });
  } catch (error) {
    console.error('Error setting withdrawal schedule:', error);
    res.status(500).json({ error: 'Failed to set withdrawal schedule' });
  }
};

// Get withdrawal history with advanced filtering
export const getWithdrawalHistory = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user?.id;
    const { 
      page = 1, 
      limit = 20, 
      status, 
      method, 
      startDate, 
      endDate,
      minAmount,
      maxAmount 
    } = req.query;

    let whereClause = 'WHERE from_user_id = ? AND type = "withdrawal"';
    const params = [companyId];

    if (status) {
      whereClause += ' AND status = ?';
      params.push(status as string);
    }

    if (method) {
      whereClause += ' AND withdrawal_method = ?';
      params.push(method as string);
    }

    if (startDate && endDate) {
      whereClause += ' AND DATE(created_at) BETWEEN ? AND ?';
      params.push(startDate as string, endDate as string);
    }

    if (minAmount) {
      whereClause += ' AND amount >= ?';
      params.push(parseFloat(minAmount as string));
    }

    if (maxAmount) {
      whereClause += ' AND amount <= ?';
      params.push(parseFloat(maxAmount as string));
    }

    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    const [transactions] = await pool.execute(`
      SELECT 
        id, amount, status, description, withdrawal_method,
        mtn_reference_id, created_at, updated_at,
        withdrawal_details, scheduled_at
      FROM transactions 
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?`,
      [...params, parseInt(limit as string), offset]
    );

    const [countResult] = await pool.execute(`
      SELECT COUNT(*) as total FROM transactions ${whereClause}`,
      params
    ) as any;

    res.json({
      transactions,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total: countResult[0].total,
        pages: Math.ceil(countResult[0].total / parseInt(limit as string))
      }
    });
  } catch (error) {
    console.error('Error fetching withdrawal history:', error);
    res.status(500).json({ error: 'Failed to fetch withdrawal history' });
  }
};

// Generate financial reports
export const generateFinancialReport = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user?.id;
    const { reportType, startDate, endDate, format = 'json' } = req.query;

    const dateFilter = startDate && endDate 
      ? `AND DATE(created_at) BETWEEN '${startDate}' AND '${endDate}'`
      : `AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)`;

    let reportData: any = {};

    switch (reportType) {
      case 'revenue':
        const [revenueReport] = await pool.execute(`
          SELECT 
            DATE(created_at) as date,
            SUM(gross_amount) as gross_revenue,
            SUM(platform_fee) as platform_fees,
            SUM(net_amount) as net_revenue,
            COUNT(*) as bookings,
            AVG(net_amount) as avg_booking_value
          FROM company_revenues 
          WHERE company_id = ? AND payment_status = 'completed' ${dateFilter}
          GROUP BY DATE(created_at)
          ORDER BY date DESC`,
          [companyId]
        );
        reportData = { type: 'revenue', data: revenueReport };
        break;

      case 'withdrawals':
        const [withdrawalReport] = await pool.execute(`
          SELECT 
            DATE(created_at) as date,
            withdrawal_method as method,
            SUM(amount) as total_amount,
            COUNT(*) as transaction_count,
            status
          FROM transactions 
          WHERE from_user_id = ? AND type = 'withdrawal' ${dateFilter}
          GROUP BY DATE(created_at), withdrawal_method, status
          ORDER BY date DESC`,
          [companyId]
        );
        reportData = { type: 'withdrawals', data: withdrawalReport };
        break;

      case 'comprehensive':
        const [comprehensiveReport] = await pool.execute(`
          SELECT 
            DATE(t.created_at) as date,
            COALESCE(SUM(cr.net_amount), 0) as revenue,
            COALESCE(SUM(CASE WHEN t.type = 'withdrawal' THEN t.amount ELSE 0 END), 0) as withdrawals,
            COUNT(DISTINCT cr.id) as bookings,
            COUNT(DISTINCT CASE WHEN t.type = 'withdrawal' THEN t.id END) as withdrawal_transactions
          FROM (
            SELECT DATE(created_at) as date FROM company_revenues WHERE company_id = ? ${dateFilter}
            UNION
            SELECT DATE(created_at) as date FROM transactions WHERE from_user_id = ? AND type = 'withdrawal' ${dateFilter}
          ) dates
          LEFT JOIN company_revenues cr ON DATE(cr.created_at) = dates.date AND cr.company_id = ?
          LEFT JOIN transactions t ON DATE(t.created_at) = dates.date AND t.from_user_id = ? AND t.type = 'withdrawal'
          GROUP BY dates.date
          ORDER BY dates.date DESC`,
          [companyId, companyId, companyId, companyId]
        );
        reportData = { type: 'comprehensive', data: comprehensiveReport };
        break;

      default:
        return res.status(400).json({ error: 'Invalid report type' });
    }

    if (format === 'csv') {
      // Convert to CSV format
      const csv = convertToCSV(reportData.data);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${reportType}_report.csv"`);
      res.send(csv);
    } else {
      res.json(reportData);
    }
  } catch (error) {
    console.error('Error generating financial report:', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
};

// Helper function to convert data to CSV
const convertToCSV = (data: any[]): string => {
  if (data.length === 0) return '';
  
  const headers = Object.keys(data[0]).join(',');
  const rows = data.map(row => Object.values(row).join(','));
  
  return [headers, ...rows].join('\n');
};