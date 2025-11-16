import * as agentService from './agent.service';
import asyncHandler from '../../utils/asyncHandler';

export const getMyDashboard = asyncHandler(async (req, res) => {
    const stats = await agentService.getDashboardData(req.user.id);
    res.status(200).json({ success: true, data: stats });
});

export const lookupPassenger = asyncHandler(async (req, res) => {
    const passenger = await agentService.findPassengerBySerial(req.params.serialCode);
    res.status(200).json({ success: true, data: passenger });
});

export const makeDeposit = asyncHandler(async (req, res) => {
    const { passengerSerial, amount } = req.body;
    const result = await agentService.makeDepositForPassenger(req.user.id, passengerSerial, amount);
    res.status(200).json({ success: true, data: result });
});

export const getMyTransactions = asyncHandler(async (req, res) => {
    const transactions = await agentService.getTransactionHistory(req.user.id);
    res.status(200).json({ success: true, data: transactions });
});