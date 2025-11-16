
import React, { useState, useEffect, useMemo } from 'react';
import { Page } from './App';
import { WalletIcon, PaperAirplaneIcon, LockClosedIcon } from './components/icons';
import WalletTopUpModal from './components/WalletTopUpModal';
import WalletTransactionCard from './components/WalletTransactionCard';
import WalletPINSetupModal from './components/WalletPINSetupModal';
import { useAuth } from './contexts/AuthContext';
import * as api from './services/apiService';
import SendMoneyModal from './components/SendMoneyModal';
import toast from 'react-hot-toast';

const WalletPage: React.FC<{ onNavigate: (page: Page) => void }> = ({ onNavigate }) => {
    const { user, setUser } = useAuth();
    const [isTopUpOpen, setIsTopUpOpen] = useState(false);
    const [isSendMoneyOpen, setIsSendMoneyOpen] = useState(false);
    const [isSetupPINOpen, setIsSetupPINOpen] = useState(false);
    const [history, setHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [walletInfo, setWalletInfo] = useState<any>(null);

    const fetchWalletData = async () => {
        try {
            const [balanceResponse, historyData] = await Promise.all([
                api.get('/wallet/balance'),
                api.getWalletHistory()
            ]);
            
            if (balanceResponse.success) {
                setWalletInfo(balanceResponse.data);
                setUser(prevUser => prevUser ? { 
                    ...prevUser, 
                    wallet_balance: balanceResponse.data.balance,
                    wallet_pin_set: balanceResponse.data.pin_set,
                    serial_code: balanceResponse.data.serial_code
                } : null);
                
                // Check if PIN needs to be set
                if (!balanceResponse.data.pin_set && user?.role === 'passenger') {
                    setIsSetupPINOpen(true);
                }
            }
            
            setHistory(historyData);
        } catch (error) {
            console.error("Failed to fetch wallet data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchWalletData();
    }, []);

    const handleTopUpSuccess = async (amount: number) => {
        setIsTopUpOpen(false);
        try {
            const response = await api.topUpWallet(amount);
            setUser(prevUser => ({...prevUser, wallet_balance: response.data.wallet_balance }));
            alert(`Successfully added ${new Intl.NumberFormat('fr-RW').format(amount)} RWF to your wallet!`);
            fetchHistory();
        } catch (error: any) {
            alert(`Top-up failed: ${error.message}`);
        }
    };
    
     const handleSendSuccess = (newBalance: number) => {
        setIsSendMoneyOpen(false);
        setUser(prevUser => ({ ...prevUser, wallet_balance: newBalance }));
        alert(`Money sent successfully!`);
        fetchHistory(); // Refresh transaction history
    };
    
    const stats = useMemo(() => {
        if (!history) return { totalSpent: 0, totalTopUps: 0 };
        const totalSpent = history.filter(tx => tx.amount < 0).reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
        const totalTopUps = history.filter(tx => tx.amount > 0).reduce((sum, tx) => sum + tx.amount, 0);
        return { totalSpent, totalTopUps };
    }, [history]);

    return (
        <>
            <div className="bg-gray-100/50 dark:bg-gray-900/50 min-h-screen">
                <header className="bg-white dark:bg-gray-800 shadow-sm pt-12 pb-8">
                    <div className="container mx-auto px-6">
                        <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">My Wallet</h1>
                        <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">Manage your funds and view your transaction history.</p>
                    </div>
                </header>
                <main className="container mx-auto px-6 py-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left Column: Balance and Stats */}
                        <div className="lg:col-span-1 space-y-8">
                            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-2xl shadow-xl p-8">
                                <WalletIcon className="w-10 h-10 mb-4 opacity-70"/>
                                <p className="text-lg opacity-80">Current Balance</p>
                                <p className="text-5xl font-bold tracking-tight">{new Intl.NumberFormat('fr-RW').format(user?.wallet_balance || 0)} <span className="text-3xl opacity-80">RWF</span></p>
                                
                                {/* Serial Code Display for Passengers */}
                                {user?.role === 'passenger' && walletInfo?.serial_code && (
                                    <div className="mt-4 p-3 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
                                        <p className="text-xs opacity-80 mb-1">Your Serial Code</p>
                                        <p className="text-2xl font-bold tracking-wider">{walletInfo.serial_code}</p>
                                        <p className="text-xs opacity-70 mt-1">Share with agents for deposits</p>
                                    </div>
                                )}
                                
                                <div className="mt-6 space-y-2">
                                    {user?.role === 'passenger' && !walletInfo?.pin_set && (
                                        <button 
                                            onClick={() => setIsSetupPINOpen(true)} 
                                            className="w-full py-3 bg-yellow-500/90 backdrop-blur-sm font-bold rounded-lg hover:bg-yellow-400 transition flex items-center justify-center text-blue-900"
                                        >
                                            <LockClosedIcon className="w-5 h-5 mr-2"/> Set Wallet PIN
                                        </button>
                                    )}
                                    {user?.role === 'passenger' && (
                                        <button 
                                            onClick={() => setIsSendMoneyOpen(true)} 
                                            className="w-full py-3 bg-white/20 backdrop-blur-sm font-bold rounded-lg hover:bg-white/30 transition flex items-center justify-center"
                                        >
                                            <PaperAirplaneIcon className="w-5 h-5 mr-2"/> Send Money
                                        </button>
                                    )}
                                    {(user?.role === 'company' || user?.role === 'passenger') && (
                                        <button 
                                            onClick={() => setIsTopUpOpen(true)} 
                                            className="w-full py-3 bg-white/20 backdrop-blur-sm font-bold rounded-lg hover:bg-white/30 transition"
                                        >
                                            {user?.role === 'company' ? 'View Wallet' : 'Deposit via Agent'}
                                        </button>
                                    )}
                                </div>
                            </div>
                             <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                                <h3 className="font-bold mb-4 dark:text-white">This Month's Summary</h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between text-sm items-center">
                                        <span className="text-gray-500 dark:text-gray-400">Total Spent</span>
                                        <span className="font-semibold text-red-500">{new Intl.NumberFormat('fr-RW').format(stats.totalSpent)} RWF</span>
                                    </div>
                                    <div className="flex justify-between text-sm items-center">
                                        <span className="text-gray-500 dark:text-gray-400">Total Top-ups</span>
                                        <span className="font-semibold text-green-600">{new Intl.NumberFormat('fr-RW').format(stats.totalTopUps)} RWF</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: History */}
                        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                             <h2 className="text-xl font-bold dark:text-white mb-4">Transaction History</h2>
                             {isLoading ? (
                                <p>Loading history...</p>
                             ) : (
                                <div className="space-y-3 max-h-[30rem] overflow-y-auto custom-scrollbar pr-2">
                                    {history.length > 0 ? (
                                        history.map(tx => <WalletTransactionCard key={tx.id} transaction={tx} />)
                                    ) : (
                                        <p className="text-center text-gray-500 py-8">No transactions yet.</p>
                                    )}
                                </div>
                             )}
                        </div>
                    </div>
                </main>
            </div>
            {isTopUpOpen && (
// FIX: Pass the user's PIN to the modal as required by its props.
                <WalletTopUpModal 
                    onClose={() => setIsTopUpOpen(false)}
                    onSuccess={handleTopUpSuccess}
                    userPin={user?.pin || ''}
                />
            )}
             {isSendMoneyOpen && (
                <SendMoneyModal 
                    onClose={() => setIsSendMoneyOpen(false)}
                    onSuccess={handleSendSuccess}
                    currentBalance={user?.wallet_balance || 0}
                />
            )}
            {isSetupPINOpen && (
                <WalletPINSetupModal
                    onClose={() => {
                        setIsSetupPINOpen(false);
                        fetchWalletData();
                    }}
                />
            )}
        </>
    );
};

export default WalletPage;