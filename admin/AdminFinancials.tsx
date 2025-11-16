

import React, { useState, useEffect } from 'react';
import { CurrencyDollarIcon, TagIcon, BriefcaseIcon, ChartBarIcon } from '../components/icons';
import DateRangePicker from '../components/DateRangePicker';
import * as api from '../services/apiService';
import LoadingSpinner from '../components/LoadingSpinner';

const StatCard = ({ title, value, icon }) => (
    <div className="bg-white dark:bg-gray-800/50 p-6 rounded-2xl shadow-lg">
         <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                {icon}
            </div>
            <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
            </div>
        </div>
    </div>
);


const AdminFinancials: React.FC = () => {
    const [activeRange, setActiveRange] = useState('30 Days');
    const [financialData, setFinancialData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string|null>(null);

    useEffect(() => {
        const fetchFinancials = async () => {
            setIsLoading(true);
            try {
                const data = await api.adminGetFinancials();
                setFinancialData(data);
            } catch (e: any) {
                setError(e.message || 'Failed to load financial data.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchFinancials();
    }, [activeRange]);

    if (isLoading || !financialData) {
        return <LoadingSpinner />;
    }
    
    const { stats, transactions } = financialData;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold dark:text-gray-200">Platform Financials</h1>
                <DateRangePicker onRangeChange={setActiveRange} activeRange={activeRange} />
            </div>

            {error && <p className="text-red-500 mb-4">{error}</p>}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <StatCard title="Total Revenue" value={`${new Intl.NumberFormat('fr-RW').format(stats.totalRevenue)} RWF`} icon={<CurrencyDollarIcon className="w-6 h-6 text-blue-600"/>} />
                <StatCard title="Commissions Paid" value={`${new Intl.NumberFormat('fr-RW').format(stats.commissionsPaid)} RWF`} icon={<BriefcaseIcon className="w-6 h-6 text-blue-600"/>} />
                <StatCard title="Company Payouts" value={`${new Intl.NumberFormat('fr-RW').format(stats.companyPayouts)} RWF`} icon={<ChartBarIcon className="w-6 h-6 text-blue-600"/>} />
                <StatCard title="Promotions Used" value={`${new Intl.NumberFormat('fr-RW').format(stats.promotionsUsed)} RWF`} icon={<TagIcon className="w-6 h-6 text-blue-600"/>} />
            </div>
            
            <div className="bg-white dark:bg-gray-800/50 p-6 rounded-2xl shadow-lg">
                <h2 className="text-xl font-bold dark:text-white mb-4">Recent Transactions</h2>
                 <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                            <tr>
                                <th className="p-3">Date</th>
                                <th className="p-3">Transaction Type</th>
                                <th className="p-3">Details</th>
                                <th className="p-3 text-right">Amount (RWF)</th>
                            </tr>
                        </thead>
                        <tbody>
                           {transactions.map((tx: any, index: number) => (
                               <tr key={index} className="border-t dark:border-gray-700">
                                   <td className="p-3 whitespace-nowrap">{new Date(tx.date).toLocaleDateString()}</td>
                                   <td>{tx.type}</td>
                                   <td>{tx.details}</td>
                                   <td className={`font-mono text-right font-semibold ${tx.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                       {new Intl.NumberFormat('fr-RW').format(tx.amount)}
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

export default AdminFinancials;