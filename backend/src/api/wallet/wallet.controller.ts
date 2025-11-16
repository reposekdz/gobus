import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { pool } from '../../config/db';
import { MTNCollectionService } from '../../services/mtn-collection.service';
import { MTNDisbursementService } from '../../services/mtn-disbursement.service';
import logger from '../../utils/logger';
import * as mysql from 'mysql2/promise';
import * as walletService from './wallet.service';

interface AuthRequest extends Request {
  user?: {
    id: number;
    role: string;
    name: string;
    email: string;
    company_id?: number;
  };
}

const mtnCollection = new MTNCollectionService();
const mtnDisbursement = new MTNDisbursementService();

// Get wallet history
export const getWalletHistory = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    
    const [transactions] = await pool.execute(
      `SELECT t.*, 
              CASE 
                WHEN t.from_user_id = ? THEN 'debit'
                ELSE 'credit'
              END as type,
              CASE 
                WHEN t.from_user_id = ? THEN u2.name
                ELSE u1.name
              END as other_party
       FROM transactions t
       LEFT JOIN users u1 ON t.from_user_id = u1.id
       LEFT JOIN users u2 ON t.to_user_id = u2.id
       WHERE t.from_user_id = ? OR t.to_user_id = ?
       ORDER BY t.created_at DESC
       LIMIT 50`,
      [userId, userId, userId, userId]
    );

    res.json({ success: true, data: transactions });
  } catch (error: any) {
    logger.error('Error fetching wallet history:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch wallet history', error: error.message });
  }
};

// Deposit via MTN Mobile Money
export const depositViaMTN = async (req: AuthRequest, res: Response) => {
  try {
    const { amount, phoneNumber } = req.body;
    const userId = req.user?.id;

    if (!amount || !phoneNumber) {
      return res.status(400).json({ error: 'Amount and phone number are required' });
    }

    if (amount <= 0 || amount > 1000000) {
      return res.status(400).json({ error: 'Invalid amount (1-1,000,000 RWF)' });
    }

    // Validate phone number format
    const phoneRegex = /^(\+?25)?(078|079|072|073)\d{7}$/;
    if (!phoneRegex.test(phoneNumber)) {
      return res.status(400).json({ error: 'Invalid Rwanda phone number format' });
    }

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Validate account holder
      const isValidAccount = await mtnService.validateAccountHolder(phoneNumber);
      if (!isValidAccount) {
        throw new Error('Invalid MTN Mobile Money account');
      }

      // Create payment request
      const paymentRequest = {
        amount: amount.toString(),
        currency: 'RWF',
        externalId: uuidv4(),
        payer: {
          partyIdType: 'MSISDN',
          partyId: phoneNumber
        },
        payerMessage: 'GoBus wallet deposit',
        payeeNote: `Wallet deposit for user ${userId}`
      };

      const referenceId = await mtnService.requestPayment(paymentRequest);

      // Create transaction record
      const transactionId = uuidv4();
      await connection.execute(
        `INSERT INTO transactions (id, from_user_id, to_user_id, amount, type, status, description, external_reference, mtn_reference_id)
         VALUES (?, NULL, ?, ?, 'deposit', 'pending', 'MTN Mobile Money deposit', ?, ?)`,
        [transactionId, userId, amount, paymentRequest.externalId, referenceId]
      );

      await connection.commit();
      connection.release();

      // Start polling for payment status
      if (userId) {
        setTimeout(() => pollPaymentStatus(referenceId, transactionId, userId.toString(), amount), 5000);
      }

      res.json({ 
        message: 'Payment request sent to your phone. Please complete the transaction.',
        transactionId,
        referenceId,
        status: 'pending'
      });
    } catch (error: any) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error: any) {
    logger.error('Error initiating MTN deposit:', error);
    res.status(500).json({ error: error.message || 'Failed to initiate deposit' });
  }
};

