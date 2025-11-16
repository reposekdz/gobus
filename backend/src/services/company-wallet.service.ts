import { db } from '../config/database';
import { AppError } from '../utils/AppError';
import logger from '../utils/logger';
import \{ mtnService \} from '\./mtn-momo\.service';
import { v4 as uuidv4 } from 'uuid';

/**
 * Company Wallet Service
 * Manages company wallet operations including balance tracking,
 * revenue management, and withdrawal processing
 */

interface CompanyWallet {
  id: number;
  company_id: number;
  balance: number;
  pending_balance: number;
  total_earned: number;
  total_withdrawn: number;
  total_commission_paid: number;
  currency: string;
  withdrawal_phone: string | null;
  min_withdrawal_amount: number;
  max_withdrawal_amount: number;
  daily_withdrawal_limit: number;
  is_active: boolean;
  is_locked: boolean;
  last_withdrawal_at: Date | null;
}

interface WithdrawalRequest {
  id: number;
  company_id: number;
  request_reference: string;
  amount: number;
  phone_number: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  mtn_transaction_id: number | null;
  failure_reason: string | null;
  requested_at: Date;
}

export class CompanyWalletService {
  /**
   * Get company wallet details
   */
  static async getCompanyWallet(companyId: number): Promise<CompanyWallet> {
    try {
      const [wallets] = await db.execute(
        `SELECT * FROM company_wallets WHERE company_id = ?`,
        [companyId]
      );

      if (!Array.isArray(wallets) || wallets.length === 0) {
        // Create wallet if it doesn't exist
        await db.execute(
          `INSERT INTO company_wallets (company_id, balance, currency) VALUES (?, 0.00, 'RWF')`,
          [companyId]
        );

        const [newWallets] = await db.execute(
          `SELECT * FROM company_wallets WHERE company_id = ?`,
          [companyId]
        );

        return (newWallets as any[])[0];
      }

      return (wallets as any[])[0];
    } catch (error: any) {
      logger.error('Error getting company wallet', {
        error: error.message,
        companyId
      });
      throw new AppError('Failed to retrieve company wallet', 500);
    }
  }

  /**
   * Get company wallet balance
   */
  static async getBalance(companyId: number): Promise<{
    balance: number;
    pending_balance: number;
    available_balance: number;
  }> {
    try {
      const wallet = await this.getCompanyWallet(companyId);

      return {
        balance: parseFloat(wallet.balance.toString()),
        pending_balance: parseFloat(wallet.pending_balance.toString()),
        available_balance: parseFloat(wallet.balance.toString()) - parseFloat(wallet.pending_balance.toString())
      };
    } catch (error: any) {
      logger.error('Error getting company balance', {
        error: error.message,
        companyId
      });
      throw new AppError('Failed to retrieve balance', 500);
    }
  }

