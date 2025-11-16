import React, { useState } from 'react';
import { Page } from './App';
import { LockClosedIcon } from './components/icons';
import * as api from './services/apiService';
import { useAuth } from './contexts/AuthContext';
import toast from 'react-hot-toast';

interface WalletPINSetupPageProps {
  onNavigate: (page: Page) => void;
}

const WalletPINSetupPage: React.FC<WalletPINSetupPageProps> = ({ onNavigate }) => {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { user, setUser } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      setError('PIN must be exactly 4 digits');
      return;
    }

    if (pin !== confirmPin) {
      setError('PINs do not match');
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.put('/wallet/setup-pin', { pin });
      
      if (response.success) {
        toast.success('Wallet PIN set successfully!');
        // Update user to reflect PIN is set
        setUser(prevUser => prevUser ? { ...prevUser, wallet_pin_set: true } : null);
        // Navigate to wallet or home
        onNavigate('wallet');
      } else {
        setError(response.message || 'Failed to set PIN');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to set PIN. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 shadow-2xl rounded-2xl p-8">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center mb-4">
            <LockClosedIcon className="w-8 h-8 text-[#0033A0]" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Set Your Wallet PIN
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Create a 4-digit PIN to secure your wallet transactions
          </p>
          {user?.serial_code && (
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">Your Serial Code</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{user.serial_code}</p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                Share this code with agents to receive deposits
              </p>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Enter 4-Digit PIN
            </label>
            <div className="relative">
              <LockClosedIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="password"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                className="w-full pl-10 pr-4 py-3 text-center text-2xl font-bold tracking-widest border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500/50 transition"
                placeholder="0000"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Confirm PIN
            </label>
            <div className="relative">
              <LockClosedIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="password"
                maxLength={4}
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                className="w-full pl-10 pr-4 py-3 text-center text-2xl font-bold tracking-widest border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500/50 transition"
                placeholder="0000"
                required
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>Important:</strong> Remember your PIN. You'll need it for all wallet transactions including payments and transfers.
            </p>
          </div>

          <button
            type="submit"
            disabled={isLoading || pin.length !== 4 || confirmPin.length !== 4}
            className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-md text-[#0033A0] bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-all duration-300 shadow-lg disabled:opacity-50"
          >
            {isLoading ? 'Setting PIN...' : 'Set PIN & Continue'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default WalletPINSetupPage;

