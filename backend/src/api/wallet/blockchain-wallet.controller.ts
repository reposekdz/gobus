import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';
import { pool } from '../../config/db';
import logger from '../../utils/logger';
import * as mysql from 'mysql2/promise';

interface BlockchainTransaction {
  id: string;
  from_wallet: string;
  to_wallet: string;
  amount: number;
  transaction_type: 'transfer' | 'deposit' | 'withdrawal' | 'payment' | 'refund';
  currency: string;
  hash: string;
  block_number: number;
  gas_fee: number;
  status: 'pending' | 'confirmed' | 'failed';
  metadata?: any;
}

interface Block {
  index: number;
  timestamp: string;
  transactions: BlockchainTransaction[];
  previous_hash: string;
  hash: string;
  nonce: number;
}

export class BlockchainWalletController {
  // Create blockchain wallet
  static async createWallet(req: Request, res: Response) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      const userId = (req as any).user?.id;
      const { wallet_type = 'user', currency = 'RWF' } = req.body;

      // Check if wallet already exists
      const [existingWallet] = await connection.execute(
        'SELECT id FROM blockchain_wallets WHERE user_id = ? AND currency = ?',
        [userId, currency]
      );

      if (Array.isArray(existingWallet) && existingWallet.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'Wallet already exists for this currency'
        });
      }

      // Generate wallet credentials
      const walletId = uuidv4();
      const privateKey = crypto.randomBytes(32).toString('hex');
      const publicKey = crypto.createHash('sha256').update(privateKey).digest('hex');
      const walletAddress = `0x${crypto.createHash('sha256').update(publicKey).digest('hex').substring(0, 40)}`;
      
      // Encrypt private key
      const encryptionKey = process.env.WALLET_ENCRYPTION_KEY || 'default-key';
      const cipher = crypto.createCipher('aes-256-cbc', encryptionKey);
      let encryptedPrivateKey = cipher.update(privateKey, 'utf8', 'hex');
      encryptedPrivateKey += cipher.final('hex');

      // Create wallet
      await connection.execute(`
        INSERT INTO blockchain_wallets (
          id, user_id, wallet_address, public_key, encrypted_private_key,
          wallet_type, currency, balance, status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 0.00, 'active', NOW(), NOW())
      `, [
        walletId, userId, walletAddress, publicKey, encryptedPrivateKey,
        wallet_type, currency
      ]);

      // Create genesis transaction for new wallet
      const genesisTransactionId = uuidv4();
      const genesisHash = this.calculateTransactionHash({
        id: genesisTransactionId,
        from_wallet: 'genesis',
        to_wallet: walletAddress,
        amount: 0,
        transaction_type: 'deposit',
        currency,
        hash: '',
        block_number: 0,
        gas_fee: 0,
        status: 'confirmed'
      });

      await connection.execute(`
        INSERT INTO blockchain_transactions (
          id, from_wallet, to_wallet, amount, transaction_type, currency,
          hash, block_number, gas_fee, status, user_id, created_at, updated_at
        ) VALUES (?, 'genesis', ?, 0, 'deposit', ?, ?, 0, 0, 'confirmed', ?, NOW(), NOW())
      `, [genesisTransactionId, walletAddress, currency, genesisHash, userId]);

      await connection.commit();

      logger.info(`Blockchain wallet created: ${walletId}`, {
        walletId,
        userId,
        walletAddress,
        currency
      });

      res.status(201).json({
        success: true,
        message: 'Blockchain wallet created successfully',
        data: {
          wallet: {
            id: walletId,
            address: walletAddress,
            public_key: publicKey,
            currency,
            balance: 0,
            status: 'active'
          }
        }
      });

    } catch (error: any) {
      await connection.rollback();
      logger.error('Error creating blockchain wallet:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create blockchain wallet',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    } finally {
      connection.release();
    }
  }

  // Transfer funds between wallets
  static async transferFunds(req: Request, res: Response) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      const { to_address, amount, currency = 'RWF', notes } = req.body;
      const userId = (req as any).user?.id;

      // Get sender wallet
      const [senderWallet] = await connection.execute(
        'SELECT * FROM blockchain_wallets WHERE user_id = ? AND currency = ? AND status = "active"',
        [userId, currency]
      );

      if (!Array.isArray(senderWallet) || senderWallet.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Sender wallet not found'
        });
      }

      const sender = senderWallet[0] as any;

      // Get receiver wallet
      const [receiverWallet] = await connection.execute(
        'SELECT * FROM blockchain_wallets WHERE wallet_address = ? AND currency = ? AND status = "active"',
        [to_address, currency]
      );

      if (!Array.isArray(receiverWallet) || receiverWallet.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Receiver wallet not found'
        });
      }

      const receiver = receiverWallet[0] as any;

      // Check balance
      if (sender.balance < amount) {
        return res.status(400).json({
          success: false,
          message: 'Insufficient balance'
        });
      }

      // Calculate gas fee (0.1% of transaction amount, minimum 10 RWF)
      const gasFee = Math.max(amount * 0.001, 10);
      const totalDeduction = amount + gasFee;

      if (sender.balance < totalDeduction) {
        return res.status(400).json({
          success: false,
          message: 'Insufficient balance including gas fees'
        });
      }

      // Get current block number
      const [lastBlock] = await connection.execute(
        'SELECT MAX(block_number) as last_block FROM blockchain_transactions'
      );
      const blockNumber = ((lastBlock as any)[0].last_block || 0) + 1;

      // Create transaction
      const transactionId = uuidv4();
      const transaction: BlockchainTransaction = {
        id: transactionId,
        from_wallet: sender.wallet_address,
        to_wallet: to_address,
        amount,
        transaction_type: 'transfer',
        currency,
        hash: '',
        block_number: blockNumber,
        gas_fee: gasFee,
        status: 'pending',
        metadata: { notes }
      };

      // Calculate transaction hash
      transaction.hash = this.calculateTransactionHash(transaction);

      // Save transaction
      await connection.execute(`
        INSERT INTO blockchain_transactions (
          id, from_wallet, to_wallet, amount, transaction_type, currency,
          hash, block_number, gas_fee, status, metadata, user_id, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, NOW(), NOW())
      `, [
        transactionId, sender.wallet_address, to_address, amount, 'transfer',
        currency, transaction.hash, blockNumber, gasFee, JSON.stringify({ notes }), userId
      ]);

      // Update balances
      await connection.execute(
        'UPDATE blockchain_wallets SET balance = balance - ?, updated_at = NOW() WHERE id = ?',
        [totalDeduction, sender.id]
      );

      await connection.execute(
        'UPDATE blockchain_wallets SET balance = balance + ?, updated_at = NOW() WHERE id = ?',
        [amount, receiver.id]
      );

      // Mine the block (simplified mining process)
      const blockHash = await this.mineBlock(connection, blockNumber, [transaction]);

      // Update transaction status
      await connection.execute(
        'UPDATE blockchain_transactions SET status = "confirmed", updated_at = NOW() WHERE id = ?',
        [transactionId]
      );

      await connection.commit();

      logger.info(`Blockchain transfer completed: ${transactionId}`, {
        transactionId,
        fromAddress: sender.wallet_address,
        toAddress: to_address,
        amount,
        gasFee,
        blockNumber,
        hash: transaction.hash
      });

      res.json({
        success: true,
        message: 'Transfer completed successfully',
        data: {
          transaction: {
            id: transactionId,
            hash: transaction.hash,
            from_address: sender.wallet_address,
            to_address,
            amount,
            gas_fee: gasFee,
            block_number: blockNumber,
            status: 'confirmed'
          }
        }
      });

    } catch (error: any) {
      await connection.rollback();
      logger.error('Error transferring funds:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to transfer funds',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    } finally {
      connection.release();
    }
  }

  // Get wallet balance and details
  static async getWalletDetails(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const { currency = 'RWF' } = req.query;

      const [wallet] = await pool.execute(`
        SELECT 
          bw.*,
          COUNT(DISTINCT bt_sent.id) as transactions_sent,
          COUNT(DISTINCT bt_received.id) as transactions_received,
          SUM(CASE WHEN bt_sent.status = 'confirmed' THEN bt_sent.amount + bt_sent.gas_fee ELSE 0 END) as total_sent,
          SUM(CASE WHEN bt_received.status = 'confirmed' THEN bt_received.amount ELSE 0 END) as total_received
        FROM blockchain_wallets bw
        LEFT JOIN blockchain_transactions bt_sent ON bw.wallet_address = bt_sent.from_wallet
        LEFT JOIN blockchain_transactions bt_received ON bw.wallet_address = bt_received.to_wallet
        WHERE bw.user_id = ? AND bw.currency = ?
        GROUP BY bw.id
      `, [userId, currency]);

      if (!Array.isArray(wallet) || wallet.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Wallet not found'
        });
      }

      // Get recent transactions
      const [recentTransactions] = await pool.execute(`
        SELECT 
          id, from_wallet, to_wallet, amount, transaction_type, currency,
          hash, block_number, gas_fee, status, created_at
        FROM blockchain_transactions
        WHERE (from_wallet = ? OR to_wallet = ?) AND currency = ?
        ORDER BY created_at DESC
        LIMIT 10
      `, [wallet[0].wallet_address, wallet[0].wallet_address, currency]);

      res.json({
        success: true,
        data: {
          wallet: wallet[0],
          recent_transactions: recentTransactions
        }
      });

    } catch (error: any) {
      logger.error('Error fetching wallet details:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch wallet details',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Get transaction history
  static async getTransactionHistory(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const { currency = 'RWF', page = 1, limit = 20, type } = req.query;

      // Get user wallet address
      const [wallet] = await pool.execute(
        'SELECT wallet_address FROM blockchain_wallets WHERE user_id = ? AND currency = ?',
        [userId, currency]
      );

      if (!Array.isArray(wallet) || wallet.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Wallet not found'
        });
      }

      const walletAddress = wallet[0].wallet_address;
      const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

      let whereClause = 'WHERE (from_wallet = ? OR to_wallet = ?) AND currency = ?';
      const params: any[] = [walletAddress, walletAddress, currency];

      if (type) {
        whereClause += ' AND transaction_type = ?';
        params.push(type);
      }

      const [transactions] = await pool.execute(`
        SELECT 
          id, from_wallet, to_wallet, amount, transaction_type, currency,
          hash, block_number, gas_fee, status, metadata, created_at
        FROM blockchain_transactions
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `, [...params, parseInt(limit as string), offset]);

      const [countResult] = await pool.execute(`
        SELECT COUNT(*) as total
        FROM blockchain_transactions
        ${whereClause}
      `, params);

      const total = (countResult as any)[0].total;

      res.json({
        success: true,
        data: {
          transactions,
          pagination: {
            page: parseInt(page as string),
            limit: parseInt(limit as string),
            total,
            pages: Math.ceil(total / parseInt(limit as string))
          }
        }
      });

    } catch (error: any) {
      logger.error('Error fetching transaction history:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch transaction history',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Deposit funds to wallet
  static async depositFunds(req: Request, res: Response) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      const { amount, currency = 'RWF', payment_method, reference } = req.body;
      const userId = (req as any).user?.id;

      // Get wallet
      const [wallet] = await connection.execute(
        'SELECT * FROM blockchain_wallets WHERE user_id = ? AND currency = ? AND status = "active"',
        [userId, currency]
      );

      if (!Array.isArray(wallet) || wallet.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Wallet not found'
        });
      }

      const userWallet = wallet[0] as any;

      // Get current block number
      const [lastBlock] = await connection.execute(
        'SELECT MAX(block_number) as last_block FROM blockchain_transactions'
      );
      const blockNumber = ((lastBlock as any)[0].last_block || 0) + 1;

      // Create deposit transaction
      const transactionId = uuidv4();
      const transaction: BlockchainTransaction = {
        id: transactionId,
        from_wallet: 'system',
        to_wallet: userWallet.wallet_address,
        amount,
        transaction_type: 'deposit',
        currency,
        hash: '',
        block_number: blockNumber,
        gas_fee: 0,
        status: 'confirmed',
        metadata: { payment_method, reference }
      };

      transaction.hash = this.calculateTransactionHash(transaction);

      // Save transaction
      await connection.execute(`
        INSERT INTO blockchain_transactions (
          id, from_wallet, to_wallet, amount, transaction_type, currency,
          hash, block_number, gas_fee, status, metadata, user_id, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'confirmed', ?, ?, NOW(), NOW())
      `, [
        transactionId, 'system', userWallet.wallet_address, amount, 'deposit',
        currency, transaction.hash, blockNumber, 0, JSON.stringify({ payment_method, reference }), userId
      ]);

      // Update wallet balance
      await connection.execute(
        'UPDATE blockchain_wallets SET balance = balance + ?, updated_at = NOW() WHERE id = ?',
        [amount, userWallet.id]
      );

      await connection.commit();

      logger.info(`Funds deposited: ${transactionId}`, {
        transactionId,
        userId,
        amount,
        currency,
        paymentMethod: payment_method
      });

      res.json({
        success: true,
        message: 'Funds deposited successfully',
        data: {
          transaction: {
            id: transactionId,
            hash: transaction.hash,
            amount,
            new_balance: userWallet.balance + amount
          }
        }
      });

    } catch (error: any) {
      await connection.rollback();
      logger.error('Error depositing funds:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to deposit funds',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    } finally {
      connection.release();
    }
  }

  // Helper method to calculate transaction hash
  private static calculateTransactionHash(transaction: BlockchainTransaction): string {
    const data = `${transaction.from_wallet}${transaction.to_wallet}${transaction.amount}${transaction.currency}${transaction.block_number}${Date.now()}`;
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  // Helper method to mine block (simplified)
  private static async mineBlock(connection: any, blockNumber: number, transactions: BlockchainTransaction[]): Promise<string> {
    const previousHash = blockNumber > 1 ? 
      await this.getPreviousBlockHash(connection, blockNumber - 1) : 
      '0000000000000000000000000000000000000000000000000000000000000000';

    const blockData = `${blockNumber}${previousHash}${JSON.stringify(transactions)}${Date.now()}`;
    let nonce = 0;
    let hash = '';

    // Simple proof of work (find hash starting with '0000')
    do {
      nonce++;
      hash = crypto.createHash('sha256').update(blockData + nonce).digest('hex');
    } while (!hash.startsWith('0000'));

    // Save block
    await connection.execute(`
      INSERT INTO blockchain_blocks (
        block_number, previous_hash, hash, nonce, transactions_count, created_at
      ) VALUES (?, ?, ?, ?, ?, NOW())
    `, [blockNumber, previousHash, hash, nonce, transactions.length]);

    return hash;
  }

  // Helper method to get previous block hash
  private static async getPreviousBlockHash(connection: any, blockNumber: number): Promise<string> {
    const [result] = await connection.execute(
      'SELECT hash FROM blockchain_blocks WHERE block_number = ?',
      [blockNumber]
    );
    return Array.isArray(result) && result.length > 0 ? (result[0] as any).hash : '';
  }
}