import React, { useState } from 'react';
import Modal from './Modal';
import { LockClosedIcon } from './icons';
import * as api from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

interface WalletPINSetupModalProps {
    onClose: () => void;
}

const WalletPINSetupModal: React.FC<WalletPINSetupModalProps> = ({ onClose }) => {
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
                setUser(prevUser => prevUser ? { ...prevUser, wallet_pin_set: true } : null);
                onClose();
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
        <Modal isOpen={true} onClose={onClose} title="Set Wallet PIN">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="text-center mb-4">
                    <div className="mx-auto w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center mb-3">
                        <LockClosedIcon className="w-6 h-6 text-[#0033A0]" />
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Create a 4-digit PIN to secure your wallet
                    </p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Enter 4-Digit PIN
                    </label>
                    <input
                        type="password"
                        maxLength={4}
                        value={pin}
                        onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                        className="w-full px-4 py-3 text-center text-xl font-bold tracking-widest border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500/50 transition"
                        placeholder="0000"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Confirm PIN
                    </label>
                    <input
                        type="password"
                        maxLength={4}
                        value={confirmPin}
                        onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                        className="w-full px-4 py-3 text-center text-xl font-bold tracking-widest border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500/50 transition"
                        placeholder="0000"
                        required
                    />
                </div>

                {error && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={isLoading || pin.length !== 4 || confirmPin.length !== 4}
                    className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-md text-[#0033A0] bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-all duration-300 shadow-lg disabled:opacity-50"
                >
                    {isLoading ? 'Setting PIN...' : 'Set PIN'}
                </button>
            </form>
        </Modal>
    );
};

export default WalletPINSetupModal;

