import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { Ionicons } from '@expo/vector-icons';
import { AppTextInput } from '../components/AppTextInput';
import { AppButton } from '../components/AppButton';
import { Card } from '../components/Card';
import { OfflinePaymentService } from '../services/OfflinePaymentService';
import { useNetwork } from '../hooks/useNetwork';

interface Transaction {
  id: string;
  type: string;
  amount: number;
  status: string;
  timestamp: number;
  description: string;
}

const AdvancedWalletScreen: React.FC = () => {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const { isConnected } = useNetwork();
  const offlineService = OfflinePaymentService.getInstance();

  // Deposit states
  const [depositAmount, setDepositAmount] = useState('');
  const [depositPhone, setDepositPhone] = useState('');

  // Withdrawal states
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawPhone, setWithdrawPhone] = useState('');
  const [withdrawPin, setWithdrawPin] = useState('');

  // QR states
  const [showQRModal, setShowQRModal] = useState(false);
  const [showScanModal, setShowScanModal] = useState(false);
  const [qrData, setQrData] = useState('');
  const [qrAmount, setQrAmount] = useState('');

  // Transfer states
  const [transferAmount, setTransferAmount] = useState('');
  const [transferPhone, setTransferPhone] = useState('');
  const [transferPin, setTransferPin] = useState('');

  useEffect(() => {
    loadWalletData();
    if (isConnected) {
      syncOfflineTransactions();
    }
  }, [isConnected]);

  const loadWalletData = async () => {
    try {
      if (isConnected) {
        // Load from server
        const response = await fetch('/api/wallet/history');
        const data = await response.json();
        setBalance(data.balance || 0);
        setTransactions(data.transactions || []);
        await offlineService.updateOfflineBalance(data.balance || 0);
      } else {
        // Load from offline storage
        const offlineBalance = await offlineService.getOfflineBalance();
        const offlineTransactions = await offlineService.getOfflineTransactions();
        setBalance(offlineBalance);
        setTransactions(offlineTransactions.map(t => ({
          id: t.id,
          type: t.type,
          amount: t.amount,
          status: t.status,
          timestamp: t.timestamp,
          description: `${t.type} - ${t.status}`
        })));
      }
    } catch (error) {
      console.error('Error loading wallet data:', error);
    }
  };

  const syncOfflineTransactions = async () => {
    try {
      await offlineService.syncOfflineTransactions();
      await loadWalletData();
    } catch (error) {
      console.error('Sync error:', error);
    }
  };

  const handleDeposit = async () => {
    if (!depositAmount || !depositPhone) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    try {
      setLoading(true);
      
      if (isConnected) {
        const response = await fetch('/api/wallet/deposit/mtn', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: parseFloat(depositAmount),
            phoneNumber: depositPhone
          })
        });

        if (response.ok) {
          Alert.alert('Success', 'Deposit request sent to your phone');
          setDepositAmount('');
          setDepositPhone('');
          loadWalletData();
        } else {
          throw new Error('Deposit failed');
        }
      } else {
        await offlineService.storeOfflineTransaction({
          type: 'deposit',
          amount: parseFloat(depositAmount),
          phoneNumber: depositPhone,
          pin: ''
        });
        
        Alert.alert('Offline', 'Deposit saved. Will process when online.');
        setDepositAmount('');
        setDepositPhone('');
      }
    } catch (error) {
      Alert.alert('Error', 'Deposit failed');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdrawal = async () => {
    if (!withdrawAmount || !withdrawPhone || !withdrawPin) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    try {
      setLoading(true);
      
      if (isConnected) {
        const response = await fetch('/api/wallet/withdraw/mtn', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: parseFloat(withdrawAmount),
            phoneNumber: withdrawPhone,
            pin: withdrawPin
          })
        });

        if (response.ok) {
          Alert.alert('Success', 'Withdrawal processed');
          setWithdrawAmount('');
          setWithdrawPhone('');
          setWithdrawPin('');
          loadWalletData();
        } else {
          throw new Error('Withdrawal failed');
        }
      } else {
        await offlineService.storeOfflineTransaction({
          type: 'withdrawal',
          amount: parseFloat(withdrawAmount),
          phoneNumber: withdrawPhone,
          pin: withdrawPin
        });
        
        Alert.alert('Offline', 'Withdrawal saved. Will process when online.');
        setWithdrawAmount('');
        setWithdrawPhone('');
        setWithdrawPin('');
      }
    } catch (error) {
      Alert.alert('Error', 'Withdrawal failed');
    } finally {
      setLoading(false);
    }
  };

  const generateQRCode = () => {
    if (!qrAmount) {
      Alert.alert('Error', 'Please enter amount');
      return;
    }

    const qrPaymentData = offlineService.generateQRPayment(
      parseFloat(qrAmount),
      'user_id_here' // Replace with actual user ID
    );
    
    setQrData(qrPaymentData);
    setShowQRModal(true);
  };

  const handleQRScan = async (data: string) => {
    try {
      const paymentData = JSON.parse(data);
      
      Alert.prompt(
        'Enter PIN',
        `Pay ${paymentData.amount} RWF?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Pay',
            onPress: async (pin) => {
              if (pin) {
                await offlineService.processQRPayment(data, pin);
                Alert.alert('Success', 'Payment processed');
                setShowScanModal(false);
                loadWalletData();
              }
            }
          }
        ],
        'secure-text'
      );
    } catch (error) {
      Alert.alert('Error', 'Invalid QR code');
    }
  };

  const handleTransfer = async () => {
    if (!transferAmount || !transferPhone || !transferPin) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    try {
      setLoading(true);
      
      if (isConnected) {
        const response = await fetch('/api/wallet/transfer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recipientPhone: transferPhone,
            amount: parseFloat(transferAmount),
            pin: transferPin
          })
        });

        if (response.ok) {
          Alert.alert('Success', 'Transfer completed');
          setTransferAmount('');
          setTransferPhone('');
          setTransferPin('');
          loadWalletData();
        } else {
          throw new Error('Transfer failed');
        }
      } else {
        await offlineService.storeOfflineTransaction({
          type: 'transfer',
          amount: parseFloat(transferAmount),
          recipientId: transferPhone,
          pin: transferPin
        });
        
        Alert.alert('Offline', 'Transfer saved. Will process when online.');
        setTransferAmount('');
        setTransferPhone('');
        setTransferPin('');
      }
    } catch (error) {
      Alert.alert('Error', 'Transfer failed');
    } finally {
      setLoading(false);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <View>
            <Card style={{ marginBottom: 20 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View>
                  <Text style={{ fontSize: 16, color: '#666' }}>Available Balance</Text>
                  <Text style={{ fontSize: 32, fontWeight: 'bold', color: '#2563eb' }}>
                    {balance.toLocaleString()} RWF
                  </Text>
                </View>
                <View style={{ alignItems: 'center' }}>
                  <Ionicons 
                    name={isConnected ? 'wifi' : 'wifi-outline'} 
                    size={24} 
                    color={isConnected ? '#10b981' : '#ef4444'} 
                  />
                  <Text style={{ fontSize: 12, color: isConnected ? '#10b981' : '#ef4444' }}>
                    {isConnected ? 'Online' : 'Offline'}
                  </Text>
                </View>
              </View>
            </Card>

            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>Recent Transactions</Text>
            {transactions.slice(0, 5).map((transaction) => (
              <Card key={transaction.id} style={{ marginBottom: 10 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <View>
                    <Text style={{ fontWeight: 'bold' }}>{transaction.description}</Text>
                    <Text style={{ color: '#666', fontSize: 12 }}>
                      {new Date(transaction.timestamp).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ 
                      fontWeight: 'bold',
                      color: transaction.type === 'deposit' ? '#10b981' : '#ef4444'
                    }}>
                      {transaction.type === 'deposit' ? '+' : '-'}{transaction.amount.toLocaleString()} RWF
                    </Text>
                    <Text style={{ 
                      fontSize: 12,
                      color: transaction.status === 'completed' ? '#10b981' : '#f59e0b'
                    }}>
                      {transaction.status}
                    </Text>
                  </View>
                </View>
              </Card>
            ))}
          </View>
        );

      case 'deposit':
        return (
          <View>
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 20 }}>MTN Mobile Money Deposit</Text>
            <AppTextInput
              placeholder="Amount (RWF)"
              value={depositAmount}
              onChangeText={setDepositAmount}
              keyboardType="numeric"
              style={{ marginBottom: 15 }}
            />
            <AppTextInput
              placeholder="MTN Phone Number"
              value={depositPhone}
              onChangeText={setDepositPhone}
              keyboardType="phone-pad"
              style={{ marginBottom: 20 }}
            />
            <AppButton
              title={loading ? 'Processing...' : 'Deposit Money'}
              onPress={handleDeposit}
              disabled={loading}
            />
          </View>
        );

      case 'withdraw':
        return (
          <View>
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 20 }}>Withdraw to MTN</Text>
            <AppTextInput
              placeholder="Amount (RWF)"
              value={withdrawAmount}
              onChangeText={setWithdrawAmount}
              keyboardType="numeric"
              style={{ marginBottom: 15 }}
            />
            <AppTextInput
              placeholder="MTN Phone Number"
              value={withdrawPhone}
              onChangeText={setWithdrawPhone}
              keyboardType="phone-pad"
              style={{ marginBottom: 15 }}
            />
            <AppTextInput
              placeholder="Wallet PIN"
              value={withdrawPin}
              onChangeText={setWithdrawPin}
              secureTextEntry
              maxLength={4}
              style={{ marginBottom: 20 }}
            />
            <AppButton
              title={loading ? 'Processing...' : 'Withdraw Money'}
              onPress={handleWithdrawal}
              disabled={loading}
            />
          </View>
        );

      case 'qr':
        return (
          <View>
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 20 }}>QR Payments</Text>
            
            <View style={{ flexDirection: 'row', marginBottom: 20 }}>
              <TouchableOpacity
                style={{ 
                  flex: 1, 
                  backgroundColor: '#2563eb', 
                  padding: 15, 
                  borderRadius: 8, 
                  marginRight: 10,
                  alignItems: 'center'
                }}
                onPress={() => {
                  setQrAmount('');
                  setShowQRModal(true);
                }}
              >
                <Ionicons name="qr-code" size={24} color="white" />
                <Text style={{ color: 'white', marginTop: 5 }}>Generate QR</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={{ 
                  flex: 1, 
                  backgroundColor: '#10b981', 
                  padding: 15, 
                  borderRadius: 8,
                  alignItems: 'center'
                }}
                onPress={() => setShowScanModal(true)}
              >
                <Ionicons name="scan" size={24} color="white" />
                <Text style={{ color: 'white', marginTop: 5 }}>Scan QR</Text>
              </TouchableOpacity>
            </View>

            <AppTextInput
              placeholder="Amount for QR Code"
              value={qrAmount}
              onChangeText={setQrAmount}
              keyboardType="numeric"
              style={{ marginBottom: 15 }}
            />
            <AppButton
              title="Generate Payment QR"
              onPress={generateQRCode}
            />
          </View>
        );

      case 'transfer':
        return (
          <View>
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 20 }}>Transfer Money</Text>
            <AppTextInput
              placeholder="Recipient Phone"
              value={transferPhone}
              onChangeText={setTransferPhone}
              keyboardType="phone-pad"
              style={{ marginBottom: 15 }}
            />
            <AppTextInput
              placeholder="Amount (RWF)"
              value={transferAmount}
              onChangeText={setTransferAmount}
              keyboardType="numeric"
              style={{ marginBottom: 15 }}
            />
            <AppTextInput
              placeholder="Wallet PIN"
              value={transferPin}
              onChangeText={setTransferPin}
              secureTextEntry
              maxLength={4}
              style={{ marginBottom: 20 }}
            />
            <AppButton
              title={loading ? 'Processing...' : 'Transfer Money'}
              onPress={handleTransfer}
              disabled={loading}
            />
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <View style={{ padding: 20 }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>Advanced Wallet</Text>
        
        {/* Tab Navigation */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
          {['overview', 'deposit', 'withdraw', 'qr', 'transfer'].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={{
                paddingHorizontal: 20,
                paddingVertical: 10,
                marginRight: 10,
                backgroundColor: activeTab === tab ? '#2563eb' : '#e2e8f0',
                borderRadius: 20
              }}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={{ 
                color: activeTab === tab ? 'white' : '#64748b',
                fontWeight: activeTab === tab ? 'bold' : 'normal'
              }}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <ScrollView showsVerticalScrollIndicator={false}>
          {renderTabContent()}
        </ScrollView>
      </View>

      {/* QR Code Modal */}
      <Modal visible={showQRModal} transparent animationType="slide">
        <View style={{ 
          flex: 1, 
          backgroundColor: 'rgba(0,0,0,0.5)', 
          justifyContent: 'center', 
          alignItems: 'center' 
        }}>
          <View style={{ 
            backgroundColor: 'white', 
            padding: 20, 
            borderRadius: 10, 
            alignItems: 'center',
            width: '80%'
          }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 20 }}>Payment QR Code</Text>
            
            {qrData ? (
              <QRCode value={qrData} size={200} />
            ) : (
              <View>
                <AppTextInput
                  placeholder="Enter amount"
                  value={qrAmount}
                  onChangeText={setQrAmount}
                  keyboardType="numeric"
                  style={{ marginBottom: 15, width: 200 }}
                />
                <AppButton
                  title="Generate QR"
                  onPress={generateQRCode}
                />
              </View>
            )}
            
            <TouchableOpacity
              style={{ marginTop: 20, padding: 10 }}
              onPress={() => {
                setShowQRModal(false);
                setQrData('');
                setQrAmount('');
              }}
            >
              <Text style={{ color: '#2563eb' }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* QR Scanner Modal */}
      <Modal visible={showScanModal} animationType="slide">
        <View style={{ flex: 1 }}>
          <BarCodeScanner
            onBarCodeScanned={({ data }) => handleQRScan(data)}
            style={{ flex: 1 }}
          />
          <TouchableOpacity
            style={{ 
              position: 'absolute', 
              top: 50, 
              right: 20, 
              backgroundColor: 'white', 
              padding: 10, 
              borderRadius: 20 
            }}
            onPress={() => setShowScanModal(false)}
          >
            <Ionicons name="close" size={24} color="black" />
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default AdvancedWalletScreen;