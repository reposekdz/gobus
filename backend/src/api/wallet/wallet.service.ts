import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { pool } from '../../config/db';
import { mtnService } from '../../services/mtn-momo.service';
import logger from '../../utils/logger';
import { AppError } from '../../middleware/error.middleware';
import * as mysql from 'mysql2/promise';


export const topUpUserWallet = async (userId: number, amount: number) => {
    if (!amount || amount <= 0) {
        throw new AppError('Please provide a valid amount to top up.', 400);
    }
    
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const [walletRows] = await connection.query('SELECT id, balance FROM wallets WHERE user_id = ?', [userId]);
        let walletId;
        let newBalance;

        if (walletRows.length > 0) {
            walletId = walletRows[0].id;
            await connection.query('UPDATE wallets SET balance = balance + ? WHERE id = ?', [amount, walletId]);
            newBalance = parseFloat(walletRows[0].balance) + amount;
        } else {
            const [, result] = await connection.query('INSERT INTO wallets (user_id, balance) VALUES (?, ?)', [userId, amount]);
            walletId = result.insertId;
            newBalance = amount;
        }

        await connection.query(
            'INSERT INTO wallet_transactions (wallet_id, amount, type, description) VALUES (?, ?, ?, ?)',
            [walletId, amount, 'deposit', 'User-initiated wallet top-up']
        );
        
        await connection.commit();
        
        // Return only the updated balance with consistent snake_case
        return { wallet_balance: newBalance };

    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

/**
 * Deposit money to user wallet via MTN Mobile Money
 */
export const depositViaMTN = async (userId: number, amount: number, phoneNumber: string) => {
    if (!amount || amount <= 0) {
        throw new AppError('Please provide a valid amount to deposit.', 400);
    }

    if (!phoneNumber || !phoneNumber.match(/^(\+250|250)?[0-9]{9}$/)) {
        throw new AppError('Please provide a valid Rwandan phone number.', 400);
    }

    const connection = await pool.getConnection();
    try {
        // Get minimum deposit amount from settings
        const [settings] = await connection.execute(
            `SELECT setting_value FROM settings WHERE setting_key = 'mtn_min_deposit'`
        );
        const minDeposit = parseInt((settings as any[] & mysql.RowDataPacket[])[0]?.setting_value || '1000');

        if (amount < minDeposit) {
            throw new AppError(`Minimum deposit amount is ${minDeposit} RWF.`, 400);
        }

        // Get maximum deposit amount from settings
        const [maxSettings] = await connection.execute(
            `SELECT setting_value FROM settings WHERE setting_key = 'mtn_max_deposit'`
        );
        const maxDeposit = parseInt((maxSettings as any[] & mysql.RowDataPacket[])[0]?.setting_value || '5000000');

        if (amount > maxDeposit) {
            throw new AppError(`Maximum deposit amount is ${maxDeposit} RWF.`, 400);
        }
        await connection.beginTransaction();

        // Generate external ID
        const externalId = `DEP-${userId}-${Date.now()}-${uuidv4().substring(0, 8)}`;

        // Initiate MTN payment
        const mtnResult = await mtnService.requestPayment({
            amount,
            phoneNumber,
            externalId,
            payerMessage: `Deposit ${amount} RWF to GoBus Wallet`,
            payeeNote: `Wallet deposit for user ${userId}`
        });

        // Record MTN transaction
        const [mtnTransactionResult] = await connection.execute(
            `INSERT INTO mtn_transactions (
                user_id, transaction_type, operation_type, reference_id, external_id,
                amount, currency, phone_number, payer_message, payee_note, status,
                request_data
            ) VALUES (?, 'collection', 'request_to_pay', ?, ?, ?, 'EUR', ?, ?, ?, 'pending', ?)`,
            [
                userId,
                mtnResult.referenceId,
                externalId,
                amount,
                phoneNumber,
                `Deposit ${amount} RWF to GoBus Wallet`,
                `Wallet deposit for user ${userId}`,
                JSON.stringify({
                    amount,
                    phoneNumber,
                    externalId,
                    mtnReferenceId: mtnResult.referenceId
                })
            ]
        );

        const mtnTransactionId = (mtnTransactionResult as any).insertId;

        // Get or create wallet
        const [walletRows] = await connection.query(
            'SELECT id FROM wallets WHERE user_id = ?',
            [userId]
        );

        let walletId;
        if (walletRows.length === 0) {
            const [, result] = await connection.query(
                'INSERT INTO wallets (user_id, balance) VALUES (?, 0)',
                [userId]
            );
            walletId = result.insertId;
        } else {
            walletId = walletRows[0].id;
        }

        // Record pending wallet transaction
        await connection.execute(
            `INSERT INTO wallet_transactions (
                wallet_id, transaction_type, amount, balance_before, balance_after,
                description, reference, mtn_transaction_id, status
            ) VALUES (?, 'credit', ?, 0, 0, ?, ?, ?, 'pending')`,
            [
                walletId,
                amount,
                `MTN Deposit - ${amount} RWF`,
                externalId,
                mtnTransactionId
            ]
        );

        await connection.commit();

        // Start polling for payment status
        setTimeout(() => checkMTNDepositStatus(mtnResult.referenceId, userId, amount), 10000);

        logger.info('MTN deposit initiated', {
            userId,
            amount,
            phoneNumber,
            mtnReferenceId: mtnResult.referenceId,
            externalId
        });

        return {
            success: true,
            message: 'Deposit request sent to your phone. Please complete the payment.',
            data: {
                reference_id: mtnResult.referenceId,
                external_id: externalId,
                amount,
                phone_number: phoneNumber,
                status: 'pending'
            }
        };

    } catch (error: any) {
        await connection.rollback();
        logger.error('Error initiating MTN deposit', {
            error: error.message,
            userId,
            amount,
            phoneNumber
        });
        throw error;
    } finally {
        connection.release();
    }
};

/**
 * Check MTN deposit status and complete transaction if successful
 */
const checkMTNDepositStatus = async (mtnReferenceId: string, userId: number, amount: number) => {
    try {
        const status = await mtnService.getCollectionPaymentStatus(mtnReferenceId);

        // Update MTN transaction
        await pool.execute(
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
            await completeMTNDeposit(mtnReferenceId, userId, amount);
        } else if (status.status === 'FAILED') {
            await failMTNDeposit(mtnReferenceId, userId, 'Transaction failed');
        } else if (status.status === 'PENDING') {
            // Continue polling
            setTimeout(() => checkMTNDepositStatus(mtnReferenceId, userId, amount), 15000);
        }
    } catch (error: any) {
        logger.error('Error checking MTN deposit status', {
            error: error.message,
            mtnReferenceId,
            userId
        });
    }
};

/**
 * Complete successful MTN deposit
 */
const completeMTNDeposit = async (mtnReferenceId: string, userId: number, amount: number) => {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // Get wallet
        const [walletRows] = await connection.query(
            'SELECT id, balance FROM wallets WHERE user_id = ? FOR UPDATE',
            [userId]
        );

        if (walletRows.length === 0) {
            throw new Error('Wallet not found');
        }

        const wallet = walletRows[0];
        const balanceBefore = parseFloat(wallet.balance);
        const balanceAfter = balanceBefore + amount;

        // Update wallet balance
        await connection.execute(
            'UPDATE wallets SET balance = ? WHERE id = ?',
            [balanceAfter, wallet.id]
        );

        // Update wallet transaction
        await connection.execute(
            `UPDATE wallet_transactions
             SET balance_before = ?, balance_after = ?, status = 'completed'
             WHERE mtn_transaction_id = (
                 SELECT id FROM mtn_transactions WHERE reference_id = ?
             )`,
            [balanceBefore, balanceAfter, mtnReferenceId]
        );

        await connection.commit();

        logger.info('MTN deposit completed successfully', {
            userId,
            amount,
            balanceBefore,
            balanceAfter,
            mtnReferenceId
        });

    } catch (error: any) {
        await connection.rollback();
        logger.error('Error completing MTN deposit', {
            error: error.message,
            mtnReferenceId,
            userId
        });
    } finally {
        connection.release();
    }
};

