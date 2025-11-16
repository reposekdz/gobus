import React, { useState, useEffect } from 'react';
import { WalletIcon, ArrowDownTrayIcon, CheckCircleIcon, XCircleIcon, InformationCircleIcon } from '../components/icons';
import Modal from '../components/Modal';
import * as api from '../services/apiService';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import WalletPINModal from '../components/WalletPINModal';

interface Withdrawal {
  id: number;
  amount: number;
  admin_fee: number;
  net_amount: number;
  phone_number: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  completed_at?: string;
  mtn_reference_id?: string;
}

const CompanyWithdrawal: React.FC = () => {
  const { user } = useAuth();
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    phoneNumber: '',
    notes: ''
  });
  const [pendingWithdrawal, setPendingWithdrawal] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [balanceResponse, withdrawalsData] = await Promise.all([
        api.get('/wallet/balance'),
        api.companyGetWithdrawalHistory()
      ]);

      if (balanceResponse.success) {
        setWalletBalance(balanceResponse.data.balance || 0);
      }

      setWithdrawals(withdrawalsData || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(formData.amount);
    const adminFee = amount * 0.03; // 3% admin fee
    const totalDeduction = amount + adminFee;

    if (!amount || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (amount < 5000 || amount > 10000000) {
      toast.error('Withdrawal amount must be between 5,000 and 10,000,000 RWF');
      return;
    }

    if (walletBalance < totalDeduction) {
      toast.error(`Insufficient balance. You need ${new Intl.NumberFormat('fr-RW').format(totalDeduction)} RWF (including 3% admin fee)`);
      return;
    }

    // Validate phone number
    const phoneRegex = /^(\+?250|0)?[7][0-9]{8}$/;
    const normalizedPhone = formData.phoneNumber.replace(/\s/g, '');
    if (!phoneRegex.test(normalizedPhone)) {
      toast.error('Invalid phone number format. Please use format: 0781234567');
      return;
    }

    setPendingWithdrawal({
      amount,
      adminFee,
      totalDeduction,
      phoneNumber: normalizedPhone,
      notes: formData.notes
    });
    setIsModalOpen(false);
    setIsPinModalOpen(true);
  };

  const handlePinSubmit = async (pin: string) => {
    if (!pendingWithdrawal) return;

    setIsLoading(true);
    setIsPinModalOpen(false);

    try {
      const response = await api.companyRequestWithdrawal({
        amount: pendingWithdrawal.amount,
        phoneNumber: pendingWithdrawal.phoneNumber,
        pin,
        notes: pendingWithdrawal.notes
      });

      if (response.success) {
        toast.success(`Withdrawal request submitted successfully! Net amount: ${new Intl.NumberFormat('fr-RW').format(pendingWithdrawal.amount)} RWF`);
        setFormData({
          amount: '',
          phoneNumber: '',
          notes: ''
        });
        setPendingWithdrawal(null);
        fetchData();
      } else {
        throw new Error(response.message || 'Failed to process withdrawal');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to process withdrawal');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
      processing: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
      completed: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
      failed: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
    };

    return (
      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${styles[status as keyof typeof styles] || styles.pending}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (isLoading && withdrawals.length === 0) {
    return <LoadingSpinner />;
  }

  const adminFeeRate = 0.03; // 3%
  const calculatedAmount = formData.amount ? parseFloat(formData.amount) : 0;
  const calculatedAdminFee = calculatedAmount * adminFeeRate;
  const calculatedTotal = calculatedAmount + calculatedAdminFee;
  const calculatedNet = calculatedAmount;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold dark:text-white mb-2">Company Withdrawals</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Request withdrawals to your MTN Mobile Money account
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-semibold hover:from-green-700 hover:to-green-800 transition-all shadow-lg"
        >
          <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
          Request Withdrawal
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Wallet Balance Card */}
      <div className="bg-gradient-to-br from-green-600 to-green-700 text-white rounded-2xl shadow-xl p-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg opacity-80 mb-2">Available Balance</p>
            <p className="text-5xl font-bold tracking-tight">
              {new Intl.NumberFormat('fr-RW').format(walletBalance)} <span className="text-3xl opacity-80">RWF</span>
            </p>
            <p className="text-sm opacity-70 mt-2">
              Minimum withdrawal: 5,000 RWF | Maximum: 10,000,000 RWF
            </p>
          </div>
          <WalletIcon className="w-16 h-16 opacity-50" />
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start">
          <InformationCircleIcon className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-3 flex-shrink-0" />
          <div className="text-sm text-blue-800 dark:text-blue-300">
            <p className="font-semibold mb-1">Withdrawal Information</p>
            <ul className="list-disc list-inside space-y-1">
              <li>A 3% admin fee will be deducted from your wallet balance</li>
              <li>Withdrawals are processed to MTN Mobile Money accounts</li>
              <li>Processing time: 1-3 business days</li>
              <li>Minimum withdrawal amount: 5,000 RWF</li>
              <li>Maximum withdrawal amount: 10,000,000 RWF per transaction</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Withdrawals Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b dark:border-gray-700">
          <h2 className="text-xl font-bold dark:text-white">Withdrawal History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Amount</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Admin Fee (3%)</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Net Amount</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Phone Number</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Date</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Reference</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {withdrawals.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    No withdrawals found. Request your first withdrawal to get started.
                  </td>
                </tr>
              ) : (
                withdrawals.map((withdrawal) => (
                  <tr key={withdrawal.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                    <td className="px-6 py-4 font-semibold dark:text-white">
                      {new Intl.NumberFormat('fr-RW').format(withdrawal.amount)} RWF
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                      {new Intl.NumberFormat('fr-RW').format(withdrawal.admin_fee)} RWF
                    </td>
                    <td className="px-6 py-4 font-semibold text-green-600 dark:text-green-400">
                      {new Intl.NumberFormat('fr-RW').format(withdrawal.net_amount)} RWF
                    </td>
                    <td className="px-6 py-4 dark:text-white">{withdrawal.phone_number}</td>
                    <td className="px-6 py-4">{getStatusBadge(withdrawal.status)}</td>
                    <td className="px-6 py-4 dark:text-white">
                      {new Date(withdrawal.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      {withdrawal.mtn_reference_id ? (
                        <span className="text-xs font-mono text-gray-600 dark:text-gray-400">
                          {withdrawal.mtn_reference_id}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Withdrawal Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Request Withdrawal"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Withdrawal Amount (RWF) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              min="5000"
              max="10000000"
              step="1000"
              className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="Enter amount (5,000 - 10,000,000)"
              required
            />
          </div>

          {formData.amount && calculatedAmount > 0 && (
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Withdrawal Amount:</span>
                <span className="font-semibold dark:text-white">
                  {new Intl.NumberFormat('fr-RW').format(calculatedAmount)} RWF
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Admin Fee (3%):</span>
                <span className="font-semibold text-red-600 dark:text-red-400">
                  -{new Intl.NumberFormat('fr-RW').format(calculatedAdminFee)} RWF
                </span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t dark:border-gray-600">
                <span className="text-gray-600 dark:text-gray-400">Total Deduction:</span>
                <span className="font-semibold dark:text-white">
                  {new Intl.NumberFormat('fr-RW').format(calculatedTotal)} RWF
                </span>
              </div>
              <div className="flex justify-between text-lg pt-2 border-t-2 dark:border-gray-600">
                <span className="font-semibold text-gray-700 dark:text-gray-300">You Will Receive:</span>
                <span className="font-bold text-green-600 dark:text-green-400">
                  {new Intl.NumberFormat('fr-RW').format(calculatedNet)} RWF
                </span>
              </div>
              {walletBalance < calculatedTotal && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-2">
                  ⚠️ Insufficient balance. You need {new Intl.NumberFormat('fr-RW').format(calculatedTotal - walletBalance)} RWF more.
                </p>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              MTN Mobile Money Phone Number <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={formData.phoneNumber}
              onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
              className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="0781234567"
              required
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Format: 0781234567 or +250781234567
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="Add any notes about this withdrawal..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !formData.amount || calculatedTotal > walletBalance}
              className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-semibold hover:from-green-700 hover:to-green-800 transition-all shadow-lg disabled:opacity-50"
            >
              Continue to PIN
            </button>
          </div>
        </form>
      </Modal>

      {/* PIN Modal */}
      {isPinModalOpen && pendingWithdrawal && (
        <WalletPINModal
          onClose={() => {
            setIsPinModalOpen(false);
            setPendingWithdrawal(null);
          }}
          onSuccess={handlePinSubmit}
          title="Enter Wallet PIN"
          message={`Confirm withdrawal of ${new Intl.NumberFormat('fr-RW').format(pendingWithdrawal.amount)} RWF to ${pendingWithdrawal.phoneNumber}`}
        />
      )}
    </div>
  );
};

export default CompanyWithdrawal;

