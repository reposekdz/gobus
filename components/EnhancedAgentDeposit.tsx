import React, { useState, useEffect } from 'react';
import { SearchIcon, UserIcon, PhoneIcon, WalletIcon, CheckCircleIcon, XCircleIcon, QrCodeIcon, InformationCircleIcon } from './icons';
import * as api from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import WalletPINModal from './WalletPINModal';
import LoadingSpinner from './LoadingSpinner';

const EnhancedAgentDeposit: React.FC = () => {
  const { user } = useAuth();
  const [serialCode, setSerialCode] = useState('');
  const [amount, setAmount] = useState('');
  const [passengerInfo, setPassengerInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState('');
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pendingDeposit, setPendingDeposit] = useState<any>(null);
  const [recentDeposits, setRecentDeposits] = useState<any[]>([]);
  const [quickAmounts] = useState([5000, 10000, 20000, 50000, 100000]);

  useEffect(() => {
    fetchRecentDeposits();
  }, []);

  const fetchRecentDeposits = async () => {
    try {
      const data = await api.agentGetMyTransactions();
      setRecentDeposits(Array.isArray(data) ? data.slice(0, 10) : []);
    } catch (err) {
      console.error('Failed to fetch recent deposits', err);
    }
  };

  const handleLookup = async () => {
    if (!serialCode.trim()) {
      toast.error('Please enter a serial code');
      return;
    }

    setIsSearching(true);
    setError('');
    setPassengerInfo(null);

    try {
      const data = await api.agentLookupPassengerBySerial(serialCode.trim().toUpperCase());
      
      if (data && data.id) {
        setPassengerInfo(data);
        toast.success('Passenger found!');
      } else {
        throw new Error('Passenger not found');
      }
    } catch (err: any) {
      setError(err.message || 'Passenger not found with this serial code');
      setPassengerInfo(null);
      toast.error(err.message || 'Passenger not found');
    } finally {
      setIsSearching(false);
    }
  };

  const handleQuickAmount = (quickAmount: number) => {
    setAmount(quickAmount.toString());
  };

  const handleDeposit = () => {
    if (!passengerInfo) {
      toast.error('Please lookup passenger first');
      return;
    }

    const depositAmount = parseFloat(amount);
    if (!depositAmount || depositAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (depositAmount < 1000 || depositAmount > 500000) {
      toast.error('Deposit amount must be between 1,000 and 500,000 RWF');
      return;
    }

    setPendingDeposit({
      passengerSerialCode: serialCode,
      amount: depositAmount,
      passengerInfo
    });
    setIsPinModalOpen(true);
  };

  const handlePinSubmit = async (pin: string) => {
    if (!pendingDeposit) return;

    setIsLoading(true);
    setIsPinModalOpen(false);

    try {
      const response = await api.agentDepositBySerial({
        passengerSerialCode: pendingDeposit.passengerSerialCode,
        amount: pendingDeposit.amount,
        pin
      });

      if (response.success) {
        toast.success(`Successfully deposited ${new Intl.NumberFormat('fr-RW').format(pendingDeposit.amount)} RWF to ${pendingDeposit.passengerInfo.name}`);
        setSerialCode('');
        setAmount('');
        setPassengerInfo(null);
        setPendingDeposit(null);
        fetchRecentDeposits();
      } else {
        throw new Error(response.message || 'Deposit failed');
      }
    } catch (err: any) {
      toast.error(err.message || 'Deposit failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold dark:text-white mb-2">Agent Deposit</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Deposit money to passenger accounts using serial codes
        </p>
      </div>

      {/* Info Card */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start">
          <InformationCircleIcon className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-3 flex-shrink-0" />
          <div className="text-sm text-blue-800 dark:text-blue-300">
            <p className="font-semibold mb-1">Deposit Information</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Enter passenger serial code to lookup their account</li>
              <li>Minimum deposit: 1,000 RWF | Maximum: 500,000 RWF</li>
              <li>You will receive 1.5% commission from the company</li>
              <li>All deposits require PIN verification</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Deposit Form */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg space-y-6">
          <h2 className="text-xl font-bold dark:text-white">New Deposit</h2>

          {/* Serial Code Lookup */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Passenger Serial Code <span className="text-red-500">*</span>
            </label>
            <div className="flex space-x-2">
              <div className="relative flex-1">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={serialCode}
                  onChange={(e) => setSerialCode(e.target.value.toUpperCase())}
                  onKeyPress={(e) => e.key === 'Enter' && handleLookup()}
                  placeholder="Enter or scan serial code"
                  className="w-full pl-10 pr-4 py-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white font-mono"
                />
              </div>
              <button
                onClick={handleLookup}
                disabled={isSearching || !serialCode.trim()}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
              >
                {isSearching ? 'Searching...' : 'Lookup'}
              </button>
            </div>
            {error && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
            )}
          </div>

          {/* Passenger Info Display */}
          {passengerInfo && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircleIcon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-green-900 dark:text-green-200 mb-2">
                    Passenger Found
                  </h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center">
                      <UserIcon className="w-4 h-4 mr-2 text-green-700 dark:text-green-400" />
                      <span className="dark:text-green-300">{passengerInfo.name}</span>
                    </div>
                    {passengerInfo.phone && (
                      <div className="flex items-center">
                        <PhoneIcon className="w-4 h-4 mr-2 text-green-700 dark:text-green-400" />
                        <span className="dark:text-green-300">{passengerInfo.phone}</span>
                      </div>
                    )}
                    {passengerInfo.location && (
                      <div className="flex items-center">
                        <span className="dark:text-green-300">📍 {passengerInfo.location}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Amount Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Deposit Amount (RWF) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="1000"
              max="500000"
              step="1000"
              placeholder="Enter amount (1,000 - 500,000)"
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

          {/* Deposit Summary */}
          {passengerInfo && amount && parseFloat(amount) > 0 && (
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Deposit Amount:</span>
                <span className="font-semibold dark:text-white">
                  {new Intl.NumberFormat('fr-RW').format(parseFloat(amount))} RWF
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Your Commission (1.5%):</span>
                <span className="font-semibold text-green-600 dark:text-green-400">
                  +{new Intl.NumberFormat('fr-RW').format(parseFloat(amount) * 0.015)} RWF
                </span>
              </div>
              <div className="pt-2 border-t dark:border-gray-600">
                <div className="flex justify-between">
                  <span className="font-semibold dark:text-white">Passenger Will Receive:</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">
                    {new Intl.NumberFormat('fr-RW').format(parseFloat(amount))} RWF
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={handleDeposit}
            disabled={!passengerInfo || !amount || parseFloat(amount) < 1000 || parseFloat(amount) > 500000 || isLoading}
            className="w-full py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-bold hover:from-green-700 hover:to-green-800 transition-all shadow-lg disabled:opacity-50"
          >
            {isLoading ? 'Processing...' : 'Confirm Deposit'}
          </button>
        </div>

        {/* Recent Deposits */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-bold dark:text-white mb-4">Recent Deposits</h2>
          {recentDeposits.length === 0 ? (
            <div className="text-center py-8">
              <WalletIcon className="w-12 h-12 mx-auto text-gray-400 mb-2" />
              <p className="text-gray-500 dark:text-gray-400">No recent deposits</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
              {recentDeposits.map((deposit) => (
                <div
                  key={deposit.id}
                  className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold dark:text-white">{deposit.passenger_name || 'Unknown'}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {deposit.passenger_serial_code || deposit.serial_code}
                      </p>
                    </div>
                    <span className="text-lg font-bold text-green-600 dark:text-green-400">
                      {new Intl.NumberFormat('fr-RW').format(deposit.amount)} RWF
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                    <span>{new Date(deposit.created_at).toLocaleString()}</span>
                    {deposit.commission && (
                      <span className="text-green-600 dark:text-green-400">
                        Commission: {new Intl.NumberFormat('fr-RW').format(deposit.commission)} RWF
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* PIN Modal */}
      {isPinModalOpen && pendingDeposit && (
        <WalletPINModal
          onClose={() => {
            setIsPinModalOpen(false);
            setPendingDeposit(null);
          }}
          onSuccess={handlePinSubmit}
          title="Confirm Deposit"
          message={`Enter your PIN to confirm deposit of ${new Intl.NumberFormat('fr-RW').format(pendingDeposit.amount)} RWF to ${pendingDeposit.passengerInfo.name}`}
        />
      )}
    </div>
  );
};

export default EnhancedAgentDeposit;