// Poll payment status
const pollPaymentStatus = async (referenceId: string, transactionId: string, userId: string, amount: number) => {
  let attempts = 0;
  const maxAttempts = 12; // 2 minutes with 10-second intervals

  const poll = async () => {
    try {
      const paymentStatus = await mtnService.getCollectionPaymentStatus(referenceId);
      
      if (paymentStatus.status === 'SUCCESSFUL') {
        // Update transaction and wallet balance
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
          await connection.execute(
            'UPDATE transactions SET status = "completed", updated_at = NOW() WHERE id = ?',
            [transactionId]
          );

          await connection.execute(
            'UPDATE users SET wallet_balance = wallet_balance + ? WHERE id = ?',
            [amount, userId]
          );

          await connection.commit();
          connection.release();
        } catch (error) {
          await connection.rollback();
          connection.release();
          throw error;
        }
      } else if (paymentStatus.status === 'FAILED') {
        await pool.execute(
          'UPDATE transactions SET status = "failed", updated_at = NOW() WHERE id = ?',
          [transactionId]
        );
      } else if (attempts < maxAttempts) {
        attempts++;
        setTimeout(poll, 10000); // Poll again in 10 seconds
      } else {
        // Timeout - mark as failed
        await pool.execute(
          'UPDATE transactions SET status = "timeout", updated_at = NOW() WHERE id = ?',
          [transactionId]
        );
      }
    } catch (error) {
      logger.error('Error polling payment status:', error);
      if (attempts < maxAttempts) {
        attempts++;
        setTimeout(poll, 10000);
      }
    }
  };

  poll();
};

// Company withdrawal to MTN
export const withdrawToMTN = async (req: AuthRequest, res: Response) => {
  try {
    const { amount, phoneNumber, pin } = req.body;
    const userId = req.user?.id;

    if (!amount || !phoneNumber || !pin) {
      return res.status(400).json({ error: 'Amount, phone number, and PIN are required' });
    }

    if (amount <= 0 || amount > 500000) {
      return res.status(400).json({ error: 'Invalid amount (1-500,000 RWF)' });
    }

    // Only companies can withdraw
    if (req.user?.role !== 'company') {
      return res.status(403).json({ error: 'Only companies can withdraw funds' });
    }

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Get user details
      const [userRows] = await connection.execute(
        'SELECT wallet_balance, wallet_pin FROM users WHERE id = ?',
        [userId]
      ) as any;

      if (userRows.length === 0) {
        throw new Error('User not found');
      }

      const user = userRows[0];

      // Verify PIN
      if (!user.wallet_pin || !await bcrypt.compare(pin, user.wallet_pin)) {
        throw new Error('Invalid PIN');
      }

      // Check balance
      if (user.wallet_balance < amount) {
        throw new Error('Insufficient balance');
      }

      // Validate MTN account
      const isValidAccount = await mtnService.validateAccountHolder(phoneNumber);
      if (!isValidAccount) {
        throw new Error('Invalid MTN Mobile Money account');
      }

      // Create transfer request
      const transferRequest = {
        amount: amount.toString(),
        currency: 'RWF',
        externalId: uuidv4(),
        payee: {
          partyIdType: 'MSISDN',
          partyId: phoneNumber
        },
        payerMessage: 'GoBus company withdrawal',
        payeeNote: `Company withdrawal from GoBus wallet`
      };

      const referenceId = await mtnService.disbursePayment(transferRequest);

      // Deduct from wallet
      await connection.execute(
        'UPDATE users SET wallet_balance = wallet_balance - ? WHERE id = ?',
        [amount, userId]
      );

      // Create transaction record
      const transactionId = uuidv4();
      await connection.execute(
        `INSERT INTO transactions (id, from_user_id, to_user_id, amount, type, status, description, external_reference, mtn_reference_id)
         VALUES (?, ?, NULL, ?, 'withdrawal', 'pending', 'MTN Mobile Money withdrawal', ?, ?)`,
        [transactionId, userId, amount, transferRequest.externalId, referenceId]
      );

      await connection.commit();
      connection.release();

      res.json({ 
        message: 'Withdrawal request processed. Funds will be sent to your MTN account.',
        transactionId,
        referenceId,
        status: 'pending'
      });
    } catch (error: any) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error: any) {
    logger.error('Error processing withdrawal:', error);
    res.status(500).json({ error: error.message || 'Failed to process withdrawal' });
  }
};