/**
 * Fail MTN deposit
 */
const failMTNDeposit = async (mtnReferenceId: string, userId: number, reason: string) => {
    try {
        // Update wallet transaction status
        await pool.execute(
            `UPDATE wallet_transactions
             SET status = 'failed', description = CONCAT(description, ' - Failed: ', ?)
             WHERE mtn_transaction_id = (
                 SELECT id FROM mtn_transactions WHERE reference_id = ?
             )`,
            [reason, mtnReferenceId]
        );

        logger.info('MTN deposit marked as failed', {
            mtnReferenceId,
            userId,
            reason
        });
    } catch (error: any) {
        logger.error('Error failing MTN deposit', {
            error: error.message,
            mtnReferenceId,
            userId
        });
    }
};

export const getUserWalletHistory = async (userId: number) => {
    const [rows] = await pool.execute(`
        SELECT wt.id, wt.amount, wt.type, wt.description, wt.created_at as createdAt
        FROM wallet_transactions wt
        JOIN wallets w ON wt.wallet_id = w.id
        WHERE w.user_id = ?
        ORDER BY wt.created_at DESC
    `, [userId]);
    return rows;
};

export const setUserPin = async (userId: number, pin: string) => {
    if (!pin || pin.length !== 4 || !/^\d{4}$/.test(pin)) {
        throw new AppError('PIN must be a 4-digit number.', 400);
    }

    const pin_hash = await bcrypt.hash(pin, 10);
    await pool.execute('UPDATE users SET pin = ? WHERE id = ?', [pin_hash, userId]);
};

