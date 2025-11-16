import { pool } from '../../config/db';
import { AppError } from '../../middleware/error.middleware';
import logger from '../../utils/logger';
import bcrypt from 'bcryptjs';
import * as mysql from 'mysql2/promise';
import { v4 as uuidv4 } from 'uuid';
import { findUserBySerialCode } from '../services/serial-code.service';
import { mtnService } from '../../services/mtn-momo.service';

/**
 * Set wallet PIN for passenger
 */
export const setWalletPIN = async (userId: number, pin: string): Promise<void> => {
    if (!pin || pin.length !== 4 || !/^\d{4}$/.test(pin)) {
        throw new AppError('PIN must be exactly 4 digits', 400);
    }
    
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        
        // Get wallet
        const [wallets] = await connection.execute<mysql.RowDataPacket[]>(
            'SELECT id FROM wallets WHERE user_id = ?',
            [userId]
        );
        
        if (wallets.length === 0) {
            throw new AppError('Wallet not found', 404);
        }
        
        // Hash PIN
        const hashedPin = await bcrypt.hash(pin, 10);
        
        // Update wallet PIN
        await connection.execute(
            `UPDATE wallets SET pin_hash = ?, pin_set = TRUE, updated_at = NOW() 
             WHERE user_id = ?`,
            [hashedPin, userId]
        );
        
        await connection.commit();
        logger.info(`Wallet PIN set for user: ${userId}`);
    } catch (error: any) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

/**
 * Verify wallet PIN
 */
export const verifyWalletPIN = async (userId: number, pin: string): Promise<boolean> => {
    const [wallets] = await pool.execute<mysql.RowDataPacket[]>(
        'SELECT pin_hash FROM wallets WHERE user_id = ? AND pin_set = TRUE',
        [userId]
    );
    
    if (wallets.length === 0) {
        return false;
    }
    
    return await bcrypt.compare(pin, wallets[0].pin_hash);
};

/**
 * Agent deposit to passenger account using serial code
 * Agent gets 1.5% commission from company
 */
export const agentDepositToPassenger = async (
    agentId: number,
    passengerSerialCode: string,
    amount: number,
    agentPin: string
): Promise<any> => {
    if (!amount || amount <= 0) {
        throw new AppError('Invalid deposit amount', 400);
    }
    
    if (amount < 1000 || amount > 500000) {
        throw new AppError('Deposit amount must be between 1,000 and 500,000 RWF', 400);
    }
    
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        
        // Verify agent PIN
        const [agentWallets] = await connection.execute<mysql.RowDataPacket[]>(
            'SELECT pin_hash FROM wallets WHERE user_id = ? AND pin_set = TRUE',
            [agentId]
        );
        
        if (agentWallets.length === 0 || !await bcrypt.compare(agentPin, agentWallets[0].pin_hash)) {
            throw new AppError('Invalid agent PIN', 401);
        }
        
        // Get agent details and company
        const [agents] = await connection.execute<mysql.RowDataPacket[]>(
            `SELECT u.id, u.company_id, u.role, c.name as company_name
             FROM users u
             LEFT JOIN companies c ON u.company_id = c.id
             WHERE u.id = ? AND u.role = 'agent'`,
            [agentId]
        );
        
        if (agents.length === 0) {
            throw new AppError('Agent not found', 404);
        }
        
        const agent = agents[0];
        if (!agent.company_id) {
            throw new AppError('Agent must be assigned to a company', 400);
        }
        
        // Find passenger by serial code
        const passenger = await findUserBySerialCode(passengerSerialCode);
        if (!passenger) {
            throw new AppError('Passenger not found with this serial code', 404);
        }
        
        // Calculate commission (1.5% from company)
        const commission = amount * 0.015;
        const netAmount = amount - commission; // Passenger gets full amount, company pays commission
        
        // Get passenger wallet
        const [passengerWallets] = await connection.execute<mysql.RowDataPacket[]>(
            'SELECT id, balance FROM wallets WHERE user_id = ?',
            [passenger.id]
        );
        
        if (passengerWallets.length === 0) {
            throw new AppError('Passenger wallet not found', 404);
        }
        
        const passengerWallet = passengerWallets[0];
        
        // Get company wallet
        const [companyWallets] = await connection.execute<mysql.RowDataPacket[]>(
            'SELECT id, balance FROM wallets WHERE user_id = ?',
            [agent.company_id]
        );
        
        let companyWalletId;
        if (companyWallets.length === 0) {
            // Create company wallet if doesn't exist
            const [result] = await connection.execute<mysql.ResultSetHeader>(
                'INSERT INTO wallets (user_id, balance, created_at) VALUES (?, 0, NOW())',
                [agent.company_id]
            );
            companyWalletId = result.insertId;
        } else {
            companyWalletId = companyWallets[0].id;
        }
        
        // Deduct commission from company wallet
        await connection.execute(
            'UPDATE wallets SET balance = balance - ? WHERE id = ?',
            [commission, companyWalletId]
        );
        
        // Add amount to passenger wallet
        await connection.execute(
            'UPDATE wallets SET balance = balance + ? WHERE id = ?',
            [amount, passengerWallet.id]
        );
        
        // Record transaction
        const transactionId = uuidv4();
        await connection.execute(
            `INSERT INTO wallet_transactions 
             (wallet_id, amount, type, description, reference, status, created_at)
             VALUES (?, ?, 'credit', ?, ?, 'completed', NOW())`,
            [
                passengerWallet.id,
                amount,
                `Agent Deposit by Agent #${agentId} via Serial ${passengerSerialCode}`,
                transactionId
            ]
        );
        
        // Record commission transaction
        await connection.execute(
            `INSERT INTO wallet_transactions 
             (wallet_id, amount, type, description, reference, status, created_at)
             VALUES (?, ?, 'debit', ?, ?, 'completed', NOW())`,
            [
                companyWalletId,
                commission,
                `Agent Commission (1.5%) for deposit to ${passengerSerialCode}`,
                `COMM-${transactionId}`
            ]
        );
        
        // Record agent activity
        await connection.execute(
            `INSERT INTO agent_transactions 
             (agent_id, passenger_id, amount, commission, type, status, reference, created_at)
             VALUES (?, ?, ?, ?, 'deposit', 'completed', ?, NOW())`,
            [agentId, passenger.id, amount, commission, transactionId]
        );
        
        await connection.commit();
        
        logger.info(`Agent deposit: Agent ${agentId} deposited ${amount} RWF to ${passengerSerialCode}`);
        
        return {
            success: true,
            transactionId,
            amount,
            commission,
            passengerSerialCode,
            passengerName: passenger.name,
            newBalance: parseFloat(passengerWallet.balance) + amount
        };
    } catch (error: any) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

