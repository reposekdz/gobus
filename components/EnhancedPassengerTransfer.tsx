import React, { useState, useEffect } from 'react';
import { SearchIcon, UserIcon, PhoneIcon, WalletIcon, CheckCircleIcon, XCircleIcon, PaperAirplaneIcon, InformationCircleIcon, QrCodeIcon } from './icons';
import * as api from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import WalletPINModal from './WalletPINModal';
import Modal from './Modal';

const EnhancedPassengerTransfer: React.FC<{ currentBalance: number; onSuccess: (newBalance: number) => void }> = ({
  currentBalance,
  onSuccess
}) => {
  const { user } = useAuth();
  const [toSerialCode, setToSerialCode] = useState('');
  const [amount, setAmount] = useState('');
  const [recipientInfo, setRecipientInfo] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState('');
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pendingTransfer, setPendingTransfer] = useState<any>(null);
  const [recentTransfers, setRecentTransfers] = useState<any[]>([]);
  const [quickAmounts] = useState([1000, 5000, 10000, 20000, 50000]);
  const [transferFee, setTransferFee] = useState(0);

  useEffect(() => {
    fetchRecentTransfers();
  }, []);

  useEffect(() => {
    if (amount && parseFloat(amount) > 0) {
      // Calculate transfer fee (if any)
      const fee = 0; // No fee for passenger-to-passenger transfers
      setTransferFee(fee);
    }
  }, [amount]);

  const fetchRecentTransfers = async () => {
    try {
      const transactions = await api.getWalletTransactions({ type: 'transfer_out' });
      setRecentTransfers(Array.isArray(transactions) ? transactions.slice(0, 10) : []);
    } catch (err) {
      console.error('Failed to fetch recent transfers', err);
    }
  };

  const handleLookup = async () => {
    if (!toSerialCode.trim()) {
      toast.error('Please enter a serial code');
      return;
    }

    if (toSerialCode.trim().toUpperCase() === user?.serial_code?.toUpperCase()) {
      setError('Cannot transfer to yourself');
      setRecipientInfo(null);
      return;
    }

    setIsSearching(true);
    setError('');
    setRecipientInfo(null);

    try {
      // Lookup recipient by serial code
      const response = await api.get(`/users/lookup/${toSerialCode.trim().toUpperCase()}`);
      
      if (response.success && response.data) {
        setRecipientInfo(response.data);
        toast.success('Recipient found!');
      } else {
        throw new Error('Recipient not found');
      }
    } catch (err: any) {
      setError(err.message || 'Recipient not found with this serial code');
      setRecipientInfo(null);
      toast.error(err.message || 'Recipient not found');
    } finally {
      setIsSearching(false);
    }
  };

  const handleQuickAmount = (quickAmount: number) => {
    setAmount(quickAmount.toString());
  };

  const handleTransfer = () => {
    if (!recipientInfo) {
      toast.error('Please lookup recipient first');
      return;
    }

    const transferAmount = parseFloat(amount);
    if (!transferAmount || transferAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (transferAmount < 100 || transferAmount > 50000) {
      toast.error('Transfer amount must be between 100 and 50,000 RWF');
      return;
    }

    const totalDeduction = transferAmount + transferFee;
    if (totalDeduction > currentBalance) {
      toast.error(`Insufficient balance. You need ${new Intl.NumberFormat('fr-RW').format(totalDeduction)} RWF`);
      return;
    }

    setPendingTransfer({
      toSerialCode: toSerialCode.trim().toUpperCase(),
      amount: transferAmount,
      recipientInfo
    });
    setIsPinModalOpen(true);
  };

  const handlePinSubmit = async (pin: string) => {
    if (!pendingTransfer) return;

    setIsPinModalOpen(false);

    try {
      const response = await api.post('/wallet/transfer-by-serial', {
        toSerialCode: pendingTransfer.toSerialCode,
        amount: pendingTransfer.amount,
        pin
      });

      if (response.success) {
        toast.success(`Successfully transferred ${new Intl.NumberFormat('fr-RW').format(pendingTransfer.amount)} RWF to ${pendingTransfer.recipientInfo.name}`);
        setToSerialCode('');
        setAmount('');
        setRecipientInfo(null);
        setPendingTransfer(null);
        onSuccess(response.data.newBalance || (currentBalance - pendingTransfer.amount));
        fetchRecentTransfers();
      } else {
        throw new Error(response.message || 'Transfer failed');
      }
    } catch (err: any) {
      toast.error(err.message || 'Transfer failed. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold dark:text-white mb-2">Send Money</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Transfer money to other passengers using serial codes
        </p>
      </div>

      {/* Info Card */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start">
          <InformationCircleIcon className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-3 flex-shrink-0" />
          <div className="text-sm text-blue-800 dark:text-blue-300">
            <p className="font-semibold mb-1">Transfer Information</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Enter recipient's serial code to lookup their account</li>
              <li>Minimum transfer: 100 RWF | Maximum: 50,000 RWF</li>
              <li>No transfer fees for passenger-to-passenger transfers</li>
              <li>All transfers require PIN verification</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Transfer Form */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg space-y-6">
          {/* Balance Display */}
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-lg p-4">
            <p className="text-sm opacity-80 mb-1">Available Balance</p>
            <p className="text-2xl font-bold">
              {new Intl.NumberFormat('fr-RW').format(currentBalance)} RWF
            </p>
          </div>

          {/* Serial Code Lookup */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Recipient Serial Code <span className="text-red-500">*</span>
            </label>
            <div className="flex space-x-2">
              <div className="relative flex-1">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={toSerialCode}
                  onChange={(e) => setToSerialCode(e.target.value.toUpperCase())}
                  onKeyPress={(e) => e.key === 'Enter' && handleLookup()}
                  placeholder="Enter recipient serial code"
                  className="w-full pl-10 pr-4 py-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white font-mono"
                />
              </div>
              <button
                onClick={handleLookup}
                disabled={isSearching || !toSerialCode.trim()}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
              >
                {isSearching ? '...' : 'Lookup'}
              </button>
            </div>
            {error && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
            )}
          </div>

          {/* Recipient Info Display */}
          {recipientInfo && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircleIcon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-green-900 dark:text-green-200 mb-2">
                    Recipient Found
                  </h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center">
                      <UserIcon className="w-4 h-4 mr-2 text-green-700 dark:text-green-400" />
                      <span className="dark:text-green-300">{recipientInfo.name}</span>
                    </div>
                    {recipientInfo.phone && (
                      <div className="flex items-center">
                        <PhoneIcon className="w-4 h-4 mr-2 text-green-700 dark:text-green-400" />
                        <span className="dark:text-green-300">{recipientInfo.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center">
                      <span className="text-xs text-green-700 dark:text-green-400 font-mono">
                        Serial: {recipientInfo.serial_code}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Amount Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Transfer Amount (RWF) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="100"
              max="50000"
              step="100"
              placeholder="Enter amount (100 - 50,000)"
              className="w-full px-4 py-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white text-lg font-semibold"
            />
            
            {/* Quick Amount Buttons */}
            <div className="mt-3 flex flex-wrap gap-2">
              {quickAmounts.map(quickAmount => (
                <button
                  key={quickAmount}
                  onClick={() => handleQuickAmount(quickAmount)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                    amount === quickAmount.toString()
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {new Intl.NumberFormat('fr-RW').format(quickAmount)}
                </button>
              ))}
            </div>
          </div>

          {/* Transfer Summary */}
          {recipientInfo && amount && parseFloat(amount) > 0 && (
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Transfer Amount:</span>
                <span className="font-semibold dark:text-white">
                  {new Intl.NumberFormat('fr-RW').format(parseFloat(amount))} RWF
                </span>
              </div>
              {transferFee > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Transfer Fee:</span>
                  <span className="font-semibold text-red-600 dark:text-red-400">
                    -{new Intl.NumberFormat('fr-RW').format(transferFee)} RWF
                  </span>
                </div>
              )}
              <div className="pt-2 border-t dark:border-gray-600">
                <div className="flex justify-between">
                  <span className="font-semibold dark:text-white">Total Deduction:</span>
                  <span className="font-bold text-red-600 dark:text-red-400">
                    {new Intl.NumberFormat('fr-RW').format(parseFloat(amount) + transferFee)} RWF
                  </span>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-sm text-gray-600 dark:text-gray-400">New Balance:</span>
                  <span className="text-sm font-semibold dark:text-white">
                    {new Intl.NumberFormat('fr-RW').format(currentBalance - parseFloat(amount) - transferFee)} RWF
                  </span>
                </div>
              </div>
              {currentBalance < (parseFloat(amount) + transferFee) && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-2">
                  ⚠️ Insufficient balance
                </p>
              )}
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={handleTransfer}
            disabled={!recipientInfo || !amount || parseFloat(amount) < 100 || parseFloat(amount) > 50000 || (parseFloat(amount) + transferFee) > currentBalance}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-bold hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg disabled:opacity-50 flex items-center justify-center"
          >
            <PaperAirplaneIcon className="w-5 h-5 mr-2" />
            Confirm Transfer
          </button>
        </div>

        {/* Recent Transfers */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-bold dark:text-white mb-4">Recent Transfers</h2>
          {recentTransfers.length === 0 ? (
            <div className="text-center py-8">
              <PaperAirplaneIcon className="w-12 h-12 mx-auto text-gray-400 mb-2" />
              <p className="text-gray-500 dark:text-gray-400">No recent transfers</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
              {recentTransfers.map((transfer) => (
                <div
                  key={transfer.id}
                  className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold dark:text-white">
                        {transfer.description?.includes('to') 
                          ? transfer.description.split('to')[1]?.trim() || 'Unknown'
                          : 'Transfer'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {transfer.reference || 'N/A'}
                      </p>
                    </div>
                    <span className="text-lg font-bold text-red-600 dark:text-red-400">
                      -{new Intl.NumberFormat('fr-RW').format(Math.abs(transfer.amount))} RWF
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                    <span>{new Date(transfer.created_at).toLocaleString()}</span>
                    <span className={`px-2 py-0.5 rounded-full ${
                      transfer.status === 'completed'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
                        : transfer.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
                    }`}>
                      {transfer.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* PIN Modal */}
      {isPinModalOpen && pendingTransfer && (
        <WalletPINModal
          onClose={() => {
            setIsPinModalOpen(false);
            setPendingTransfer(null);
          }}
          onSuccess={handlePinSubmit}
          title="Confirm Transfer"
          message={`Enter your PIN to confirm transfer of ${new Intl.NumberFormat('fr-RW').format(pendingTransfer.amount)} RWF to ${pendingTransfer.recipientInfo.name}`}
        />
      )}
    </div>
  );
};

export default EnhancedPassengerTransfer;

