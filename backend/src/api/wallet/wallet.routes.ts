import { Router } from 'express';
import { authenticateToken, authorizeRoles } from '../../middleware/auth.middleware';
import { 
  getWalletHistory, 
  topUpWallet, 
  setPin, 
  transferFunds, 
  depositViaMTN,
  withdrawToMTN,
  agentDeposit,
  getPaymentStatus,
  getMTNBalance
} from './wallet.controller';
import * as enhancedWalletService from './enhanced-wallet.service';
import { catchAsync } from '../../middleware/error.middleware';
import { pool } from '../../config/db';
import * as mysql from 'mysql2/promise';

const router = Router();

// All routes in this file are protected
router.use(authenticateToken);

router.route('/history').get(getWalletHistory);
router.route('/topup').post(topUpWallet);
router.route('/deposit/mtn').post(depositViaMTN);
router.route('/withdraw/mtn').post(withdrawToMTN);
router.route('/agent-deposit').post(agentDeposit);
router.route('/payment-status/:referenceId').get(getPaymentStatus);
router.route('/mtn-balance').get(getMTNBalance);
router.route('/set-pin').put(setPin);
router.route('/transfer').post(transferFunds);

// Enhanced wallet routes
router.put('/setup-pin', catchAsync(async (req: any, res) => {
    const { pin } = req.body;
    await enhancedWalletService.setWalletPIN(req.user.id, pin);
    res.json({ success: true, message: 'Wallet PIN set successfully' });
}));

router.post('/transfer-by-serial', catchAsync(async (req: any, res) => {
    const { toSerialCode, amount, pin } = req.body;
    if (req.user.role !== 'passenger') {
        return res.status(403).json({ success: false, message: 'Only passengers can transfer money' });
    }
    const result = await enhancedWalletService.transferBetweenPassengers(
        req.user.id,
        toSerialCode,
        amount,
        pin
    );
    res.json({ success: true, data: result });
}));

router.post('/agent/deposit-by-serial', authorizeRoles(['agent']), catchAsync(async (req: any, res) => {
    const { passengerSerialCode, amount, pin } = req.body;
    const result = await enhancedWalletService.agentDepositToPassenger(
        req.user.id,
        passengerSerialCode,
        amount,
        pin
    );
    res.json({ success: true, data: result });
}));

router.post('/company/withdraw', authorizeRoles(['company']), catchAsync(async (req: any, res) => {
    const { amount, phoneNumber, pin } = req.body;
    const result = await enhancedWalletService.companyWithdrawal(
        req.user.id,
        amount,
        phoneNumber,
        pin
    );
    res.json({ success: true, data: result });
}));

router.get('/balance', catchAsync(async (req: any, res) => {
    const [wallets] = await pool.execute(
        `SELECT w.*, u.serial_code 
         FROM wallets w
         JOIN users u ON w.user_id = u.id
         WHERE w.user_id = ?`,
        [req.user.id]
    );
    
    if (!wallets || wallets.length === 0) {
        return res.json({ success: true, data: { balance: 0, pin_set: false, serial_code: null } });
    }
    
    const wallet = wallets[0];
    res.json({
        success: true,
        data: {
            balance: wallet.balance || 0,
            pin_set: wallet.pin_set || false,
            serial_code: wallet.serial_code
        }
    });
}));

export default router;
