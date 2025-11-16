import React, { useState, useEffect } from 'react';
import { 
  Wallet, 
  CreditCard, 
  Send, 
  Download, 
  Phone, 
  Shield, 
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';

interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'transfer' | 'agent_deposit';
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'timeout';
  description: string;
  created_at: string;
  mtn_reference_id?: string;
  other_party?: string;
}

interface WalletData {
  balance: number;
  transactions: Transaction[];
  hasPIN: boolean;
}

const WalletManagement: React.FC = () => {
  const [walletData, setWalletData] = useState<WalletData>({
    balance: 0,
    transactions: [],
    hasPIN: false
  });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Deposit form state
  const [depositAmount, setDepositAmount] = useState('');
  const [depositPhone, setDepositPhone] = useState('');
  const [depositLoading, setDepositLoading] = useState(false);

  // Withdrawal form state
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawPhone, setWithdrawPhone] = useState('');
  const [withdrawPIN, setWithdrawPIN] = useState('');
  const [withdrawLoading, setWithdrawLoading] = useState(false);

  // PIN setup state
  const [newPIN, setNewPIN] = useState('');
  const [confirmPIN, setConfirmPIN] = useState('');
  const [pinLoading, setPinLoading] = useState(false);

  // Agent deposit state
  const [agentAmount, setAgentAmount] = useState('');
  const [passengerPhone, setPassengerPhone] = useState('');
  const [agentPIN, setAgentPIN] = useState('');
  const [agentLoading, setAgentLoading] = useState(false);

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const [balanceRes, historyRes] = await Promise.all([
        fetch('/api/auth/profile', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/wallet/history', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      const balanceData = await balanceRes.json();
      const historyData = await historyRes.json();

      setWalletData({
        balance: balanceData.user?.wallet_balance || 0,
        transactions: historyData.transactions || [],
        hasPIN: !!balanceData.user?.wallet_pin
      });
    } catch (error) {
      console.error('Error fetching wallet data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositAmount || !depositPhone) return;

    try {
      setDepositLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/wallet/deposit/mtn', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: parseFloat(depositAmount),
          phoneNumber: depositPhone
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        alert('Deposit request sent! Please check your phone to complete the payment.');
        setDepositAmount('');
        setDepositPhone('');
        fetchWalletData();
      } else {
        alert(data.error || 'Deposit failed');
      }
    } catch (error) {
      alert('Network error. Please try again.');
    } finally {
      setDepositLoading(false);
    }
  };

  const handleWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!withdrawAmount || !withdrawPhone || !withdrawPIN) return;

    try {
      setWithdrawLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/wallet/withdraw/mtn', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: parseFloat(withdrawAmount),
          phoneNumber: withdrawPhone,
          pin: withdrawPIN
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        alert('Withdrawal request processed! Funds will be sent to your MTN account.');
        setWithdrawAmount('');
        setWithdrawPhone('');
        setWithdrawPIN('');
        fetchWalletData();
      } else {
        alert(data.error || 'Withdrawal failed');
      }
    } catch (error) {
      alert('Network error. Please try again.');
    } finally {
      setWithdrawLoading(false);
    }
  };

  const handleSetPIN = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPIN || newPIN !== confirmPIN) {
      alert('PINs do not match');
      return;
    }

    try {
      setPinLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/wallet/set-pin', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ pin: newPIN })
      });

      const data = await response.json();
      
      if (response.ok) {
        alert('PIN set successfully!');
        setNewPIN('');
        setConfirmPIN('');
        fetchWalletData();
      } else {
        alert(data.error || 'Failed to set PIN');
      }
    } catch (error) {
      alert('Network error. Please try again.');
    } finally {
      setPinLoading(false);
    }
  };

  const handleAgentDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agentAmount || !passengerPhone || !agentPIN) return;

    try {
      setAgentLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/wallet/agent-deposit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          passengerPhone,
          amount: parseFloat(agentAmount),
          pin: agentPIN
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        alert('Deposit completed successfully!');
        setAgentAmount('');
        setPassengerPhone('');
        setAgentPIN('');
        fetchWalletData();
      } else {
        alert(data.error || 'Agent deposit failed');
      }
    } catch (error) {
      alert('Network error. Please try again.');
    } finally {
      setAgentLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'failed':
      case 'timeout':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs';
      case 'failed':
      case 'timeout':
        return 'bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs';
      default:
        return 'bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Wallet className="h-8 w-8 text-blue-600" />
        <h1 className="text-3xl font-bold">Wallet Management</h1>
      </div>

      {/* Wallet Balance Card */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-blue-100 mb-2">Available Balance</p>
            <p className="text-4xl font-bold">{walletData.balance.toLocaleString()} RWF</p>
          </div>
          <Wallet className="h-16 w-16 text-blue-200" />
        </div>
        {!walletData.hasPIN && (
          <div className="mt-4 p-3 bg-yellow-500/20 rounded-lg flex items-center gap-2">
            <Shield className="h-5 w-5" />
            <span className="text-sm">Set up your wallet PIN for secure transactions</span>
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {['overview', 'deposit', user.role === 'company' ? 'withdraw' : null, user.role === 'agent' ? 'agent' : null, 'security'].filter(Boolean).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab!)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab === 'overview' && 'Overview'}
              {tab === 'deposit' && 'Deposit'}
              {tab === 'withdraw' && 'Withdraw'}
              {tab === 'agent' && 'Agent Deposit'}
              {tab === 'security' && 'Security'}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Transactions</h2>
          {loading ? (
            <div className="text-center py-8">Loading transactions...</div>
          ) : walletData.transactions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No transactions yet</div>
          ) : (
            <div className="space-y-3">
              {walletData.transactions.slice(0, 10).map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(transaction.status)}
                    <div>
                      <p className="font-medium">{transaction.description}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(transaction.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${transaction.type === 'deposit' || transaction.type === 'agent_deposit' ? 'text-green-600' : 'text-red-600'}`}>
                      {transaction.type === 'deposit' || transaction.type === 'agent_deposit' ? '+' : '-'}
                      {transaction.amount.toLocaleString()} RWF
                    </p>
                    <span className={getStatusColor(transaction.status)}>
                      {transaction.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'deposit' && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="h-5 w-5" />
            <h2 className="text-xl font-semibold">MTN Mobile Money Deposit</h2>
          </div>
          <form onSubmit={handleDeposit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount (RWF)</label>
              <input
                type="number"
                min="100"
                max="1000000"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                placeholder="Enter amount (100 - 1,000,000 RWF)"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">MTN Phone Number</label>
              <input
                type="tel"
                value={depositPhone}
                onChange={(e) => setDepositPhone(e.target.value)}
                placeholder="078XXXXXXX or 079XXXXXXX"
                pattern="^(\+?25)?(078|079|072|073)\d{7}$"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <button
              type="submit"
              disabled={depositLoading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {depositLoading ? 'Processing...' : 'Deposit Money'}
            </button>
          </form>
        </div>
      )}

      {activeTab === 'withdraw' && user.role === 'company' && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <Download className="h-5 w-5" />
            <h2 className="text-xl font-semibold">Withdraw to MTN Mobile Money</h2>
          </div>
          <form onSubmit={handleWithdrawal} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount (RWF)</label>
              <input
                type="number"
                min="500"
                max="500000"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="Enter amount (500 - 500,000 RWF)"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">MTN Phone Number</label>
              <input
                type="tel"
                value={withdrawPhone}
                onChange={(e) => setWithdrawPhone(e.target.value)}
                placeholder="078XXXXXXX or 079XXXXXXX"
                pattern="^(\+?25)?(078|079|072|073)\d{7}$"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Wallet PIN</label>
              <input
                type="password"
                maxLength={4}
                value={withdrawPIN}
                onChange={(e) => setWithdrawPIN(e.target.value)}
                placeholder="Enter your 4-digit PIN"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <button
              type="submit"
              disabled={withdrawLoading || !walletData.hasPIN}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {withdrawLoading ? 'Processing...' : 'Withdraw Money'}
            </button>
            {!walletData.hasPIN && (
              <p className="text-sm text-red-600">Please set up your wallet PIN first</p>
            )}
          </form>
        </div>
      )}

      {activeTab === 'agent' && user.role === 'agent' && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <Send className="h-5 w-5" />
            <h2 className="text-xl font-semibold">Deposit for Passenger</h2>
          </div>
          <form onSubmit={handleAgentDeposit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Passenger Phone Number</label>
              <input
                type="tel"
                value={passengerPhone}
                onChange={(e) => setPassengerPhone(e.target.value)}
                placeholder="Passenger's phone number"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount (RWF)</label>
              <input
                type="number"
                min="100"
                max="100000"
                value={agentAmount}
                onChange={(e) => setAgentAmount(e.target.value)}
                placeholder="Enter amount (100 - 100,000 RWF)"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Your Wallet PIN</label>
              <input
                type="password"
                maxLength={4}
                value={agentPIN}
                onChange={(e) => setAgentPIN(e.target.value)}
                placeholder="Enter your 4-digit PIN"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <button
              type="submit"
              disabled={agentLoading || !walletData.hasPIN}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {agentLoading ? 'Processing...' : 'Deposit for Passenger'}
            </button>
            {!walletData.hasPIN && (
              <p className="text-sm text-red-600">Please set up your wallet PIN first</p>
            )}
          </form>
        </div>
      )}

      {activeTab === 'security' && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="h-5 w-5" />
            <h2 className="text-xl font-semibold">{walletData.hasPIN ? 'Change Wallet PIN' : 'Set Wallet PIN'}</h2>
          </div>
          <form onSubmit={handleSetPIN} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New PIN</label>
              <input
                type="password"
                maxLength={4}
                value={newPIN}
                onChange={(e) => setNewPIN(e.target.value)}
                placeholder="Enter 4-digit PIN"
                pattern="\d{4}"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm PIN</label>
              <input
                type="password"
                maxLength={4}
                value={confirmPIN}
                onChange={(e) => setConfirmPIN(e.target.value)}
                placeholder="Confirm 4-digit PIN"
                pattern="\d{4}"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <button
              type="submit"
              disabled={pinLoading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {pinLoading ? 'Setting PIN...' : (walletData.hasPIN ? 'Change PIN' : 'Set PIN')}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default WalletManagement;