/**
 * Passenger to passenger money transfer using serial codes
 */
export const transferBetweenPassengers = async (
    fromUserId: number,
    toSerialCode: string,
    amount: number,
    pin: string
): Promise<any> => {
    if (!amount || amount <= 0) {
        throw new AppError('Invalid transfer amount', 400);
    }
    
    if (amount < 100 || amount > 50000) {
        throw new AppError('Transfer amount must be between 100 and 50,000 RWF', 400);
    }
    
    // Verify PIN
    const isValidPin = await verifyWalletPIN(fromUserId, pin);
    if (!isValidPin) {
        throw new AppError('Invalid wallet PIN', 401);
    }
    
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        
        // Get sender wallet
        const [senderWallets] = await connection.execute<mysql.RowDataPacket[]>(
            'SELECT id, balance FROM wallets WHERE user_id = ?',
            [fromUserId]
        );
        
        if (senderWallets.length === 0) {
            throw new AppError('Sender wallet not found', 404);
        }
        
        const senderWallet = senderWallets[0];
        
        if (parseFloat(senderWallet.balance) < amount) {
            throw new AppError('Insufficient wallet balance', 400);
        }
        
        // Find recipient by serial code
        const recipient = await findUserBySerialCode(toSerialCode);
        if (!recipient) {
            throw new AppError('Recipient not found with this serial code', 404);
        }
        
        if (recipient.id === fromUserId) {
            throw new AppError('Cannot transfer to yourself', 400);
        }
        
        // Get recipient wallet
        const [recipientWallets] = await connection.execute<mysql.RowDataPacket[]>(
            'SELECT id, balance FROM wallets WHERE user_id = ?',
            [recipient.id]
        );
        
        if (recipientWallets.length === 0) {
            throw new AppError('Recipient wallet not found', 404);
        }
        
        const recipientWallet = recipientWallets[0];
        
        // Deduct from sender
        await connection.execute(
            'UPDATE wallets SET balance = balance - ? WHERE id = ?',
            [amount, senderWallet.id]
        );
        
        // Add to recipient
        await connection.execute(
            'UPDATE wallets SET balance = balance + ? WHERE id = ?',
            [amount, recipientWallet.id]
        );
        
        // Record transactions
        const transactionId = uuidv4();
        
        // Sender transaction
        await connection.execute(
            `INSERT INTO wallet_transactions 
             (wallet_id, amount, type, description, reference, status, created_at)
             VALUES (?, ?, 'debit', ?, ?, 'completed', NOW())`,
            [
                senderWallet.id,
                amount,
                `Transfer to ${toSerialCode}`,
                transactionId
            ]
        );
        
        // Recipient transaction
        await connection.execute(
            `INSERT INTO wallet_transactions 
             (wallet_id, amount, type, description, reference, status, created_at)
             VALUES (?, ?, 'credit', ?, ?, 'completed', NOW())`,
            [
                recipientWallet.id,
                amount,
                `Transfer from Serial Code`,
                transactionId
            ]
        );
        
        await connection.commit();
        
        logger.info(`Transfer: User ${fromUserId} transferred ${amount} RWF to ${toSerialCode}`);
        
        return {
            success: true,
            transactionId,
            amount,
            recipientSerialCode: toSerialCode,
            recipientName: recipient.name,
            newBalance: parseFloat(senderWallet.balance) - amount
        };
    } catch (error: any) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

