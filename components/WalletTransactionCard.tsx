import React from 'react';
import { TicketIcon, ArrowDownLeftIcon, ArrowUpTrayIcon } from './icons';

const TransactionIcon = ({ type }) => {
    if (type === 'purchase') return <div className="p-2 bg-red-100 dark:bg-red-900/50 rounded-full"><TicketIcon className="w-5 h-5 text-red-500"/></div>;
    if (type === 'refund') return <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-full"><ArrowDownLeftIcon className="w-5 h-5 text-blue-500"/></div>;
    return <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-full"><ArrowUpTrayIcon className="w-5 h-5 text-green-500"/></div>;
}

const WalletTransactionCard: React.FC<{ transaction: any }> = ({ transaction }) => {
    const isCredit = transaction.type === 'top-up' || transaction.type === 'refund';
    const amount = transaction.amount;

    const handleCopyHash = () => {
        if (transaction.hash) {
            navigator.clipboard.writeText(transaction.hash);
            alert('Transaction hash copied!');
        }
    };

    return (
        <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
            <div className="flex items-center space-x-3">
                <TransactionIcon type={transaction.type} />
                <div>
                    <p className="font-semibold text-sm capitalize dark:text-white">{transaction.description || transaction.type.replace('-', ' ')}</p>
                    <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                        <span>{new Date(transaction.createdAt).toLocaleString()}</span>
                        {transaction.hash && 
                            <button onClick={handleCopyHash} className="ml-2 font-mono text-blue-500 text-[10px] hover:underline" title="Copy transaction hash">
                                [{transaction.hash.substring(0, 8)}...]
                            </button>
                        }
                    </div>
                </div>
            </div>
            <p className={`font-bold text-lg ${isCredit ? 'text-green-600' : 'text-gray-800 dark:text-gray-200'}`}>
                {isCredit ? '+' : ''}{new Intl.NumberFormat('fr-RW').format(amount)}
            </p>
        </div>
    );
};

export default WalletTransactionCard;