// Agent deposit for passengers
export const agentDeposit = async (req: AuthRequest, res: Response) => {
  try {
    const { passengerPhone, amount, pin } = req.body;
    const agentId = req.user?.id;

    if (!passengerPhone || !amount || !pin) {
      return res.status(400).json({ error: 'Passenger phone, amount, and PIN are required' });
    }

    if (amount <= 0 || amount > 100000) {
      return res.status(400).json({ error: 'Invalid amount (1-100,000 RWF)' });
    }

    // Only agents can make deposits for passengers
    if (req.user?.role !== 'agent') {
      return res.status(403).json({ error: 'Only agents can make passenger deposits' });
    }

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Get agent details
      const [agentRows] = await connection.execute(
        'SELECT wallet_balance, wallet_pin FROM users WHERE id = ?',
        [agentId]
      ) as any;

      if (agentRows.length === 0) {
        throw new Error('Agent not found');
      }

      const agent = agentRows[0];

      // Verify PIN
      if (!agent.wallet_pin || !await bcrypt.compare(pin, agent.wallet_pin)) {
        throw new Error('Invalid PIN');
      }

      // Check agent balance
      if (agent.wallet_balance < amount) {
        throw new Error('Insufficient agent balance');
      }

      // Find passenger by phone
      const [passengerRows] = await connection.execute(
        'SELECT id FROM users WHERE phone = ? AND role = "passenger"',
        [passengerPhone]
      ) as any;

      if (passengerRows.length === 0) {
        throw new Error('Passenger not found');
      }

      const passengerId = passengerRows[0].id;

      // Transfer from agent to passenger
      await connection.execute(
        'UPDATE users SET wallet_balance = wallet_balance - ? WHERE id = ?',
        [amount, agentId]
      );

      await connection.execute(
        'UPDATE users SET wallet_balance = wallet_balance + ? WHERE id = ?',
        [amount, passengerId]
      );

      // Create transaction record
      const transactionId = uuidv4();
      await connection.execute(
        `INSERT INTO transactions (id, from_user_id, to_user_id, amount, type, status, description)
         VALUES (?, ?, ?, ?, 'agent_deposit', 'completed', 'Agent deposit for passenger')`,
        [transactionId, agentId, passengerId, amount]
      );

      await connection.commit();
      connection.release();

      res.json({ 
        message: 'Deposit completed successfully',
        transactionId,
        status: 'completed'
      });
    } catch (error: any) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error: any) {
    logger.error('Error processing agent deposit:', error);
    res.status(500).json({ error: error.message || 'Failed to process deposit' });
  }
};

// Get payment status
export const getPaymentStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { referenceId } = req.params;
    
    const [transactionRows] = await pool.execute(
      'SELECT * FROM transactions WHERE mtn_reference_id = ?',
      [referenceId]
    ) as any;

    if (transactionRows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const transaction = transactionRows[0];
    
    // Get MTN status if still pending
    if (transaction.status === 'pending') {
      try {
        const mtnStatus = await mtnService.getCollectionPaymentStatus(referenceId);
        res.json({ 
          transaction,
          mtnStatus: mtnStatus.status,
          details: mtnStatus
        });
      } catch (error) {
        res.json({ transaction, mtnStatus: 'unknown' });
      }
    } else {
      res.json({ transaction });
    }
  } catch (error) {
    logger.error('Error getting payment status:', error);
    res.status(500).json({ error: 'Failed to get payment status' });
  }
};

