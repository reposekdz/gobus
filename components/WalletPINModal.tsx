import React, { useState } from 'react';
import Modal from './Modal';
import { LockClosedIcon } from './icons';

interface WalletPINModalProps {
  onClose: () => void;
  onSuccess: (pin: string) => void;
  title?: string;
  message?: string;
}

const WalletPINModal: React.FC<WalletPINModalProps> = ({ 
  onClose, 
  onSuccess, 
  title = "Enter Wallet PIN",
  message 
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      setError('PIN must be exactly 4 digits');
      return;
    }

    onSuccess(pin);
    setPin('');
  };

  return (
    <Modal isOpen={true} onClose={onClose} title={title}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {message && (
          <div className="text-center mb-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">{message}</p>
          </div>
        )}

        <div className="text-center mb-4">
          <div className="mx-auto w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center mb-3">
            <LockClosedIcon className="w-6 h-6 text-[#0033A0]" />
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Enter your 4-digit wallet PIN to confirm
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Wallet PIN
          </label>
          <input
            type="password"
            maxLength={4}
            value={pin}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, '');
              setPin(value);
              setError('');
            }}
            className="w-full px-4 py-3 text-center text-xl font-bold tracking-widest border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500/50 transition"
            placeholder="0000"
            required
            autoFocus
          />
        </div>

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={pin.length !== 4}
            className="px-6 py-3 bg-gradient-to-r from-yellow-400 to-yellow-500 text-[#0033A0] rounded-lg font-bold hover:from-yellow-500 hover:to-yellow-600 transition-all shadow-lg disabled:opacity-50"
          >
            Confirm
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default WalletPINModal;

