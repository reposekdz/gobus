import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { v4 as uuidv4 } from 'uuid';

interface OfflineTransaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'booking' | 'transfer';
  amount: number;
  phoneNumber?: string;
  recipientId?: string;
  bookingData?: any;
  pin: string;
  timestamp: number;
  status: 'pending' | 'synced' | 'failed';
  retryCount: number;
}

interface QRPaymentData {
  amount: number;
  merchantId: string;
  transactionId: string;
  timestamp: number;
}

export class OfflinePaymentService {
  private static instance: OfflinePaymentService;
  private syncInProgress = false;
  private networkListener: any = null;

  static getInstance(): OfflinePaymentService {
    if (!OfflinePaymentService.instance) {
      OfflinePaymentService.instance = new OfflinePaymentService();
      OfflinePaymentService.instance.setupNetworkListener();
    }
    return OfflinePaymentService.instance;
  }

  private setupNetworkListener() {
    this.networkListener = NetInfo.addEventListener(state => {
      if (state.isConnected) {
        this.syncOfflineTransactions();
      }
    });
  }

  async storeOfflineTransaction(transaction: Omit<OfflineTransaction, 'id' | 'timestamp' | 'status' | 'retryCount'>): Promise<string> {
    const offlineTransaction: OfflineTransaction = {
      ...transaction,
      id: uuidv4(),
      timestamp: Date.now(),
      status: 'pending',
      retryCount: 0
    };

    const existingTransactions = await this.getOfflineTransactions();
    existingTransactions.push(offlineTransaction);
    
    await AsyncStorage.setItem('offline_transactions', JSON.stringify(existingTransactions));
    return offlineTransaction.id;
  }

  async getOfflineTransactions(): Promise<OfflineTransaction[]> {
    try {
      const stored = await AsyncStorage.getItem('offline_transactions');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  async syncOfflineTransactions(): Promise<void> {
    if (this.syncInProgress) return;
    
    this.syncInProgress = true;
    const transactions = await this.getOfflineTransactions();
    const pendingTransactions = transactions.filter(t => t.status === 'pending' && t.retryCount < 3);

    for (const transaction of pendingTransactions) {
      try {
        await this.processOfflineTransaction(transaction);
        transaction.status = 'synced';
      } catch (error) {
        transaction.retryCount++;
        if (transaction.retryCount >= 3) {
          transaction.status = 'failed';
        }
      }
    }

    await AsyncStorage.setItem('offline_transactions', JSON.stringify(transactions));
    this.syncInProgress = false;
  }

  private async processOfflineTransaction(transaction: OfflineTransaction): Promise<void> {
    const token = await AsyncStorage.getItem('auth_token');
    
    switch (transaction.type) {
      case 'deposit':
        await fetch('/api/wallet/deposit/mtn', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            amount: transaction.amount,
            phoneNumber: transaction.phoneNumber
          })
        });
        break;

      case 'withdrawal':
        await fetch('/api/wallet/withdraw/mtn', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            amount: transaction.amount,
            phoneNumber: transaction.phoneNumber,
            pin: transaction.pin
          })
        });
        break;

      case 'booking':
        await fetch('/api/bookings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(transaction.bookingData)
        });
        break;

      case 'transfer':
        await fetch('/api/wallet/transfer', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            toUserId: transaction.recipientId,
            amount: transaction.amount,
            pin: transaction.pin
          })
        });
        break;
    }
  }

  generateQRPayment(amount: number, merchantId: string): string {
    const paymentData: QRPaymentData = {
      amount,
      merchantId,
      transactionId: uuidv4(),
      timestamp: Date.now()
    };
    
    return JSON.stringify(paymentData);
  }

  async processQRPayment(qrData: string, pin: string): Promise<string> {
    const paymentData: QRPaymentData = JSON.parse(qrData);
    
    return await this.storeOfflineTransaction({
      type: 'transfer',
      amount: paymentData.amount,
      recipientId: paymentData.merchantId,
      pin
    });
  }

  async getOfflineBalance(): Promise<number> {
    try {
      const stored = await AsyncStorage.getItem('cached_balance');
      return stored ? parseFloat(stored) : 0;
    } catch {
      return 0;
    }
  }

  async updateOfflineBalance(balance: number): Promise<void> {
    await AsyncStorage.setItem('cached_balance', balance.toString());
  }

  async clearSyncedTransactions(): Promise<void> {
    const transactions = await this.getOfflineTransactions();
    const pendingTransactions = transactions.filter(t => t.status !== 'synced');
    await AsyncStorage.setItem('offline_transactions', JSON.stringify(pendingTransactions));
  }

  async isOnline(): Promise<boolean> {
    const state = await NetInfo.fetch();
    return state.isConnected ?? false;
  }

  async getOfflineBookings(): Promise<any[]> {
    try {
      const stored = await AsyncStorage.getItem('offline_bookings');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  async saveOfflineBooking(booking: any): Promise<void> {
    const bookings = await this.getOfflineBookings();
    bookings.push({ ...booking, id: uuidv4(), timestamp: Date.now(), synced: false });
    await AsyncStorage.setItem('offline_bookings', JSON.stringify(bookings));
  }

  async syncOfflineBookings(): Promise<void> {
    const bookings = await this.getOfflineBookings();
    const unsynced = bookings.filter(b => !b.synced);

    for (const booking of unsynced) {
      try {
        const token = await AsyncStorage.getItem('auth_token');
        const response = await fetch('/api/bookings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(booking)
        });

        if (response.ok) {
          booking.synced = true;
        }
      } catch (error) {
        console.error('Failed to sync booking:', error);
      }
    }

    await AsyncStorage.setItem('offline_bookings', JSON.stringify(bookings));
  }

  destroy() {
    if (this.networkListener) {
      this.networkListener();
    }
  }
}