// Set wallet PIN
export const setPin = async (req: AuthRequest, res: Response) => {
  try {
    const { pin } = req.body;
    const userId = req.user?.id;

    if (!pin || pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      return res.status(400).json({ error: 'PIN must be 4 digits' });
    }

    const hashedPin = pin; // In production, use: await bcrypt.hash(pin, 10);

    await pool.execute(
      'UPDATE users SET wallet_pin = ? WHERE id = ?',
      [hashedPin, userId]
    );

    res.json({ message: 'PIN set successfully' });
  } catch (error) {
    logger.error('Error setting PIN:', error);
    res.status(500).json({ error: 'Failed to set PIN' });
  }
};

// Transfer funds
export const transferFunds = async (req: AuthRequest, res: Response) => {
  try {
    const { toUserId, amount, pin, description } = req.body;
    const fromUserId = req.user?.id;

    if (!toUserId || !amount || !pin) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    if (fromUserId === toUserId) {
      return res.status(400).json({ error: 'Cannot transfer to yourself' });
    }

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      const [senderRows] = await connection.execute(
        'SELECT wallet_balance, wallet_pin FROM users WHERE id = ?',
        [fromUserId]
      ) as any;

      if (senderRows.length === 0) {
        throw new Error('Sender not found');
      }

      const sender = senderRows[0];

      if (!sender.wallet_pin || !await bcrypt.compare(pin, sender.wallet_pin)) {
        throw new Error('Invalid PIN');
      }

      if (sender.wallet_balance < amount) {
        throw new Error('Insufficient balance');
      }

      const [recipientRows] = await connection.execute(
        'SELECT id FROM users WHERE id = ?',
        [toUserId]
      ) as any;

      if (recipientRows.length === 0) {
        throw new Error('Recipient not found');
      }

      await connection.execute(
        'UPDATE users SET wallet_balance = wallet_balance - ? WHERE id = ?',
        [amount, fromUserId]
      );

      await connection.execute(
        'UPDATE users SET wallet_balance = wallet_balance + ? WHERE id = ?',
        [amount, toUserId]
      );

      await connection.execute(
        `INSERT INTO transactions (id, from_user_id, to_user_id, amount, type, status, description)
         VALUES (?, ?, ?, ?, 'transfer', 'completed', ?)`,
        [uuidv4(), fromUserId, toUserId, amount, description || 'Wallet transfer']
      );

      await connection.commit();
      connection.release();

      res.json({ message: 'Transfer completed successfully' });
    } catch (error: any) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error: any) {
    logger.error('Error transferring funds:', error);
    res.status(500).json({ error: error.message || 'Failed to transfer funds' });
  }
};

// Get MTN account balance (admin only)
export const getMTNBalance = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const [collectionBalance, disbursementBalance] = await Promise.all([
      mtnService.getCollectionBalance('RWF'),
      mtnService.getDisbursementBalance('RWF')
    ]);

    res.json({
      collection: collectionBalance,
      disbursement: disbursementBalance
    });
  } catch (error: any) {
    logger.error('Error getting MTN balance:', error);
    res.status(500).json({ error: error.message || 'Failed to get MTN balance' });
  }
};

// Top up wallet (admin only)
export const topUpWallet = async (req: AuthRequest, res: Response) => {
  try {
    const { userId, amount } = req.body;
    const adminId = req.user?.id;

    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can top up wallets' });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      await connection.execute(
        'UPDATE users SET wallet_balance = wallet_balance + ? WHERE id = ?',
        [amount, userId]
      );

      await connection.execute(
        `INSERT INTO transactions (id, from_user_id, to_user_id, amount, type, status, description)
         VALUES (?, ?, ?, ?, 'topup', 'completed', 'Admin wallet top-up')`,
        [uuidv4(), adminId, userId, amount]
      );

      await connection.commit();
      connection.release();

      res.json({ message: 'Wallet topped up successfully' });
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    logger.error('Error topping up wallet:', error);
    res.status(500).json({ error: 'Failed to top up wallet' });
  }
};
