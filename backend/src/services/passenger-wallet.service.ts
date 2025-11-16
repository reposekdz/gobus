import { pool } from '../config/db';
import bcrypt from 'bcryptjs';
import { AppError } from '../utils/AppError';
import logger from '../utils/logger';
import * as mysql from 'mysql2/promise';
import { v4 as uuidv4 } from 'uuid';

/**
 * Passenger Wallet Service
 * Manages passenger wallet operations with PIN protection, serial codes,
 * and deposit restrictions (passengers cannot deposit, only platform/agents can)
 */

interface PassengerWallet {
  id: number;
  user_id: number;
  balance: number;
  currency: string;
  pin_set: boolean;
  pin_hash: string | null;
  can_deposit: boolean;
  total_deposits: number;
  total_withdrawals: number;
  is_locked: boolean;
  pin_locked_until: Date | null;
  last_transaction_at: Date | null;
}

export class PassengerWalletService {
  /**
   * Get passenger wallet details
   */
  static async getWallet(userId: number): Promise<PassengerWallet> {
    try {
      const [wallets] = await pool.execute<mysql.RowDataPacket[]>(
        `SELECT w.*, u.serial_code
         FROM wallets w
         JOIN users u ON w.user_id = u.id
         WHERE w.user_id = ? AND u.role = 'passenger'`,
        [userId]
      );

      if (!Array.isArray(wallets) || wallets.length === 0) {
        // Create wallet if it doesn't exist (should be created during registration)
        await pool.execute(
          `INSERT INTO wallets (user_id, balance, currency, can_deposit, pin_set, created_at, updated_at)
           VALUES (?, 0, 'RWF', 0, 0, NOW(), NOW())`,
          [userId]
        );

        const [newWallets] = await pool.execute<mysql.RowDataPacket[]>(
          `SELECT w.*, u.serial_code
           FROM wallets w
           JOIN users u ON w.user_id = u.id
           WHERE w.user_id = ?`,
          [userId]
        );

        return newWallets[0] as any;
      }

      return wallets[0] as any;
    } catch (error: any) {
      logger.error('Error getting passenger wallet', {
        error: error.message,
        userId
      });
      throw new AppError('Failed to retrieve wallet', 500);
    }
  }

