import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, ActivityIndicator, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as api from '../../../services/apiService';
import { useSocket } from '../../../contexts/SocketContext';
import Icon from '../../components/Icon';

export default function BoardingScreen({ route }) {
    const { trip } = route.params;
    const [manifest, setManifest] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [scannedTicketId, setScannedTicketId] = useState('');
    const [scanResult, setScanResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const socket = useSocket();

    const fetchManifest = async () => {
        try {
            setIsLoading(true);
            const data = await api.getTripManifest(trip.id);
            setManifest(data);
        } catch (e) {
            setError('Failed to load passenger manifest.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchManifest();
    }, [trip.id]);
    
    useEffect(() => {
        if (socket) {
            socket.emit('joinTripRoom', trip.id);
            const handlePassengerBoarded = ({ bookingId, newStatus }) => {
                setManifest(prev => prev.map(p => p.booking_id === bookingId ? { ...p, status: newStatus } : p));
            };
            socket.on('passengerBoarded', handlePassengerBoarded);
            return () => { socket.off('passengerBoarded', handlePassengerBoarded); };
        }
    }, [socket, trip.id]);


    const handleVerify = async () => {
        setScanResult(null);
        if (!scannedTicketId) return;
        try {
            const result = await api.confirmBoarding(trip.id, scannedTicketId);
            setScanResult({ type: 'success', message: `Welcome ${result.passengerName} (Seat: ${result.seat})` });
        } catch (e: any) {
            setScanResult({ type: 'error', message: e.message || 'Verification failed.' });
        } finally {
            setScannedTicketId('');
        }
    };
    
    const boardedCount = manifest.filter(p => p.status === 'Completed').length;

    const renderPassenger = ({ item }) => {
        const isBoarded = item.status === 'Completed';
        return (
            <View style={styles.passengerItem}>
                <View>
                    <Text style={styles.passengerName}>{item.passenger_name}</Text>
                    <Text style={styles.passengerDetails}>Seat: {item.seats} | ID: {item.booking_id}</Text>
                </View>
                <Text style={[styles.status, { color: isBoarded ? '#10B981' : '#F59E0B'}]}>{isBoarded ? 'Boarded' : 'Booked'}</Text>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Passenger Boarding</Text>
                <Text style={styles.headerSubtitle}>{trip.route}</Text>
            </View>
            <ScrollView contentContainerStyle={styles.content}>
                 <View style={styles.scannerContainer}>
                    <Icon name="camera" size={80} color="rgba(255, 255, 255, 0.3)" />
                    <Text style={styles.scannerPlaceholder}>Point camera at QR code</Text>
                </View>
                <Text style={styles.manualEntryLabel}>Or Enter Ticket ID Manually:</Text>
                 <View style={styles.inputContainer}>
                    <TextInput 
                        style={styles.input} 
                        placeholder="e.g., GB-123456" 
                        value={scannedTicketId}
                        onChangeText={setScannedTicketId}
                        autoCapitalize="characters"
                    />
                    <TouchableOpacity style={styles.verifyButton} onPress={handleVerify}>
                        <Text style={styles.verifyButtonText}>Verify</Text>
                    </TouchableOpacity>
                </View>
                 {scanResult && (
                    <Text style={scanResult.type === 'success' ? styles.successText : styles.errorText}>
                        {scanResult.message}
                    </Text>
                )}

                <Text style={styles.manifestTitle}>Passenger Manifest ({boardedCount}/{manifest.length})</Text>
                {isLoading ? <ActivityIndicator size="large" /> : (
                    <FlatList
                        data={manifest}
                        renderItem={renderPassenger}
                        keyExtractor={item => item.booking_id.toString()}
                        scrollEnabled={false}
                    />
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F3F4F6' },
    header: { padding: 20, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
    headerTitle: { fontSize: 24, fontWeight: 'bold' },
    headerSubtitle: { fontSize: 16, color: '#6B7280' },
    content: { padding: 20 },
    scannerContainer: {
        aspectRatio: 1,
        width: '100%',
        backgroundColor: '#111827',
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    scannerPlaceholder: { color: 'rgba(255, 255, 255, 0.5)', fontWeight: '600', marginTop: 10 },
    manualEntryLabel: { textAlign: 'center', color: '#6B7280', marginBottom: 8 },
    inputContainer: { flexDirection: 'row', marginBottom: 12 },
    input: {
        flex: 1,
        backgroundColor: 'white',
        padding: 12,
        borderTopLeftRadius: 8,
        borderBottomLeftRadius: 8,
        borderWidth: 1,
        borderColor: '#D1D5DB'
    },
    verifyButton: {
        backgroundColor: '#0033A0',
        padding: 12,
        borderTopRightRadius: 8,
        borderBottomRightRadius: 8,
        justifyContent: 'center'
    },
    verifyButtonText: { color: 'white', fontWeight: 'bold' },
    manifestTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 12, marginTop: 12 },
    passengerItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 12,
        backgroundColor: 'white',
        borderRadius: 8,
        marginBottom: 8,
    },
    passengerName: { fontWeight: '600' },
    passengerDetails: { color: '#6B7280', fontSize: 12 },
    status: { fontWeight: 'bold', textTransform: 'capitalize' },
    successText: { color: 'green', fontWeight: 'bold', textAlign: 'center', marginBottom: 12 },
    errorText: { color: 'red', fontWeight: 'bold', textAlign: 'center', marginBottom: 12 },
});