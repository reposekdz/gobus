import React, { useState, useEffect, FormEvent } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import useNetwork from '../../hooks/useNetwork';

// In a real app, you would use this:
// import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock AsyncStorage for demonstration in a web environment
const mockAsyncStorage = {
    _data: {},
    setItem: async (key, value) => {
        mockAsyncStorage._data[key] = value;
        return Promise.resolve(null);
    },
    getItem: async (key) => {
        return Promise.resolve(mockAsyncStorage._data[key] || null);
    },
    removeItem: async (key) => {
        delete mockAsyncStorage._data[key];
        return Promise.resolve(null);
    }
};
const AsyncStorage = mockAsyncStorage;
const OFFLINE_QUEUE_KEY = '@RwandaBus:agent_offline_queue';

// Mock API call
const processDepositAPI = async (deposit) => {
    console.log("SYNCING with API:", deposit);
    return new Promise(resolve => setTimeout(() => resolve({ success: true, ...deposit }), 1000));
}


export default function AgentDepositScreen() {
    const { isOnline } = useNetwork();
    const [serialCode, setSerialCode] = useState('');
    const [passengerInfo, setPassengerInfo] = useState<{name: string; serial: string} | null>(null);
    const [amount, setAmount] = useState('');
    const [isFinding, setIsFinding] = useState(false);
    const [isDepositing, setIsDepositing] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    // Sync offline queue when network returns
    useEffect(() => {
        const syncQueue = async () => {
            if (isOnline) {
                try {
                    const queueJSON = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
                    const queue = queueJSON ? JSON.parse(queueJSON) : [];
                    if (queue.length > 0) {
                        console.log(`Syncing ${queue.length} offline transactions...`);
                        Alert.alert("Syncing...", `Syncing ${queue.length} offline transaction(s).`);
                        
                        const syncPromises = queue.map(tx => processDepositAPI(tx));
                        await Promise.all(syncPromises);

                        await AsyncStorage.removeItem(OFFLINE_QUEUE_KEY);
                        Alert.alert("Sync Complete!", "All offline transactions have been synced.");
                    }
                } catch (e) {
                    console.error("Failed to sync offline queue", e);
                }
            }
        };
        syncQueue();
    }, [isOnline]);

    const handleFindPassenger = () => {
        setError('');
        setSuccessMessage('');
        setPassengerInfo(null);
        setAmount('');
        if (!serialCode) {
            setError('Please enter a passenger serial code.');
            return;
        }
        setIsFinding(true);
        setTimeout(() => {
            // Mock passenger lookup
            if (serialCode.toUpperCase().startsWith('UM')) {
                setPassengerInfo({
                    name: 'Kalisa Jean',
                    serial: serialCode.toUpperCase(),
                });
            } else {
                setError('Passenger not found. Please check the code.');
            }
            setIsFinding(false);
        }, 1000);
    };

    const handleDeposit = async () => {
        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount <= 0) {
            setError('Please enter a valid amount.');
            return;
        }
        setError('');
        setIsDepositing(true);

        const depositData = {
            passengerSerial: passengerInfo?.serial,
            amount: numAmount,
            timestamp: new Date().toISOString()
        };

        if (isOnline) {
            // Process online
            try {
                const result: any = await processDepositAPI(depositData);
                if (result.success) {
                    setSuccessMessage(`Successfully deposited ${numAmount} RWF for ${passengerInfo?.name}.`);
                    resetForm();
                } else {
                     setError('An error occurred during deposit.');
                }
            } catch (e) {
                 setError('A network error occurred.');
            }
        } else {
            // Process offline
            try {
                const queueJSON = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
                const queue = queueJSON ? JSON.parse(queueJSON) : [];
                queue.push(depositData);
                await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
                setSuccessMessage(`Offline: Deposit of ${numAmount} RWF for ${passengerInfo?.name} has been queued.`);
                resetForm();
            } catch(e) {
                setError("Could not save offline transaction.");
            }
        }
        setIsDepositing(false);
    };
    
    const resetForm = () => {
        setPassengerInfo(null);
        setSerialCode('');
        setAmount('');
    }

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.title}>Make a Deposit</Text>
             {successMessage && <Text style={styles.successText}>{successMessage}</Text>}
             {error && <Text style={styles.errorText}>{error}</Text>}

            {!passengerInfo ? (
                 <View style={styles.card}>
                    <Text style={styles.label}>Passenger Serial Code</Text>
                    <TextInput style={styles.input} value={serialCode} onChangeText={setSerialCode} placeholder="e.g., UM1234" />
                    <TouchableOpacity style={styles.button} onPress={handleFindPassenger} disabled={isFinding}>
                        {isFinding ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>Find Passenger</Text>}
                    </TouchableOpacity>
                </View>
            ) : (
                <View style={styles.card}>
                     <View style={styles.passengerFound}>
                        <Text>Passenger Found:</Text>
                        <Text style={styles.passengerName}>{passengerInfo.name}</Text>
                        <TouchableOpacity onPress={resetForm}><Text style={styles.changeText}> (Change)</Text></TouchableOpacity>
                    </View>
                    <Text style={styles.label}>Amount (RWF)</Text>
                    <TextInput style={styles.input} value={amount} onChangeText={setAmount} keyboardType="numeric" placeholder="0" />
                    <TouchableOpacity style={[styles.button, styles.depositButton]} onPress={handleDeposit} disabled={isDepositing}>
                        {isDepositing ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>Confirm Deposit</Text>}
                    </TouchableOpacity>
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: '#F3F4F6' },
    title: { fontSize: 28, fontWeight: 'bold', marginBottom: 20 },
    card: { backgroundColor: 'white', padding: 20, borderRadius: 12 },
    label: { fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 8 },
    input: { backgroundColor: '#F9FAFB', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#D1D5DB', marginBottom: 16 },
    button: { backgroundColor: '#0033A0', padding: 16, borderRadius: 8, alignItems: 'center' },
    depositButton: { backgroundColor: '#10B981' },
    buttonText: { color: 'white', fontWeight: 'bold' },
    errorText: { color: 'red', marginBottom: 10, textAlign: 'center' },
    successText: { color: 'green', marginBottom: 10, textAlign: 'center' },
    passengerFound: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, backgroundColor: '#E0E7FF', padding: 10, borderRadius: 8 },
    passengerName: { fontWeight: 'bold', marginLeft: 4 },
    changeText: { color: '#4F46E5', fontWeight: '600' }
});