  /**
   * Credit company wallet (from booking payment)
   */
  static async creditWallet(params: {
    companyId: number;
    amount: number;
    bookingId: number;
    mtnTransactionId?: number;
    description: string;
  }): Promise<void> {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      const wallet = await this.getCompanyWallet(params.companyId);

      // Get commission rate
      const [companies] = await connection.execute(
        `SELECT commission_rate FROM companies WHERE id = ?`,
        [params.companyId]
      );

      const commissionRate = (companies as any[])[0]?.commission_rate || 10;
      const commissionAmount = (params.amount * commissionRate) / 100;
      const netAmount = params.amount - commissionAmount;

      const balanceBefore = parseFloat(wallet.balance.toString());
      const balanceAfter = balanceBefore + netAmount;

      // Update wallet balance
      await connection.execute(
        `UPDATE company_wallets 
         SET balance = balance + ?, 
             total_earned = total_earned + ?,
             total_commission_paid = total_commission_paid + ?
         WHERE company_id = ?`,
        [netAmount, params.amount, commissionAmount, params.companyId]
      );

      // Record credit transaction
      await connection.execute(
        `INSERT INTO company_wallet_transactions (
          company_wallet_id, transaction_type, amount, balance_before, balance_after,
          description, related_booking_id, related_mtn_transaction_id,
          commission_rate, commission_amount, status
        ) VALUES (?, 'credit', ?, ?, ?, ?, ?, ?, ?, ?, 'completed')`,
        [
          wallet.id,
          netAmount,
          balanceBefore,
          balanceAfter,
          params.description,
          params.bookingId,
          params.mtnTransactionId || null,
          commissionRate,
          commissionAmount
        ]
      );

      // Record commission transaction
      await connection.execute(
        `INSERT INTO company_wallet_transactions (
          company_wallet_id, transaction_type, amount, balance_before, balance_after,
          description, related_booking_id, commission_rate, commission_amount, status
        ) VALUES (?, 'commission', ?, ?, ?, ?, ?, ?, ?, 'completed')`,
        [
          wallet.id,
          commissionAmount,
          balanceAfter,
          balanceAfter,
          `Platform commission - ${params.description}`,
          params.bookingId,
          commissionRate,
          commissionAmount
        ]
      );

      await connection.commit();

      console.log('Company wallet credited successfully', {
        companyId: params.companyId,
        amount: params.amount,
        netAmount,
        commissionAmount,
        bookingId: params.bookingId
      });
    } catch (error: any) {
      await connection.rollback();
      console.error('Error crediting company wallet', {
        error: error.message,
        params
      });
      throw new Error('Failed to credit company wallet');
    } finally {
      connection.release();
    }
  }

  /**
   * Request withdrawal
   */
  static async requestWithdrawal(params: {
    companyId: number;
    userId: number;
    amount: number;
    phoneNumber: string;
    notes?: string;
  }): Promise<WithdrawalRequest> {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      // Get wallet and validate
      const wallet = await this.getCompanyWallet(params.companyId);

      if (!wallet.is_active) {
        throw new Error('Company wallet is not active');
      }

      if (wallet.is_locked) {
        throw new Error('Company wallet is locked. Please contact support.');
      }

      const availableBalance = parseFloat(wallet.balance.toString()) - parseFloat(wallet.pending_balance.toString());

      if (params.amount > availableBalance) {
        throw new Error('Insufficient balance for withdrawal');
      }

      if (params.amount < wallet.min_withdrawal_amount) {
        throw new Error(`Minimum withdrawal amount is ${wallet.min_withdrawal_amount} RWF`);
      }

      if (params.amount > wallet.max_withdrawal_amount) {
        throw new Error(`Maximum withdrawal amount is ${wallet.max_withdrawal_amount} RWF`);
      }

      // Check daily limit
      const [dailyWithdrawals] = await connection.execute(
        `SELECT COALESCE(SUM(amount), 0) as total
         FROM withdrawal_requests
         WHERE company_id = ? 
         AND DATE(requested_at) = CURDATE()
         AND status IN ('completed', 'processing', 'pending')`,
        [params.companyId]
      );

      const dailyTotal = parseFloat((dailyWithdrawals as any[])[0].total);
      if (dailyTotal + params.amount > wallet.daily_withdrawal_limit) {
        throw new Error(`Daily withdrawal limit of ${wallet.daily_withdrawal_limit} RWF exceeded`);
      }

      // Create withdrawal request
      const requestReference = `WD-${Date.now()}-${uuidv4().substring(0, 8).toUpperCase()}`;

      await connection.execute(
        `INSERT INTO withdrawal_requests (
          company_id, company_wallet_id, request_reference, amount, phone_number,
          status, requested_by_user_id, notes
        ) VALUES (?, ?, ?, ?, ?, 'pending', ?, ?)`,
        [
          params.companyId,
          wallet.id,
          requestReference,
          params.amount,
          params.phoneNumber,
          params.userId,
          params.notes || null
        ]
      );

      // Update pending balance
      await connection.execute(
        `UPDATE company_wallets SET pending_balance = pending_balance + ? WHERE id = ?`,
        [params.amount, wallet.id]
      );

      await connection.commit();

      const [requests] = await connection.execute(
        `SELECT * FROM withdrawal_requests WHERE request_reference = ?`,
        [requestReference]
      );

      const request = (requests as any[])[0];

      console.log('Withdrawal request created', {
        companyId: params.companyId,
        requestReference,
        amount: params.amount
      });

      // Auto-process if enabled
      const [settings] = await db.execute(
        `SELECT setting_value FROM settings WHERE setting_key = 'auto_approve_withdrawals'`
      );

      if ((settings as any[])[0]?.setting_value === 'true') {
        // Process withdrawal asynchronously
        this.processWithdrawal(request.id).catch(error => {
          console.error('Error auto-processing withdrawal', {
            error: error.message,
            requestId: request.id
          });
        });
      }

      return request;
    } catch (error: any) {
      await connection.rollback();
      console.error('Error requesting withdrawal', {
        error: error.message,
        params
      });
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Process withdrawal (initiate MTN disbursement) with 3% admin fee
   */
  static async processWithdrawal(requestId: number): Promise<void> {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      // Get withdrawal request
      const [requests] = await connection.execute(
        `SELECT wr.*, c.name as company_name, cw.admin_fee_rate
         FROM withdrawal_requests wr
         JOIN companies c ON wr.company_id = c.id
         JOIN company_wallets cw ON wr.company_wallet_id = cw.id
         WHERE wr.id = ? AND wr.status = 'pending'`,
        [requestId]
      );

      if (!Array.isArray(requests) || requests.length === 0) {
        throw new Error('Withdrawal request not found or already processed');
      }

      const request = (requests as any[])[0];

      // Calculate admin fee (3% default)
      const adminFeeRate = parseFloat(request.admin_fee_rate || '3.00') / 100;
      const adminFeeAmount = parseFloat(request.amount) * adminFeeRate;
      const netWithdrawalAmount = parseFloat(request.amount) - adminFeeAmount;

      // Update status to processing
      await connection.execute(
        `UPDATE withdrawal_requests SET status = 'processing', processed_at = NOW() WHERE id = ?`,
        [requestId]
      );

      // Record admin fee
      await connection.execute(
        `INSERT INTO admin_fees (
          withdrawal_request_id, company_id, amount, fee_rate, status, created_at
        ) VALUES (?, ?, ?, ?, 'pending', NOW())`,
        [requestId, request.company_id, adminFeeAmount, adminFeeRate * 100]
      );

      await connection.commit();

      // Initiate MTN disbursement (net amount after admin fee)
      const externalId = `WD-${request.id}-${Date.now()}`;

      const mtnResult = await mtnService.deposit({
        amount: netWithdrawalAmount,
        phoneNumber: request.phone_number,
        externalId,
        payerMessage: `Withdrawal from GoBus - ${request.company_name}`,
        payeeNote: `Withdrawal ${request.request_reference} (Admin fee: ${adminFeeAmount} RWF)`
      });

      // Record MTN transaction
      const [mtnTransactionResult] = await db.execute(
        `INSERT INTO mtn_transactions (
          user_id, transaction_type, operation_type, reference_id, external_id,
          amount, currency, phone_number, payer_message, payee_note, status,
          related_company_wallet_id
        ) VALUES (
          (SELECT user_id FROM companies WHERE id = ?),
          'disbursement', 'deposit', ?, ?, ?, 'EUR', ?, ?, ?, 'pending',
          (SELECT id FROM company_wallets WHERE company_id = ?)
        )`,
        [
          request.company_id,
          mtnResult.referenceId,
          externalId,
          request.amount,
          request.phone_number,
          `Withdrawal from GoBus - ${request.company_name}`,
          `Withdrawal ${request.request_reference}`,
          request.company_id
        ]
      );

      const mtnTransactionId = (mtnTransactionResult as any).insertId;

      // Update withdrawal request with MTN transaction
      await db.execute(
        `UPDATE withdrawal_requests SET mtn_transaction_id = ? WHERE id = ?`,
        [mtnTransactionId, requestId]
      );

      // Poll for status
      setTimeout(() => this.checkWithdrawalStatus(requestId, mtnResult.referenceId), 10000);

      console.log('Withdrawal processing initiated', {
        requestId,
        mtnReferenceId: mtnResult.referenceId,
        amount: request.amount
      });
    } catch (error: any) {
      await connection.rollback();

      // Update request as failed
      await db.execute(
        `UPDATE withdrawal_requests 
         SET status = 'failed', failure_reason = ? 
         WHERE id = ?`,
        [error.message, requestId]
      );

      // Release pending balance
      await db.execute(
        `UPDATE company_wallets cw
         JOIN withdrawal_requests wr ON cw.id = wr.company_wallet_id
         SET cw.pending_balance = cw.pending_balance - wr.amount
         WHERE wr.id = ?`,
        [requestId]
      );

      console.error('Error processing withdrawal', {
        error: error.message,
        requestId
      });
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Check withdrawal status from MTN
   */
  static async checkWithdrawalStatus(requestId: number, mtnReferenceId: string): Promise<void> {
    try {
      const status = await mtnService.getDepositStatus(mtnReferenceId);

      // Update MTN transaction
      await db.execute(
        `UPDATE mtn_transactions 
         SET status = ?, financial_transaction_id = ?, response_data = ?, completed_at = NOW()
         WHERE reference_id = ?`,
        [
          status.status.toLowerCase(),
          status.financialTransactionId,
          JSON.stringify(status),
          mtnReferenceId
        ]
      );

      if (status.status === 'SUCCESSFUL') {
        await this.completeWithdrawal(requestId);
      } else if (status.status === 'FAILED') {
        await this.failWithdrawal(requestId, status.reason?.message || 'Transaction failed');
      } else if (status.status === 'PENDING') {
        // Continue polling
        setTimeout(() => this.checkWithdrawalStatus(requestId, mtnReferenceId), 15000);
      }
    } catch (error: any) {
      console.error('Error checking withdrawal status', {
        error: error.message,
        requestId,
        mtnReferenceId
      });
    }
  }

  /**
   * Complete withdrawal
   */
  static async completeWithdrawal(requestId: number): Promise<void> {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      // Get request details
      const [requests] = await connection.execute(
        `SELECT * FROM withdrawal_requests WHERE id = ?`,
        [requestId]
      );

      const request = (requests as any[])[0];

      // Get wallet
      const [wallets] = await connection.execute(
        `SELECT * FROM company_wallets WHERE id = ?`,
        [request.company_wallet_id]
      );

      const wallet = (wallets as any[])[0];
      const balanceBefore = parseFloat(wallet.balance);
      const balanceAfter = balanceBefore - parseFloat(request.amount);

      // Calculate admin fee
      const [requestData] = await connection.execute(
        `SELECT amount, admin_fee_rate FROM withdrawal_requests wr
         JOIN company_wallets cw ON wr.company_wallet_id = cw.id
         WHERE wr.id = ?`,
        [requestId]
      );
      const requestAmount = parseFloat((requestData as any[])[0].amount);
      const adminFeeRate = parseFloat((requestData as any[])[0].admin_fee_rate || '3.00') / 100;
      const adminFeeAmount = requestAmount * adminFeeRate;

      // Update wallet (deduct full amount including admin fee)
      await connection.execute(
        `UPDATE company_wallets 
         SET balance = balance - ?,
             pending_balance = pending_balance - ?,
             total_withdrawn = total_withdrawn + ?,
             total_admin_fees = total_admin_fees + ?,
             last_withdrawal_at = NOW()
         WHERE id = ?`,
        [request.amount, request.amount, request.amount, adminFeeAmount, wallet.id]
      );

      // Mark admin fee as collected
      await connection.execute(
        `UPDATE admin_fees 
         SET status = 'collected', collected_at = NOW()
         WHERE withdrawal_request_id = ?`,
        [requestId]
      );

      // Record transaction
      await connection.execute(
        `INSERT INTO company_wallet_transactions (
          company_wallet_id, transaction_type, amount, balance_before, balance_after,
          description, reference, related_mtn_transaction_id, status
        ) VALUES (?, 'debit', ?, ?, ?, ?, ?, ?, 'completed')`,
        [
          wallet.id,
          request.amount,
          balanceBefore,
          balanceAfter,
          `Withdrawal to ${request.phone_number}`,
          request.request_reference,
          request.mtn_transaction_id
        ]
      );

      // Update request status
      await connection.execute(
        `UPDATE withdrawal_requests 
         SET status = 'completed', completed_at = NOW() 
         WHERE id = ?`,
        [requestId]
      );

      await connection.commit();

      console.log('Withdrawal completed successfully', {
        requestId,
        amount: request.amount,
        companyId: request.company_id
      });
    } catch (error: any) {
      await connection.rollback();
      console.error('Error completing withdrawal', {
        error: error.message,
        requestId
      });
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Fail withdrawal
   */
  static async failWithdrawal(requestId: number, reason: string): Promise<void> {
    try {
      // Update request status
      await db.execute(
        `UPDATE withdrawal_requests 
         SET status = 'failed', failure_reason = ? 
         WHERE id = ?`,
        [reason, requestId]
      );

      // Release pending balance
      await db.execute(
        `UPDATE company_wallets cw
         JOIN withdrawal_requests wr ON cw.id = wr.company_wallet_id
         SET cw.pending_balance = cw.pending_balance - wr.amount
         WHERE wr.id = ?`,
        [requestId]
      );

      console.log('Withdrawal marked as failed', {
        requestId,
        reason
      });
    } catch (error: any) {
      console.error('Error failing withdrawal', {
        error: error.message,
        requestId
      });
      throw error;
    }
  }

  /**
   * Get withdrawal history
   */
  static async getWithdrawalHistory(companyId: number, limit: number = 50): Promise<any[]> {
    try {
      const [withdrawals] = await db.execute(
        `SELECT 
          wr.*,
          u.name as requested_by_name,
          mt.status as mtn_status,
          mt.financial_transaction_id
         FROM withdrawal_requests wr
         LEFT JOIN users u ON wr.requested_by_user_id = u.id
         LEFT JOIN mtn_transactions mt ON wr.mtn_transaction_id = mt.id
         WHERE wr.company_id = ?
         ORDER BY wr.requested_at DESC
         LIMIT ?`,
        [companyId, limit]
      );

      return withdrawals as any[];
    } catch (error: any) {
      console.error('Error getting withdrawal history', {
        error: error.message,
        companyId
      });
      throw new Error('Failed to retrieve withdrawal history');
    }
  }

  /**
   * Get wallet transactions
   */
  static async getTransactions(companyId: number, limit: number = 100): Promise<any[]> {
    try {
      const wallet = await this.getCompanyWallet(companyId);

      const [transactions] = await db.execute(
        `SELECT 
          cwt.*,
          b.booking_reference,
          mt.reference_id as mtn_reference
         FROM company_wallet_transactions cwt
         LEFT JOIN bookings b ON cwt.related_booking_id = b.id
         LEFT JOIN mtn_transactions mt ON cwt.related_mtn_transaction_id = mt.id
         WHERE cwt.company_wallet_id = ?
         ORDER BY cwt.created_at DESC
         LIMIT ?`,
        [wallet.id, limit]
      );

      return transactions as any[];
    } catch (error: any) {
      console.error('Error getting wallet transactions', {
        error: error.message,
        companyId
      });
      throw new Error('Failed to retrieve transactions');
    }
  }

  /**
   * Get revenue summary
   */
  static async getRevenueSummary(companyId: number): Promise<any> {
    try {
      const [summary] = await db.execute(
        `SELECT * FROM v_company_revenue_summary WHERE company_id = ?`,
        [companyId]
      );

      return (summary as any[])[0] || null;
    } catch (error: any) {
      console.error('Error getting revenue summary', {
        error: error.message,
        companyId
      });
      throw new Error('Failed to retrieve revenue summary');
    }
  }
}
