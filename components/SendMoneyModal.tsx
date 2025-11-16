import React, { useState } from 'react';
import Modal from './Modal';
import PinModal from './PinModal';
import * as api from '../services/apiService';
import { useLanguage } from '../contexts/LanguageContext';

interface SendMoneyModalProps {
    onClose: () => void;
    onSuccess: (newBalance: number) => void;
    currentBalance: number;
}

const SendMoneyModal: React.FC<SendMoneyModalProps> = ({ onClose, onSuccess, currentBalance }) => {
    const { t } = useLanguage();
    const [toSerial, setToSerial] = useState('');
    const [amount, setAmount] = useState('');
    const [isPinModalOpen, setIsPinModalOpen] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSendAttempt = (e: React.FormEvent) => {
        e.preventDefault();
        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount <= 0) {
            setError('Please enter a valid amount.');
            return;
        }
        if (numAmount > currentBalance) {
            setError('Insufficient balance.');
            return;
        }
        setError('');
        setIsPinModalOpen(true);
    };

    const handlePinSuccess = async (pin: string) => {
        setIsPinModalOpen(false);
        setIsLoading(true);
        setError('');
        try {
            // Use the new serial code transfer endpoint
            const result = await api.post('/wallet/transfer-by-serial', {
                toSerialCode: toSerial,
                amount: parseFloat(amount),
                pin
            });
            
            if (result.success) {
                onSuccess(result.data.newBalance);
            } else {
                setError(result.message || 'Transfer failed. Please try again.');
                setIsLoading(false);
            }
        } catch (err: any) {
            setError(err.message || 'Transfer failed. Please try again.');
            setIsLoading(false);
        }
    };

    return (
        <>
            <Modal isOpen={!isPinModalOpen} onClose={onClose} title="Send Money">
                <form onSubmit={handleSendAttempt} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Recipient's Serial Code</label>
                        <input 
                            type="text"
                            value={toSerial}
                            onChange={e => setToSerial(e.target.value.toUpperCase())}
                            placeholder="e.g., KAL1234"
                            className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                            required
                        />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Amount (RWF)</label>
                        <input 
                            type="number"
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                            placeholder="0"
                            className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 text-lg font-bold"
                            required
                        />
                         <p className="text-xs text-gray-500 mt-1">Available: {new Intl.NumberFormat('fr-RW').format(currentBalance)} RWF</p>
                    </div>
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    <div className="border-t dark:border-gray-700 pt-4 flex justify-end">
                        <button type="submit" disabled={isLoading} className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50">
                            {isLoading ? 'Sending...' : 'Continue'}
                        </button>
                    </div>
                </form>
            </Modal>
             {isPinModalOpen && (
                <PinModal 
                    onClose={() => setIsPinModalOpen(false)}
                    onSuccess={handlePinSuccess}
                    title="Confirm Transfer"
                    description={`Enter your PIN to send ${new Intl.NumberFormat('fr-RW').format(parseFloat(amount))} RWF to ${toSerial}.`}
                />
            )}
        </>
    );
};

export default SendMoneyModal;