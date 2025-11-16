import React, { useState, useMemo, FormEvent, useEffect } from 'react';
import { 
    SunIcon, MoonIcon, CogIcon, UsersIcon, ChartBarIcon, ArrowDownLeftIcon,
    WalletIcon, CreditCardIcon, SearchIcon, XIcon, CheckCircleIcon, PhoneIcon, MapPinIcon, StarIcon, MenuIcon
} from './components/icons';
import PinModal from './components/PinModal';
import { Page } from './App';
import * as api from './services/apiService';
import LoadingSpinner from './components/LoadingSpinner';
import { useLanguage } from './contexts/LanguageContext';

interface AgentDashboardProps {
    onLogout: () => void;
    theme: 'light' | 'dark';
    setTheme: (theme: 'light' | 'dark') => void;
    agentData: any;
    navigate: (page: Page, data?: any) => void;
}

const StatCard = ({ title, value, icon, format = 'currency' }) => (
    <div className="bg-white dark:bg-gray-800/50 p-6 rounded-2xl shadow-lg relative overflow-hidden group">
        <div className="absolute -right-4 -bottom-4 text-gray-200/20 dark:text-gray-900/20 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500">
            {React.cloneElement(icon, { className: "w-20 h-20" })}
        </div>
        <div className="relative">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {format === 'currency' ? `${new Intl.NumberFormat('fr-RW').format(value)} RWF` : new Intl.NumberFormat().format(value)}
            </p>
        </div>
    </div>
);


