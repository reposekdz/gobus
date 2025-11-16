import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as api from '../../services/apiService';
import { useAuth } from '../hooks/useAuth';
import PinInput from '../components/PinInput';
import AppButton from '../components/AppButton';

export default function PaymentScreen({ route, navigation }) {
    const { tripDetails, selectedSeats } = route.params;
    const { user, setUser } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [showPinInput, setShowPinInput] = useState(false);
    const [pin, setPin] = useState(['', '', '', '']);
    
    const totalPrice = selectedSeats.length * (tripDetails.route.basePrice || 0);

    const handlePay = () => {
        if ((user?.wallet_balance || 0) < totalPrice) {
            Alert.alert("Insufficient Funds", "Your wallet balance is too low to complete this purchase.");
            return;
        }
        setShowPinInput(true);
    };

    const handlePinComplete = async () => {
        const pinString = pin.join('');
        if (pinString.length !== 4) {
            Alert.alert("Invalid PIN", "Please enter all 4 digits of your PIN.");
            return;
        }
        
        setIsLoading(true);
        try {
            const bookingPayload = {
                tripId: tripDetails._id,
                seats: selectedSeats,
                paymentMethod: 'wallet',
                totalPrice,
                pin: pinString,
            };
            const confirmedBooking = await api.createBooking(bookingPayload);
            
            // Update user's wallet balance in context
            setUser(prev => ({...prev, wallet_balance: (prev?.wallet_balance || 0) - totalPrice}));
            
            const finalBookingDetails = {
                ...tripDetails,
                ...confirmedBooking,
                seats: selectedSeats,
                totalPrice,
                from: tripDetails.route.from,
                to: tripDetails.route.to,
                company: tripDetails.route.company.name,
                departureTime: new Date(tripDetails.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                passengerName: user?.name,
            };

            navigation.replace('BookingConfirmation', { bookingDetails: finalBookingDetails });
            
        } catch (error) {
            Alert.alert("Payment Failed", error.message || "An error occurred during booking.");
        } finally {
            setIsLoading(false);
            setShowPinInput(false);
            setPin(['', '', '', '']);
        }
    };
    
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.backButton}>{'<'}</Text></TouchableOpacity>
                <Text style={styles.headerTitle}>Confirm & Pay</Text>
            </View>
            
            <View style={styles.content}>
                <View style={styles.card}>
                    <Text style={styles.summaryTitle}>Order Summary</Text>
                    <View style={styles.row}>
                        <Text style={styles.label}>Route</Text>
                        <Text style={styles.value}>{tripDetails.route.from} to {tripDetails.route.to}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Seats</Text>
                        <Text style={styles.value}>{selectedSeats.join(', ')}</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.row}>
                        <Text style={styles.label}>Total Price</Text>
                        <Text style={styles.totalPrice}>{new Intl.NumberFormat('fr-RW').format(totalPrice)} RWF</Text>
                    </View>
                </View>
                
                {showPinInput ? (
                    <View style={styles.card}>
                        <Text style={styles.pinTitle}>Enter Your Wallet PIN</Text>
                        <PinInput pin={pin} onPinChange={setPin} />
                        <AppButton title="Confirm Payment" onPress={handlePinComplete} isLoading={isLoading} style={{ marginTop: 24 }}/>
                    </View>
                ) : (
                    <AppButton title="Pay with Wallet" onPress={handlePay} isLoading={isLoading}/>
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F3F4F6' },
    header: { padding: 16, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#E5E7EB', flexDirection: 'row', alignItems: 'center' },
    backButton: { fontSize: 24, fontWeight: 'bold', marginRight: 16, color: '#0033A0' },
    headerTitle: { fontSize: 20, fontWeight: 'bold' },
    content: { padding: 20, flex: 1 },
    card: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
    },
    summaryTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
    row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    label: { color: '#6B7280' },
    value: { fontWeight: '600' },
    divider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 8 },
    totalPrice: { fontSize: 20, fontWeight: 'bold', color: '#059669' },
    pinTitle: { textAlign: 'center', fontSize: 16, fontWeight: '600', marginBottom: 20 },
});
