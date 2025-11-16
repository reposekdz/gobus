import React, { useState, useEffect } from 'react';
import { ChartBarIcon, UsersIcon, BusIcon, MapIcon, WalletIcon, StarIcon } from '../components/icons';
import PinModal from '../components/PinModal';
import * as api from '../services/apiService';
import LoadingSpinner from '../components/LoadingSpinner';

const StatCard = ({ title, value, icon }) => (
    <div className="bg-white dark:bg-gray-800/50 p-6 rounded-2xl shadow-lg">
        <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                {React.cloneElement(icon, { className: "w-7 h-7 text-blue-600" })}
            </div>
            <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
            </div>
        </div>
    </div>
);

interface CompanyDashboardProps {
    companyPin: string;
}

const CompanyDashboard: React.FC<CompanyDashboardProps> = ({ companyPin }) => {
    const [isPinModalOpen, setIsPinModalOpen] = useState(false);
    const [dashboardData, setDashboardData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [walletBalance, setWalletBalance] = useState<number>(0);
    const [analytics, setAnalytics] = useState<any>(null);
    
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [dashboard, balance, analyticsData] = await Promise.all([
                    api.getCompanyDashboard().catch(() => ({ stats: {}, liveFleet: [], driverLeaderboard: [] })),
                    api.companyGetWalletBalance().catch(() => ({ balance: 0 })),
                    api.companyGetAnalytics('month').catch(() => null)
                ]);
                setDashboardData(dashboard);
                setWalletBalance(balance.balance || 0);
                setAnalytics(analyticsData);
            } catch (error) {
                console.error("Failed to load dashboard data:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
        const interval = setInterval(fetchData, 60000); // Refresh every minute
        return () => clearInterval(interval);
    }, []);

    const handlePinSuccess = () => {
        setIsPinModalOpen(false);
        alert('Payouts Authorized Successfully!');
    };
    
    if (isLoading || !dashboardData) {
        return <LoadingSpinner />;
    }

    const stats = dashboardData?.stats || { driverCount: 0, todayRevenue: 0, activeBuses: 0, busCount: 0, popularRoute: 'N/A', totalTrips: 0, totalBookings: 0 };
    const liveFleet = dashboardData?.liveFleet || [];
    const driverLeaderboard = dashboardData?.driverLeaderboard || [];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold dark:text-gray-200">Company Dashboard</h1>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                    Last updated: {new Date().toLocaleTimeString()}
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                <StatCard title="Total Drivers" value={stats.driverCount || 0} icon={<UsersIcon />} />
                <StatCard title="Today's Revenue" value={`${new Intl.NumberFormat('fr-RW').format(stats.todayRevenue || 0)} RWF`} icon={<ChartBarIcon />} />
                <StatCard title="Active Buses" value={`${stats.activeBuses || 0} / ${stats.busCount || 0}`} icon={<BusIcon />} />
                <StatCard title="Wallet Balance" value={`${new Intl.NumberFormat('fr-RW').format(walletBalance)} RWF`} icon={<WalletIcon />} />
                <StatCard title="Total Trips" value={stats.totalTrips || 0} icon={<MapIcon />} />
            </div>
            {analytics && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white dark:bg-gray-800/50 p-6 rounded-2xl shadow-lg">
                        <h3 className="font-bold mb-2 dark:text-white">Monthly Revenue</h3>
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                            {new Intl.NumberFormat('fr-RW').format(analytics.monthlyRevenue || 0)} RWF
                        </p>
                    </div>
                    <div className="bg-white dark:bg-gray-800/50 p-6 rounded-2xl shadow-lg">
                        <h3 className="font-bold mb-2 dark:text-white">Total Bookings</h3>
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                            {analytics.totalBookings || 0}
                        </p>
                    </div>
                    <div className="bg-white dark:bg-gray-800/50 p-6 rounded-2xl shadow-lg">
                        <h3 className="font-bold mb-2 dark:text-white">Average Rating</h3>
                        <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                            {analytics.averageRating ? analytics.averageRating.toFixed(1) : 'N/A'} ⭐
                        </p>
                    </div>
                </div>
            )}
             <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white dark:bg-gray-800/50 p-6 rounded-2xl shadow-lg">
                    <h2 className="text-xl font-bold dark:text-white mb-4">Live Fleet Status</h2>
                    <div className="space-y-4 h-[22rem] overflow-y-auto custom-scrollbar pr-2">
                        {liveFleet.map((bus: any) => (
                             <div key={bus.id} className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                                <div className="flex justify-between items-center mb-2">
                                    <p className="font-bold dark:text-white">{bus.plate}</p>
                                    <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">{bus.route}</p>
                                </div>
                            </div>
                        ))}
                        {liveFleet.length === 0 && <p className="text-center text-gray-500 py-10">No buses currently on route.</p>}
                    </div>
                </div>
                 <div className="bg-white dark:bg-gray-800/50 p-6 rounded-2xl shadow-lg">
                     <h2 className="text-xl font-bold dark:text-white mb-4">Top Drivers</h2>
                     <div className="space-y-3">
                        {driverLeaderboard.map((driver: any, index: number) => (
                            <div key={driver.id || index} className="flex items-center space-x-3 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                                <span className="font-bold text-lg text-gray-400 w-5">#{index + 1}</span>
                                <img src={driver.avatar_url} alt={driver.name} className="w-10 h-10 rounded-full"/>
                                <div className="flex-1">
                                    <p className="font-semibold text-sm dark:text-white">{driver.name}</p>
                                </div>
                            </div>
                        ))}
                     </div>
                </div>
            </div>
            {isPinModalOpen && (
                <PinModal
                    onClose={() => setIsPinModalOpen(false)}
                    onSuccess={handlePinSuccess}
                    pinToMatch={companyPin}
                    title="Authorize Financials"
                    description="Enter your company PIN to authorize this payout."
                />
            )}
        </div>
    );
};

export default CompanyDashboard;