  /**
   * Set wallet PIN (required for passenger wallets)
   */
  static async setPIN(userId: number, pin: string): Promise<void> {
    try {
      // Validate PIN format (4-6 digits)
      if (!/^\d{4,6}$/.test(pin)) {
        throw new AppError('PIN must be 4-6 digits', 400);
      }

      const wallet = await this.getWallet(userId);

      if (wallet.pin_set) {
        throw new AppError('Wallet PIN already set. Use update PIN to change it.', 400);
      }

      // Hash PIN
      const pinHash = await bcrypt.hash(pin, 12);

      // Update wallet with PIN
      await pool.execute(
        `UPDATE wallets 
         SET pin_hash = ?, pin_set = 1, updated_at = NOW()
         WHERE user_id = ?`,
        [pinHash, userId]
      );

      logger.info(`Wallet PIN set for user: ${userId}`);
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Error setting wallet PIN', {
        error: error.message,
        userId
      });
      throw new AppError('Failed to set wallet PIN', 500);
    }
  }

  /**
   * Update wallet PIN
   */
  static async updatePIN(userId: number, currentPin: string, newPin: string): Promise<void> {
    try {
      // Validate new PIN format
      if (!/^\d{4,6}$/.test(newPin)) {
        throw new AppError('PIN must be 4-6 digits', 400);
      }

      const wallet = await this.getWallet(userId);

      if (!wallet.pin_set || !wallet.pin_hash) {
        throw new AppError('Wallet PIN not set', 400);
      }

      // Verify current PIN
      const isValidPin = await bcrypt.compare(currentPin, wallet.pin_hash);
      if (!isValidPin) {
        // Increment failed attempts
        await pool.execute(
          `UPDATE wallets 
           SET failed_pin_attempts = failed_pin_attempts + 1,
               pin_locked_until = CASE 
                 WHEN failed_pin_attempts >= 4 THEN DATE_ADD(NOW(), INTERVAL 30 MINUTE)
                 ELSE pin_locked_until
               END
           WHERE user_id = ?`,
          [userId]
        );

        throw new AppError('Invalid current PIN', 401);
      }

      // Check if wallet is locked
      if (wallet.pin_locked_until && new Date(wallet.pin_locked_until) > new Date()) {
        throw new AppError('Wallet is locked. Please try again later.', 403);
      }

      // Hash new PIN
      const newPinHash = await bcrypt.hash(newPin, 12);

      // Update wallet PIN
      await pool.execute(
        `UPDATE wallets 
         SET pin_hash = ?, failed_pin_attempts = 0, pin_locked_until = NULL, updated_at = NOW()
         WHERE user_id = ?`,
        [newPinHash, userId]
      );

      logger.info(`Wallet PIN updated for user: ${userId}`);
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Error updating wallet PIN', {
        error: error.message,
        userId
      });
      throw new AppError('Failed to update wallet PIN', 500);
    }
  }

  /**
   * Verify wallet PIN
   */
  static async verifyPIN(userId: number, pin: string): Promise<boolean> {
    try {
      const wallet = await this.getWallet(userId);

      if (!wallet.pin_set || !wallet.pin_hash) {
        throw new AppError('Wallet PIN not set', 400);
      }

      // Check if wallet is locked
      if (wallet.pin_locked_until && new Date(wallet.pin_locked_until) > new Date()) {
        throw new AppError('Wallet is locked. Please try again later.', 403);
      }

      const isValid = await bcrypt.compare(pin, wallet.pin_hash);

      if (!isValid) {
        // Increment failed attempts
        await pool.execute(
          `UPDATE wallets 
           SET failed_pin_attempts = failed_pin_attempts + 1,
               pin_locked_until = CASE 
                 WHEN failed_pin_attempts >= 4 THEN DATE_ADD(NOW(), INTERVAL 30 MINUTE)
                 ELSE pin_locked_until
               END
           WHERE user_id = ?`,
          [userId]
        );
      } else {
        // Reset failed attempts on success
        await pool.execute(
          `UPDATE wallets 
           SET failed_pin_attempts = 0, pin_locked_until = NULL
           WHERE user_id = ?`,
          [userId]
        );
      }

      return isValid;
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Error verifying wallet PIN', {
        error: error.message,
        userId
      });
      return false;
    }
  }

  /**
   * Get wallet balance (without PIN requirement)
   */
  static async getBalance(userId: number): Promise<{
    balance: number;
    currency: string;
    pin_set: boolean;
    can_deposit: boolean;
    serial_code: string;
  }> {
    try {
      const wallet = await this.getWallet(userId);

      return {
        balance: parseFloat(wallet.balance.toString()),
        currency: wallet.currency || 'RWF',
        pin_set: wallet.pin_set || false,
        can_deposit: wallet.can_deposit || false,
        serial_code: (wallet as any).serial_code || ''
      };
    } catch (error: any) {
      logger.error('Error getting wallet balance', {
        error: error.message,
        userId
      });
      throw new AppError('Failed to retrieve balance', 500);
    }
  }

  /**
   * Deposit money to passenger wallet (only platform/agents can do this)
   * Passengers cannot deposit directly
   */
  static async deposit(params: {
    userId: number;
    amount: number;
    depositedBy: number; // Agent ID or system
    description: string;
    transactionReference?: string;
  }): Promise<void> {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const wallet = await this.getWallet(params.userId);

      if (!wallet.can_deposit && params.depositedBy !== 0) {
        // Only allow deposits from agents/platform
        const [depositors] = await connection.execute<mysql.RowDataPacket[]>(
          'SELECT role FROM users WHERE id = ?',
          [params.depositedBy]
        );

        if (!depositors.length || !['agent', 'admin'].includes(depositors[0].role)) {
          throw new AppError('Only agents or platform can deposit to passenger wallets', 403);
        }
      }

      const balanceBefore = parseFloat(wallet.balance.toString());
      const balanceAfter = balanceBefore + params.amount;

      // Update wallet balance
      await connection.execute(
        `UPDATE wallets 
         SET balance = balance + ?,
             total_deposits = total_deposits + ?,
             last_transaction_at = NOW(),
             updated_at = NOW()
         WHERE user_id = ?`,
        [params.amount, params.amount, params.userId]
      );

      // Get wallet ID
      const [wallets] = await connection.execute<mysql.RowDataPacket[]>(
        'SELECT id FROM wallets WHERE user_id = ?',
        [params.userId]
      );
      const walletId = wallets[0].id;

      // Record transaction
      const transactionRef = params.transactionReference || `DEP-${uuidv4()}`;
      await connection.execute(
        `INSERT INTO wallet_transactions (
          wallet_id, transaction_type, amount, balance_before, balance_after,
          description, transaction_reference, status, created_at
        ) VALUES (?, 'credit', ?, ?, ?, ?, ?, 'completed', NOW())`,
        [
          walletId,
          params.amount,
          balanceBefore,
          balanceAfter,
          params.description,
          transactionRef
        ]
      );

      await connection.commit();

      logger.info(`Deposit completed`, {
        userId: params.userId,
        amount: params.amount,
        depositedBy: params.depositedBy,
        transactionRef
      });
    } catch (error: any) {
      await connection.rollback();
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Error depositing to wallet', {
        error: error.message,
        params
      });
      throw new AppError('Failed to deposit to wallet', 500);
    } finally {
      connection.release();
    }
  }

  /**
   * Transfer money between passengers using serial codes
   */
  static async transfer(params: {
    fromUserId: number;
    toSerialCode: string;
    amount: number;
    pin: string;
    description?: string;
  }): Promise<void> {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Verify sender PIN
      const isValidPin = await this.verifyPIN(params.fromUserId, params.pin);
      if (!isValidPin) {
        throw new AppError('Invalid wallet PIN', 401);
      }

      // Get sender wallet
      const senderWallet = await this.getWallet(params.fromUserId);
      const senderBalance = parseFloat(senderWallet.balance.toString());

      if (senderBalance < params.amount) {
        throw new AppError('Insufficient wallet balance', 400);
      }

      // Find recipient by serial code
      const { findUserBySerialCode } = await import('./serial-code.service');
      const recipient = await findUserBySerialCode(params.toSerialCode);

      if (!recipient) {
        throw new AppError('Recipient not found with this serial code', 404);
      }

      if (recipient.id === params.fromUserId) {
        throw new AppError('Cannot transfer to yourself', 400);
      }

      // Get recipient wallet
      const recipientWallet = await this.getWallet(recipient.id);

      // Update sender wallet
      const senderBalanceAfter = senderBalance - params.amount;
      await connection.execute(
        `UPDATE wallets 
         SET balance = balance - ?,
             total_withdrawals = total_withdrawals + ?,
             last_transaction_at = NOW(),
             updated_at = NOW()
         WHERE user_id = ?`,
        [params.amount, params.amount, params.fromUserId]
      );

      // Update recipient wallet
      const recipientBalanceAfter = parseFloat(recipientWallet.balance.toString()) + params.amount;
      await connection.execute(
        `UPDATE wallets 
         SET balance = balance + ?,
             total_deposits = total_deposits + ?,
             last_transaction_at = NOW(),
             updated_at = NOW()
         WHERE user_id = ?`,
        [params.amount, params.amount, recipient.id]
      );

      // Get wallet IDs
      const [senderWallets] = await connection.execute<mysql.RowDataPacket[]>(
        'SELECT id FROM wallets WHERE user_id = ?',
        [params.fromUserId]
      );
      const [recipientWallets] = await connection.execute<mysql.RowDataPacket[]>(
        'SELECT id FROM wallets WHERE user_id = ?',
        [recipient.id]
      );

      const senderWalletId = senderWallets[0].id;
      const recipientWalletId = recipientWallets[0].id;

      // Record transactions
      const transactionRef = `TRF-${uuidv4()}`;
      
      // Sender transaction (debit)
      await connection.execute(
        `INSERT INTO wallet_transactions (
          wallet_id, transaction_type, amount, balance_before, balance_after,
          description, transaction_reference, related_user_id, serial_code_used, status, created_at
        ) VALUES (?, 'debit', ?, ?, ?, ?, ?, ?, ?, 'completed', NOW())`,
        [
          senderWalletId,
          params.amount,
          senderBalance,
          senderBalanceAfter,
          params.description || `Transfer to ${params.toSerialCode}`,
          transactionRef,
          recipient.id,
          params.toSerialCode
        ]
      );

      // Recipient transaction (credit)
      await connection.execute(
        `INSERT INTO wallet_transactions (
          wallet_id, transaction_type, amount, balance_before, balance_after,
          description, transaction_reference, related_user_id, serial_code_used, status, created_at
        ) VALUES (?, 'credit', ?, ?, ?, ?, ?, ?, ?, 'completed', NOW())`,
        [
          recipientWalletId,
          params.amount,
          parseFloat(recipientWallet.balance.toString()),
          recipientBalanceAfter,
          params.description || `Transfer from ${(senderWallet as any).serial_code}`,
          transactionRef,
          params.fromUserId,
          params.toSerialCode
        ]
      );

      await connection.commit();

      logger.info(`Transfer completed`, {
        fromUserId: params.fromUserId,
        toSerialCode: params.toSerialCode,
        amount: params.amount,
        transactionRef
      });
    } catch (error: any) {
      await connection.rollback();
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Error transferring funds', {
        error: error.message,
        params
      });
      throw new AppError('Failed to transfer funds', 500);
    } finally {
      connection.release();
    }
  }

  /**
   * Get wallet transactions
   */
  static async getTransactions(userId: number, limit: number = 50): Promise<any[]> {
    try {
      const wallet = await this.getWallet(userId);
      const [wallets] = await pool.execute<mysql.RowDataPacket[]>(
        'SELECT id FROM wallets WHERE user_id = ?',
        [userId]
      );
      const walletId = wallets[0].id;

      const [transactions] = await pool.execute<mysql.RowDataPacket[]>(
        `SELECT 
          wt.*,
          u.name as related_user_name,
          u.serial_code as related_user_serial
         FROM wallet_transactions wt
         LEFT JOIN users u ON wt.related_user_id = u.id
         WHERE wt.wallet_id = ?
         ORDER BY wt.created_at DESC
         LIMIT ?`,
        [walletId, limit]
      );

      return transactions;
    } catch (error: any) {
      logger.error('Error getting wallet transactions', {
        error: error.message,
        userId
      });
      throw new AppError('Failed to retrieve transactions', 500);
    }
  }
}