export const verifyPin = async (userId: number, pin: string) => {
    if (!pin) throw new AppError('PIN is required.', 400);
    
    const [rows] = await pool.execute('SELECT pin FROM users WHERE id = ?', [userId]);
    if (rows.length === 0 || !rows[0].pin) throw new AppError('User not found or no PIN set.', 404);

    const isMatch = await bcrypt.compare(pin, rows[0].pin);
    if (!isMatch) throw new AppError('Invalid PIN.', 401);

    return true;
};

export const transferFunds = async (sender: User, toSerial: string, amount: number, pin: string) => {
    // 1. Validate inputs
    if (!toSerial || !amount || amount <= 0) {
        throw new AppError('Invalid recipient or amount.', 400);
    }
    await verifyPin(sender.id, pin);

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
        // 2. Get recipient
        const [receiverRows] = await connection.query('SELECT id FROM users WHERE serial_code = ? AND id != ?', [toSerial, sender.id]);
        if (receiverRows.length === 0) throw new AppError('Recipient not found.', 404);
        const receiverId = receiverRows[0].id;

        // 3. Lock wallets to prevent race conditions
        const [senderWalletRows] = await connection.query('SELECT id, balance FROM wallets WHERE user_id = ? FOR UPDATE', [sender.id]);
        const [receiverWalletRows] = await connection.query('SELECT id FROM wallets WHERE user_id = ? FOR UPDATE', [receiverId]);

        if (senderWalletRows.length === 0) throw new AppError('Sender wallet not found.', 404);
        if (receiverWalletRows.length === 0) throw new AppError('Recipient wallet not found.', 404);
        
        const senderWallet = senderWalletRows[0];
        const receiverWalletId = receiverWalletRows[0].id;

        // 4. Check balance
        if (parseFloat(senderWallet.balance) < amount) {
            throw new AppError('Insufficient funds.', 400);
        }
        
        // 5. Perform transfers
        await connection.execute('UPDATE wallets SET balance = balance - ? WHERE id = ?', [amount, senderWallet.id]);
        await connection.execute('UPDATE wallets SET balance = balance + ? WHERE id = ?', [amount, receiverWalletId]);

        // 6. Log transactions
        await connection.execute('INSERT INTO wallet_transactions (wallet_id, amount, type, description) VALUES (?, ?, ?, ?)', [senderWallet.id, -amount, 'transfer_out', `Sent to ${toSerial}`]);
        await connection.execute('INSERT INTO wallet_transactions (wallet_id, amount, type, description) VALUES (?, ?, ?, ?)', [receiverWalletId, amount, 'transfer_in', `Received from ${sender.name}`]);

        await connection.commit();

        // 7. Notify recipient in real-time
        // TODO: Re-enable socket notifications when io is properly imported
        // io.to(receiverId.toString()).emit('walletCredit', {
        //     amount,
        //     senderName: sender.name
        // });
        
        const newBalance = parseFloat(senderWallet.balance) - amount;
        return { new_sender_balance: newBalance };
        
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};
