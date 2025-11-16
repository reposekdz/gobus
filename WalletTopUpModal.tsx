import React, { useState } from 'react';
import Modal from './components/Modal';
import PinModal from './PinModal';
import { WalletIcon } from './components/icons';

interface WalletTopUpModalProps {
    onClose: () => void;
    onSuccess: (amount: number) => void;
}

const WalletTopUpModal: React.FC<WalletTopUpModalProps> = ({ onClose, onSuccess }) => {
    const [amount, setAmount] = useState('10000');
    const [customAmount, setCustomAmount] = useState('');
    const [isPinModalOpen, setIsPinModalOpen] = useState(false);
    const [error, setError] = useState('');

    const quickAmounts = ['5000', '10000', '20000'];
    const finalAmount = customAmount || amount;

    const handleConfirm = (e: React.FormEvent) => {
        e.preventDefault();
        const numAmount = Number(finalAmount);
        if (isNaN(numAmount) || numAmount <= 0) {
            setError('Please enter a valid amount.');
            return;
        }
        setError('');
        // This flow would typically lead to a payment gateway (like Momo)
        // For simplicity in this demo, we'll just call onSuccess directly.
        onSuccess(numAmount);
    };

    return (
        <Modal isOpen={true} onClose={onClose} title="Add Funds to Wallet">
            <form onSubmit={handleConfirm} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Select Amount (RWF)</label>
                    <div className="grid grid-cols-3 gap-2 mt-1">
                        {quickAmounts.map(val => (
                            <button key={val} type="button" onClick={() => { setAmount(val); setCustomAmount(''); }} className={`p-3 text-center rounded-lg border-2 ${amount === val && !customAmount ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'dark:border-gray-600'}`}>
                                <p className="font-semibold">{new Intl.NumberFormat('fr-RW').format(parseInt(val))}</p>
                            </button>
                        ))}
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Or Enter Custom Amount</label>
                    <input 
                        type="number"
                        value={customAmount}
                        onChange={e => { setCustomAmount(e.target.value); setAmount(''); }}
                        placeholder="e.g., 12500"
                        className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 text-lg font-bold"
                    />
                </div>
                {error && <p className="text-red-500 text-sm">{error}</p>}
                    <div className="border-t dark:border-gray-700 pt-4 flex justify-end">
                    <button type="submit" className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700">
                        Confirm & Add {new Intl.NumberFormat('fr-RW').format(Number(finalAmount))} RWF
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default WalletTopUpModal;