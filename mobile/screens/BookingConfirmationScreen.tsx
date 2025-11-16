// New screen to confirm a successful booking.

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const CheckIcon = () => <Text style={styles.checkIcon}>✓</Text>;

export default function BookingConfirmationScreen({ route, navigation }) {
    const { bookingDetails } = route.params;
    const pointsEarned = Math.floor(bookingDetails.totalPrice / 100); // Mock points

    const onShare = async () => {
        try {
          await Share.share({
            message: `I just booked a trip from ${bookingDetails.from} to ${bookingDetails.to} with GoBus! #GoBus #RwandaTravel`,
          });
        } catch (error: any) {
          Alert.alert(error.message);
        }
    };

    if (!bookingDetails) {
        return (
            <SafeAreaView style={styles.container}>
                <Text>Something went wrong.</Text>
            </SafeAreaView>
        );
    }
    
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <View style={styles.iconContainer}>
                    <CheckIcon />
                </View>
                <Text style={styles.title}>Booking Confirmed!</Text>
                <Text style={styles.subtitle}>Your ticket has been sent to your email. You can also find it in the "My Tickets" section.</Text>
                
                {pointsEarned > 0 && <Text style={styles.pointsText}>✨ You've earned {pointsEarned} GoPoints! ✨</Text>}

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>{bookingDetails.from} to {bookingDetails.to}</Text>
                    <Text style={styles.cardCompany}>{bookingDetails.company}</Text>
                    <View style={styles.divider} />
                    <Text style={styles.cardDetails}>Date: {new Date(bookingDetails.createdAt).toLocaleDateString()}</Text>
                    <Text style={styles.cardDetails}>Seats: {Array.isArray(bookingDetails.seats) ? bookingDetails.seats.join(', ') : bookingDetails.seats}</Text>
                    <Text style={styles.cardDetails}>Booking ID: {bookingDetails.bookingId}</Text>
                </View>

                <TouchableOpacity 
                    style={styles.button}
                    onPress={() => navigation.navigate('MainApp', { screen: 'My Tickets'})}
                >
                    <Text style={styles.buttonText}>View My Tickets</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={[styles.button, styles.shareButton]}
                    onPress={onShare}
                >
                    <Text style={[styles.buttonText, styles.shareButtonText]}>Share My Trip</Text>
                </TouchableOpacity>

                 <TouchableOpacity onPress={() => navigation.popToTop()}>
                    <Text style={styles.homeLink}>Back to Home</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F3F4F6' },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#10B981',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    checkIcon: {
        color: 'white',
        fontSize: 40,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
        marginTop: 8,
        marginBottom: 16,
    },
    pointsText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#D97706',
        marginBottom: 24,
        backgroundColor: '#FEF3C7',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 16,
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        width: '100%',
        marginBottom: 24,
    },
    cardTitle: { fontSize: 20, fontWeight: 'bold' },
    cardCompany: { color: '#6B7280', marginBottom: 12 },
    divider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 12 },
    cardDetails: { fontSize: 14, color: '#374151', marginBottom: 4 },
    button: {
        backgroundColor: '#0033A0',
        padding: 16,
        borderRadius: 8,
        width: '100%',
        alignItems: 'center',
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    shareButton: {
        backgroundColor: '#10B981',
        marginTop: 12,
    },
    shareButtonText: {
        color: 'white',
    },
    homeLink: {
        marginTop: 20,
        color: '#0033A0',
        fontWeight: '600',
    }
});