const DashboardView = ({ agentData, t }) => {
    const [stats, setStats] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await api.getAgentDashboard();
                setStats(data);
            } catch (error) {
                console.error("Failed to fetch agent dashboard stats", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (isLoading || !stats) {
        return <LoadingSpinner />;
    }

    return (
        <div className="space-y-6">
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-green-500 dark:from-blue-400 dark:to-green-300">{t('agent_dashboard_title')}</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title={t('agent_dashboard_deposits')} value={stats.totalDeposits} icon={<ArrowDownLeftIcon/>}/>
                <StatCard title={t('agent_dashboard_commission')} value={stats.totalCommission} icon={<WalletIcon/>}/>
                <StatCard title={t('agent_dashboard_transactions')} value={stats.transactions} icon={<ChartBarIcon/>} format="number"/>
                <StatCard title={t('agent_dashboard_passengers')} value={stats.uniquePassengers} icon={<UsersIcon/>} format="number"/>
            </div>
        </div>
    );
};

const DepositView = ({ onAgentDeposit, agentPin, t }) => {
    const [serialCode, setSerialCode] = useState('');
    const [passengerInfo, setPassengerInfo] = useState<{name: string; phone: string; location: string} | null>(null);
    const [amount, setAmount] = useState('');
    const [isFinding, setIsFinding] = useState(false);
    const [isDepositing, setIsDepositing] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [isPinModalOpen, setIsPinModalOpen] = useState(false);
    const quickDepositAmounts = [1000, 2000, 5000, 10000, 20000];

    const handleFindPassenger = async () => {
        setError('');
        setSuccessMessage('');
        setPassengerInfo(null);
        setAmount('');
        if (!serialCode) {
            setError('Shyiramo kode y\'umugenzi.');
            return;
        }
        setIsFinding(true);
        try {
            const passenger = await api.agentLookupPassenger(serialCode);
            setPassengerInfo(passenger);
        } catch(err) {
            setError(err.message || 'Umugenzi ntabonetse.');
        } finally {
            setIsFinding(false);
        }
    };
    
    const handleDepositAttempt = (e: FormEvent) => {
        e.preventDefault();
        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount <= 0) {
            setError('Shyiramo umubare w\'amafaranga wumvikana.');
            return;
        }
        setError('');
        setIsPinModalOpen(true);
    }

    const handlePinSuccess = async () => {
        setIsPinModalOpen(false);
        setIsDepositing(true);
        setError('');
        setSuccessMessage('');
        const numAmount = parseFloat(amount);

        try {
            const result = await api.agentMakeDeposit({ passengerSerial: serialCode, amount: numAmount });
            setSuccessMessage(`Successfully deposited ${new Intl.NumberFormat('fr-RW').format(numAmount)} RWF for ${passengerInfo?.name}.`);
            resetSearch();
        } catch (err) {
            setError(err.message || 'Deposit failed.');
        } finally {
            setIsDepositing(false);
        }
    };
    
    const resetSearch = () => {
        setPassengerInfo(null);
        setSerialCode('');
        setError('');
        setAmount('');
    }

    return (
        <div>
            <h1 className="text-3xl font-bold dark:text-gray-200 mb-6">{t('agent_deposit_title')}</h1>
            <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800/50 p-8 rounded-2xl shadow-lg">
                {successMessage && (
                    <div className="bg-green-100 dark:bg-green-900/50 border-l-4 border-green-500 text-green-700 dark:text-green-300 p-4 rounded-md mb-6 flex items-center space-x-3">
                        <CheckCircleIcon className="w-6 h-6"/>
                        <p>{successMessage}</p>
                    </div>
                )}
                {!passengerInfo ? (
                    <div className="space-y-4">
                        <h2 className="font-semibold text-lg dark:text-white">{t('agent_deposit_find_passenger')}</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{t('agent_deposit_enter_code')}</p>
                        <div className="flex space-x-2">
                             <input 
                                type="text" 
                                value={serialCode}
                                onChange={e => setSerialCode(e.target.value.toUpperCase())}
                                placeholder="Shyiramo kode..."
                                className="flex-grow p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            />
                            <button onClick={handleFindPassenger} disabled={isFinding} className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition w-36">
                                {isFinding ? <div className="w-5 h-5 border-2 border-t-white border-l-white border-b-transparent border-r-transparent rounded-full animate-spin mx-auto"></div> : t('agent_deposit_search_button')}
                            </button>
                        </div>
                         {error && <p className="text-red-500 text-sm">{error}</p>}
                    </div>
                ) : (
                    <form onSubmit={handleDepositAttempt} className="space-y-4 animate-fade-in">
                        <div className="flex justify-between items-start">
                             <h2 className="font-semibold text-lg dark:text-white">{t('agent_deposit_confirm_details')}</h2>
                             <button type="button" onClick={resetSearch} className="text-sm text-blue-600 dark:text-blue-400 hover:underline">{t('agent_deposit_search_another')}</button>
                        </div>
                        <div className="bg-gray-100 dark:bg-gray-700/50 p-4 rounded-lg space-y-2">
                            <p className="font-bold text-xl text-gray-800 dark:text-white">{passengerInfo.name}</p>
                            <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-300">
                                <span className="flex items-center"><PhoneIcon className="w-4 h-4 mr-1.5"/>{passengerInfo.phone}</span>
                                <span className="flex items-center"><MapPinIcon className="w-4 h-4 mr-1.5"/>{passengerInfo.location}</span>
                            </div>
                        </div>
                         <div>
                            <label className="text-sm font-medium dark:text-gray-300">{t('agent_deposit_amount_label')}</label>
                             <input 
                                type="number"
                                value={amount}
                                onChange={e => setAmount(e.target.value)}
                                placeholder="0"
                                className="w-full mt-1 p-3 border rounded-lg text-2xl font-bold dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-green-500 focus:outline-none"
                                required
                            />
                        </div>
                         <div>
                            <label className="text-xs font-medium text-gray-400">Quick Add</label>
                            <div className="flex flex-wrap gap-2 mt-1">
                                {quickDepositAmounts.map(quickAmount => (
                                    <button key={quickAmount} type="button" onClick={() => setAmount(String(Number(amount || 0) + quickAmount))} className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-sm font-semibold rounded-full hover:bg-gray-300 dark:hover:bg-gray-600">
                                        +{new Intl.NumberFormat('fr-RW').format(quickAmount)}
                                    </button>
                                ))}
                            </div>
                        </div>
                        {error && <p className="text-red-500 text-sm">{error}</p>}
                        <button type="submit" disabled={isDepositing} className="w-full px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition text-lg">
                           {isDepositing ? 'Kubitsa...' : t('agent_deposit_confirm_button')}
                        </button>
                    </form>
                )}
            </div>
            {isPinModalOpen && (
                <PinModal 
                    onClose={() => setIsPinModalOpen(false)}
                    onSuccess={handlePinSuccess}
                    pinToMatch={agentPin}
                    title={t('agent_pin_title')}
                    description={t('agent_pin_desc')}
                />
            )}
        </div>
    );
}