/**
 * Company withdrawal with 3% admin fee
 */
export const companyWithdrawal = async (
    companyId: number,
    amount: number,
    phoneNumber: string,
    pin: string
): Promise<any> => {
    if (!amount || amount <= 0) {
        throw new AppError('Invalid withdrawal amount', 400);
    }
    
    if (amount < 5000 || amount > 10000000) {
        throw new AppError('Withdrawal amount must be between 5,000 and 10,000,000 RWF', 400);
    }
    
    // Validate phone number
    const phoneRegex = /^(\+?250|0)?[7][0-9]{8}$/;
    const normalizedPhone = phoneNumber.replace(/\s/g, '');
    if (!phoneRegex.test(normalizedPhone)) {
        throw new AppError('Invalid phone number format', 400);
    }
    
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        
        // Get company wallet
        const [companyWallets] = await connection.execute<mysql.RowDataPacket[]>(
            'SELECT id, balance, pin_hash FROM wallets WHERE user_id = ? AND pin_set = TRUE',
            [companyId]
        );
        
        if (companyWallets.length === 0) {
            throw new AppError('Company wallet not found or PIN not set', 404);
        }
        
        const companyWallet = companyWallets[0];
        
        // Verify PIN
        if (!await bcrypt.compare(pin, companyWallet.pin_hash)) {
            throw new AppError('Invalid wallet PIN', 401);
        }
        
        // Calculate admin fee (3%)
        const adminFee = amount * 0.03;
        const totalDeduction = amount + adminFee;
        const netAmount = amount; // Amount sent to company
        
        if (parseFloat(companyWallet.balance) < totalDeduction) {
            throw new AppError('Insufficient wallet balance (including 3% admin fee)', 400);
        }
        
        // Get admin wallet (or platform wallet)
        const [adminWallets] = await connection.execute<mysql.RowDataPacket[]>(
            `SELECT id FROM wallets WHERE user_id IN 
             (SELECT id FROM users WHERE role = 'admin' LIMIT 1)`
        );
        
        let adminWalletId;
        if (adminWallets.length > 0) {
            adminWalletId = adminWallets[0].id;
        } else {
            // Create platform wallet if doesn't exist
            const [result] = await connection.execute<mysql.ResultSetHeader>(
                `INSERT INTO wallets (user_id, balance, created_at) 
                 VALUES ((SELECT id FROM users WHERE role = 'admin' LIMIT 1), 0, NOW())`
            );
            adminWalletId = result.insertId;
        }
        
        // Deduct total from company wallet
        await connection.execute(
            'UPDATE wallets SET balance = balance - ? WHERE id = ?',
            [totalDeduction, companyWallet.id]
        );
        
        // Add fee to admin/platform wallet
        await connection.execute(
            'UPDATE wallets SET balance = balance + ? WHERE id = ?',
            [adminFee, adminWalletId]
        );
        
        // Initiate MTN disbursement
        const externalId = `WD-${companyId}-${Date.now()}-${uuidv4().substring(0, 8)}`;
        const mtnResult = await mtnService.deposit({
            amount: netAmount,
            phoneNumber: normalizedPhone,
            externalId,
            payerMessage: `GoBus Company Withdrawal`,
            payeeNote: `Company earnings withdrawal`
        });
        
        // Record transaction
        const transactionId = uuidv4();
        await connection.execute(
            `INSERT INTO wallet_transactions 
             (wallet_id, amount, type, description, reference, status, metadata, created_at)
             VALUES (?, ?, 'debit', ?, ?, 'processing', ?, NOW())`,
            [
                companyWallet.id,
                totalDeduction,
                `Company Withdrawal (3% fee)`,
                transactionId,
                JSON.stringify({
                    netAmount,
                    adminFee,
                    phoneNumber: normalizedPhone,
                    mtnReferenceId: mtnResult.referenceId,
                    externalId
                })
            ]
        );
        
        // Record admin fee transaction
        await connection.execute(
            `INSERT INTO wallet_transactions 
             (wallet_id, amount, type, description, reference, status, created_at)
             VALUES (?, ?, 'credit', ?, ?, 'completed', NOW())`,
            [
                adminWalletId,
                adminFee,
                `Admin Fee (3%) from Company Withdrawal`,
                `FEE-${transactionId}`
            ]
        );
        
        await connection.commit();
        
        logger.info(`Company withdrawal: Company ${companyId} withdrew ${amount} RWF (fee: ${adminFee} RWF)`);
        
        return {
            success: true,
            transactionId,
            amount: netAmount,
            adminFee,
            totalDeduction,
            mtnReferenceId: mtnResult.referenceId,
            newBalance: parseFloat(companyWallet.balance) - totalDeduction
        };
    } catch (error: any) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

