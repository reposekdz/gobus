import React, { useState, useEffect, useMemo } from 'react';
import { WalletIcon, ArrowDownTrayIcon, ArrowUpTrayIcon, FilterIcon, SearchIcon, CalendarIcon, ChartBarIcon } from './icons';
import * as api from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import LoadingSpinner from './LoadingSpinner';

interface Transaction {
  id: number;
  amount: number;
  type: 'credit' | 'debit' | 'transfer_in' | 'transfer_out' | 'deposit' | 'withdrawal' | 'payment' | 'refund';
  description: string;
  reference?: string;
  status: 'completed' | 'pending' | 'failed';
  created_at: string;
  metadata?: any;
}

const EnhancedWalletProfile: React.FC = () => {
  const { user, setUser } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [walletInfo, setWalletInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'credit' | 'debit'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'pending' | 'failed'>('all');
  const [dateRange, setDateRange] = useState<'all' | 'today' | 'week' | 'month' | 'year'>('all');
  const [analytics, setAnalytics] = useState<any>(null);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchWalletData();
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [filterType, filterStatus, dateRange]);

  const fetchWalletData = async () => {
    try {
      const [balanceResponse, analyticsData] = await Promise.all([
        api.get('/wallet/balance'),
        api.getWalletAnalytics().catch(() => null)
      ]);

      if (balanceResponse.success) {
        setWalletInfo(balanceResponse.data);
        setUser(prevUser => prevUser ? {
          ...prevUser,
          wallet_balance: balanceResponse.data.balance,
          wallet_pin_set: balanceResponse.data.pin_set,
          serial_code: balanceResponse.data.serial_code
        } : null);
      }

      setAnalytics(analyticsData);
    } catch (err: any) {
      setError(err.message || 'Failed to load wallet data');
      toast.error(err.message || 'Failed to load wallet data');
    }
  };

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const filters: any = {};
      if (filterType !== 'all') {
        filters.type = filterType === 'credit' ? 'credit,transfer_in,deposit,refund' : 'debit,transfer_out,withdrawal,payment';
      }
      if (filterStatus !== 'all') {
        filters.status = filterStatus;
      }
      if (dateRange !== 'all') {
        const now = new Date();
        const ranges: Record<string, Date> = {
          today: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
          week: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
          month: new Date(now.getFullYear(), now.getMonth(), 1),
          year: new Date(now.getFullYear(), 0, 1)
        };
        filters.dateFrom = ranges[dateRange].toISOString().split('T')[0];
      }

      const data = await api.getWalletTransactions(filters);
      setTransactions(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || 'Failed to load transactions');
      toast.error(err.message || 'Failed to load transactions');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      const matchesSearch = !searchTerm ||
        tx.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.reference?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });
  }, [transactions, searchTerm]);

  const stats = useMemo(() => {
    const totalIncome = filteredTransactions
      .filter(tx => tx.amount > 0)
      .reduce((sum, tx) => sum + tx.amount, 0);
    
    const totalExpenses = filteredTransactions
      .filter(tx => tx.amount < 0)
      .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
    
    const pending = filteredTransactions
      .filter(tx => tx.status === 'pending')
      .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
    
    return { totalIncome, totalExpenses, pending, count: filteredTransactions.length };
  }, [filteredTransactions]);

  const exportTransactions = () => {
    const csv = [
      ['Date', 'Type', 'Description', 'Amount', 'Status', 'Reference'].join(','),
      ...filteredTransactions.map(tx => [
        new Date(tx.created_at).toLocaleDateString(),
        tx.type,
        `"${tx.description}"`,
        tx.amount,
        tx.status,
        tx.reference || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wallet-transactions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Transactions exported successfully');
  };

  const getTransactionIcon = (type: string) => {
    if (type.includes('deposit') || type.includes('credit') || type.includes('transfer_in')) {
      return <ArrowDownTrayIcon className="w-5 h-5 text-green-600" />;
    }
    if (type.includes('withdrawal') || type.includes('debit') || type.includes('transfer_out') || type.includes('payment')) {
      return <ArrowUpTrayIcon className="w-5 h-5 text-red-600" />;
    }
    return <WalletIcon className="w-5 h-5 text-blue-600" />;
  };

  const getTransactionColor = (amount: number) => {
    return amount > 0
      ? 'text-green-600 dark:text-green-400'
      : 'text-red-600 dark:text-red-400';
  };

  if (isLoading && transactions.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold dark:text-white mb-2">Wallet Profile</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your wallet and view transaction history
          </p>
        </div>
          <button
          onClick={exportTransactions}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
        >
          <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
          Export CSV
        </button>
      </div>

      {/* Balance Card */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-2xl shadow-xl p-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg opacity-80 mb-2">Current Balance</p>
            <p className="text-5xl font-bold tracking-tight">
              {new Intl.NumberFormat('fr-RW').format(user?.wallet_balance || 0)}{' '}
              <span className="text-3xl opacity-80">RWF</span>
            </p>
            {walletInfo?.serial_code && (
              <div className="mt-4 p-3 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
                <p className="text-xs opacity-80 mb-1">Your Serial Code</p>
                <p className="text-2xl font-bold tracking-wider">{walletInfo.serial_code}</p>
                <p className="text-xs opacity-70 mt-1">Share with agents for deposits</p>
              </div>
            )}
          </div>
          <WalletIcon className="w-20 h-20 opacity-50" />
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Income</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            {new Intl.NumberFormat('fr-RW').format(stats.totalIncome)} RWF
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Expenses</p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">
            {new Intl.NumberFormat('fr-RW').format(stats.totalExpenses)} RWF
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Pending</p>
          <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
            {new Intl.NumberFormat('fr-RW').format(stats.pending)} RWF
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Transactions</p>
          <p className="text-2xl font-bold dark:text-white">{stats.count}</p>
        </div>
      </div>

      {/* Analytics Chart */}
      {analytics && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
          <h2 className="text-xl font-bold dark:text-white mb-4">Transaction Analytics</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">This Month</p>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm dark:text-white">Income:</span>
                  <span className="font-semibold text-green-600 dark:text-green-400">
                    {new Intl.NumberFormat('fr-RW').format(analytics.monthlyIncome || 0)} RWF
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm dark:text-white">Expenses:</span>
                  <span className="font-semibold text-red-600 dark:text-red-400">
                    {new Intl.NumberFormat('fr-RW').format(analytics.monthlyExpenses || 0)} RWF
                  </span>
                </div>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">This Year</p>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm dark:text-white">Income:</span>
                  <span className="font-semibold text-green-600 dark:text-green-400">
                    {new Intl.NumberFormat('fr-RW').format(analytics.yearlyIncome || 0)} RWF
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm dark:text-white">Expenses:</span>
                  <span className="font-semibold text-red-600 dark:text-red-400">
                    {new Intl.NumberFormat('fr-RW').format(analytics.yearlyExpenses || 0)} RWF
                  </span>
                </div>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Top Categories</p>
              <div className="space-y-1">
                {analytics.topCategories?.slice(0, 3).map((cat: any, idx: number) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span className="dark:text-white">{cat.name}:</span>
                    <span className="font-semibold dark:text-white">
                      {new Intl.NumberFormat('fr-RW').format(cat.amount)} RWF
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search transactions..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="all">All Types</option>
              <option value="credit">Income</option>
              <option value="debit">Expenses</option>
            </select>
            
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
            
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as any)}
              className="px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b dark:border-gray-700">
          <h2 className="text-xl font-bold dark:text-white">Transaction History</h2>
        </div>
        <div className="overflow-x-auto">
          {filteredTransactions.length === 0 ? (
            <div className="p-12 text-center">
              <WalletIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No transactions found</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Date</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Type</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Description</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Amount</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                    <td className="px-6 py-4">
                      <div className="text-sm dark:text-white">
                        {new Date(tx.created_at).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(tx.created_at).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        {getTransactionIcon(tx.type)}
                        <span className="text-sm dark:text-white capitalize">
                          {tx.type.replace('_', ' ')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm dark:text-white">{tx.description}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className={`text-sm font-semibold ${getTransactionColor(tx.amount)}`}>
                        {tx.amount > 0 ? '+' : ''}
                        {new Intl.NumberFormat('fr-RW').format(tx.amount)} RWF
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        tx.status === 'completed'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
                          : tx.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
                      }`}>
                        {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {tx.reference ? (
                        <span className="text-xs font-mono text-gray-600 dark:text-gray-400">
                          {tx.reference}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedWalletProfile;