const TransactionsView = ({ agentId }) => {
    const [transactions, setTransactions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchTransactions = async () => {
            setIsLoading(true);
            try {
                const data = await api.agentGetMyTransactions();
                setTransactions(data);
            } catch (err) {
                setError(err.message || 'Failed to load transactions');
            } finally {
                setIsLoading(false);
            }
        };
        fetchTransactions();
    }, [agentId]);
    
    return (
        <div>
            {isLoading && <LoadingSpinner />}
            <h1 className="text-3xl font-bold dark:text-gray-200 mb-6">Amateka y'Ibikorwa</h1>
            <div className="bg-white dark:bg-gray-800/50 p-6 rounded-2xl shadow-lg">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="text-left text-xs text-gray-500 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                            <tr>
                                <th className="p-3">Itariki</th>
                                <th className="p-3">Ubwoko</th>
                                <th className="p-3">Ibisobanuro</th>
                                <th className="p-3 text-right">Amafaranga</th>
                            </tr>
                        </thead>
                        <tbody>
                            {transactions.map(tx => (
                                <tr key={tx.id} className="border-t dark:border-gray-700">
                                    <td className="p-3 whitespace-nowrap">{new Date(tx.created_at).toLocaleString()}</td>
                                    <td className="font-semibold dark:text-white capitalize">{tx.type}</td>
                                    <td>{tx.description}</td>
                                    <td className={`font-mono text-right font-bold ${tx.amount > 0 ? 'text-green-600' : 'text-red-500'}`}>
                                        {tx.amount > 0 ? '+' : ''}{new Intl.NumberFormat('fr-RW').format(tx.amount)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};


const AgentDashboard: React.FC<AgentDashboardProps> = ({ onLogout, theme, setTheme, agentData, navigate }) => {
    const [view, setView] = useState('dashboard');
    const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');
    const { t } = useLanguage();

    const navItems = [
        { view: 'dashboard', label: t('agent_dashboard_title'), icon: ChartBarIcon },
        { view: 'deposit', label: t('agent_deposit_title'), icon: CreditCardIcon },
        { view: 'transactions', label: t('agent_transactions_title'), icon: WalletIcon },
        { view: 'profile', label: 'Umwirondoro', icon: UsersIcon },
    ];

    const renderContent = () => {
        switch (view) {
            case 'dashboard': return <DashboardView agentData={agentData} t={t} />;
            case 'deposit': return <DepositView onAgentDeposit={() => {}} agentPin={agentData.pin} t={t} />;
            case 'transactions': return <TransactionsView agentId={agentData.id} />;
            default: return <DashboardView agentData={agentData} t={t} />;
        }
    };

    const NavLink: React.FC<{ viewName: string; label: string; icon: React.FC<any> }> = ({ viewName, label, icon: Icon }) => (
      <button onClick={() => viewName === 'profile' ? navigate('agentProfile', agentData) : setView(viewName)} title={label} className={`group w-full flex items-center justify-center md:justify-start px-2 md:px-4 py-3 transition-all duration-300 rounded-lg relative ${view === viewName ? 'text-white bg-white/10' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
          <div className={`absolute left-0 top-0 h-full w-1 rounded-r-full bg-yellow-400 transition-all duration-300 ${view === viewName ? 'scale-y-100' : 'scale-y-0 group-hover:scale-y-50'}`}></div>
          <Icon className="w-6 h-6 md:mr-4 transition-transform duration-300 group-hover:scale-110" />
          <span className="font-semibold md:inline hidden">{label}</span>
      </button>
    );

    return (
        <div className={`min-h-screen flex ${theme}`}>
            <aside className="w-20 md:w-64 bg-gradient-to-b from-gray-800 via-gray-900 to-black text-gray-300 flex-col flex transition-all duration-300 border-r border-gray-700/50">
                <div className="h-20 flex items-center justify-center text-white font-bold text-xl border-b border-white/10 px-2 text-center overflow-hidden">
                    <span className="md:inline hidden">AGENT PORTAL</span>
                    <span className="md:hidden font-extrabold">A</span>
                </div>
                <nav className="flex-1 px-2 md:px-4 py-6 space-y-2">
                    {navItems.map(item => <NavLink key={item.view} viewName={item.view} label={item.label} icon={item.icon} />)}
                </nav>
            </aside>
            <div className="flex-1 flex flex-col bg-gray-100 dark:bg-gray-900">
                <header className="h-16 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-sm flex items-center justify-between px-6 border-b dark:border-gray-700/50">
                    <div className="font-bold text-gray-800 dark:text-white">Ikaze, {agentData.name.split(' ')[0]}</div>
                    <div className="flex items-center space-x-4">
                        <button onClick={toggleTheme} className="text-gray-500 dark:text-gray-400">{theme === 'light' ? <MoonIcon className="w-6 h-6"/> : <SunIcon className="w-6 h-6"/>}</button>
                        <button onClick={onLogout} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700">Sohoka</button>
                    </div>
                </header>
                <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
                    <div className="animate-fade-in">{renderContent()}</div>
                </main>
            </div>
        </div>
    );
};

export default AgentDashboard;
