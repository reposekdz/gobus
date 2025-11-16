import { pool } from '../config/db';
import bcrypt from 'bcryptjs';
import { AppError } from '../utils/AppError';
import logger from '../utils/logger';
import * as mysql from 'mysql2/promise';
import { v4 as uuidv4 } from 'uuid';
import { findUserBySerialCode } from './serial-code.service';
import { PassengerWalletService } from './passenger-wallet.service';

/**
 * Agent Deposit Service
 * Manages agent deposits to passenger wallets using serial codes
 * Agent gets 1.5% commission from company
 */

interface AgentDepositParams {
  agentId: number;
  passengerSerialCode: string;
  amount: number;
  agentPin: string;
  description?: string;
}

export class AgentDepositService {
  /**
   * Agent deposit to passenger account using serial code
   * Agent gets 1.5% commission from company
   */
  static async deposit(params: AgentDepositParams): Promise<{
    transactionReference: string;
    amount: number;
    agentFee: number;
    netAmount: number;
    passengerId: number;
    passengerName: string;
  }> {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Validate amount
      if (!params.amount || params.amount <= 0) {
        throw new AppError('Invalid deposit amount', 400);
      }

      if (params.amount < 1000 || params.amount > 500000) {
        throw new AppError('Deposit amount must be between 1,000 and 500,000 RWF', 400);
      }

      // Verify agent PIN
      const [agentWallets] = await connection.execute<mysql.RowDataPacket[]>(
        `SELECT pin_hash, pin_set FROM wallets WHERE user_id = ?`,
        [params.agentId]
      );

      if (!agentWallets.length || !agentWallets[0].pin_set) {
        throw new AppError('Agent wallet PIN not set', 400);
      }

      const isValidPin = await bcrypt.compare(params.agentPin, agentWallets[0].pin_hash);
      if (!isValidPin) {
        throw new AppError('Invalid agent PIN', 401);
      }

      // Get agent details and company
      const [agents] = await connection.execute<mysql.RowDataPacket[]>(
        `SELECT u.id, u.company_id, u.role, u.name as agent_name, c.name as company_name
         FROM users u
         LEFT JOIN companies c ON u.company_id = c.id
         WHERE u.id = ? AND u.role = 'agent'`,
        [params.agentId]
      );

      if (!agents.length) {
        throw new AppError('Agent not found', 404);
      }

      const agent = agents[0];
      if (!agent.company_id) {
        throw new AppError('Agent must be assigned to a company', 400);
      }

      // Find passenger by serial code
      const passenger = await findUserBySerialCode(params.passengerSerialCode);
      if (!passenger) {
        throw new AppError('Passenger not found with this serial code', 404);
      }

      // Calculate commission (1.5% from company)
      const agentFeeRate = 0.015; // 1.5%
      const agentFeeAmount = params.amount * agentFeeRate;
      const netAmount = params.amount; // Passenger gets full amount

      // Get company wallet
      const [companyWallets] = await connection.execute<mysql.RowDataPacket[]>(
        `SELECT id, balance FROM company_wallets WHERE company_id = ?`,
        [agent.company_id]
      );

      if (!companyWallets.length) {
        // Create company wallet if doesn't exist
        const [result] = await connection.execute<mysql.ResultSetHeader>(
          `INSERT INTO company_wallets (company_id, balance, currency, created_at, updated_at)
           VALUES (?, 0, 'RWF', NOW(), NOW())`,
          [agent.company_id]
        );
        
        const [newWallets] = await connection.execute<mysql.RowDataPacket[]>(
          `SELECT id, balance FROM company_wallets WHERE id = ?`,
          [result.insertId]
        );
        
        companyWallets.push(newWallets[0]);
      }

      const companyWalletId = companyWallets[0].id;
      const companyBalance = parseFloat(companyWallets[0].balance.toString());

      // Check if company has sufficient balance for fee
      if (companyBalance < agentFeeAmount) {
        throw new AppError('Company has insufficient balance to pay agent commission', 400);
      }

      // Deduct agent fee from company wallet
      await connection.execute(
        `UPDATE company_wallets 
         SET balance = balance - ?,
             total_commission_paid = total_commission_paid + ?,
             updated_at = NOW()
         WHERE id = ?`,
        [agentFeeAmount, agentFeeAmount, companyWalletId]
      );

      // Record company wallet transaction (commission payment)
      await connection.execute(
        `INSERT INTO company_wallet_transactions (
          company_wallet_id, transaction_type, amount, balance_before, balance_after,
          description, status, created_at
        ) VALUES (?, 'commission', ?, ?, ?, ?, 'completed', NOW())`,
        [
          companyWalletId,
          agentFeeAmount,
          companyBalance,
          companyBalance - agentFeeAmount,
          `Agent commission (1.5%) for deposit to ${params.passengerSerialCode}`
        ]
      );

      // Deposit to passenger wallet
      await PassengerWalletService.deposit({
        userId: passenger.id,
        amount: netAmount,
        depositedBy: params.agentId,
        description: params.description || `Agent deposit by ${agent.agent_name}`,
        transactionReference: `AGT-${uuidv4()}`
      });

      // Record agent deposit
      const transactionReference = `ADP-${uuidv4()}`;
      await connection.execute(
        `INSERT INTO agent_deposits (
          agent_id, company_id, passenger_id, passenger_serial_code,
          amount, agent_fee_amount, agent_fee_rate,
          transaction_reference, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'completed', NOW())`,
        [
          params.agentId,
          agent.company_id,
          passenger.id,
          params.passengerSerialCode,
          params.amount,
          agentFeeAmount,
          agentFeeRate * 100, // Store as percentage
          transactionReference
        ]
      );

      await connection.commit();

      logger.info('Agent deposit completed', {
        agentId: params.agentId,
        passengerSerialCode: params.passengerSerialCode,
        amount: params.amount,
        agentFee: agentFeeAmount,
        transactionReference
      });

      return {
        transactionReference,
        amount: params.amount,
        agentFee: agentFeeAmount,
        netAmount,
        passengerId: passenger.id,
        passengerName: passenger.name
      };
    } catch (error: any) {
      await connection.rollback();
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Error processing agent deposit', {
        error: error.message,
        params
      });
      throw new AppError('Failed to process agent deposit', 500);
    } finally {
      connection.release();
    }
  }

  /**
   * Get agent deposit history
   */
  static async getDepositHistory(agentId: number, limit: number = 50): Promise<any[]> {
    try {
      const [deposits] = await pool.execute<mysql.RowDataPacket[]>(
        `SELECT 
          ad.*,
          u.name as passenger_name,
          u.phone as passenger_phone,
          c.name as company_name
         FROM agent_deposits ad
         LEFT JOIN users u ON ad.passenger_id = u.id
         LEFT JOIN companies c ON ad.company_id = c.id
         WHERE ad.agent_id = ?
         ORDER BY ad.created_at DESC
         LIMIT ?`,
        [agentId, limit]
      );

      return deposits;
    } catch (error: any) {
      logger.error('Error getting agent deposit history', {
        error: error.message,
        agentId
      });
      throw new AppError('Failed to retrieve deposit history', 500);
    }
  }

  /**
   * Get agent deposit statistics
   */
  static async getDepositStats(agentId: number): Promise<{
    totalDeposits: number;
    totalAmount: number;
    totalFees: number;
    depositCount: number;
  }> {
    try {
      const [stats] = await pool.execute<mysql.RowDataPacket[]>(
        `SELECT 
          COUNT(*) as deposit_count,
          COALESCE(SUM(amount), 0) as total_amount,
          COALESCE(SUM(agent_fee_amount), 0) as total_fees
         FROM agent_deposits
         WHERE agent_id = ? AND status = 'completed'`,
        [agentId]
      );

      return {
        totalDeposits: parseFloat(stats[0].total_amount || '0'),
        totalAmount: parseFloat(stats[0].total_amount || '0'),
        totalFees: parseFloat(stats[0].total_fees || '0'),
        depositCount: parseInt(stats[0].deposit_count || '0')
      };
    } catch (error: any) {
      logger.error('Error getting agent deposit stats', {
        error: error.message,
        agentId
      });
      throw new AppError('Failed to retrieve deposit statistics', 500);
    }
  }
}
