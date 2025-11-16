import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const searchResults = [
  { id: 1, company: 'Volcano Express', departureTime: '07:00', arrivalTime: '10:30', price: 4500, seats: 23 },
  { id: 2, company: 'Horizon Express', departureTime: '08:30', arrivalTime: '12:15', price: 4800, seats: 15 },
  { id: 3, company: 'RITCO', departureTime: '09:00', arrivalTime: '12:30', price: 4500, seats: 30 },
];

interface TripCardProps {
    trip: typeof searchResults[0];
    onPress: () => void;
}

const TripCard: React.FC<TripCardProps> = ({ trip, onPress }) => (
    <TouchableOpacity style={styles.card} onPress={onPress}>
        <View style={styles.companyRow}>
            <Text style={styles.company}>{trip.company}</Text>
            <Text style={styles.price}>{new Intl.NumberFormat('fr-RW').format(trip.price)} RWF</Text>
        </View>
        <View style={styles.timeRow}>
            <Text style={styles.time}>{trip.departureTime}</Text>
            <Text style={styles.arrow}>→</Text>
            <Text style={styles.time}>{trip.arrivalTime}</Text>
        </View>
        <Text style={styles.seats}>{trip.seats} seats available</Text>
    </TouchableOpacity>
);

export default function SearchResultsScreen({ route, navigation }) {
    // const { from, to } = route.params;
    const { from, to } = { from: 'Kigali', to: 'Rubavu' }; // Mock data

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.backButton}>{'<'}</Text></TouchableOpacity>
                <View>
                    <Text style={styles.headerTitle}>{from} to {to}</Text>
                    <Text style={styles.headerSubtitle}>Oct 28, 2024</Text>
                </View>
            </View>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {searchResults.map(trip => (
                    <TripCard key={trip.id} trip={trip} onPress={() => navigation.navigate('SeatSelection', { trip })} />
                ))}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F3F4F6' },
    header: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#E5E7EB', backgroundColor: 'white', flexDirection: 'row', alignItems: 'center' },
    backButton: { fontSize: 24, fontWeight: 'bold', marginRight: 16, color: '#0033A0' },
    headerTitle: { fontSize: 20, fontWeight: 'bold' },
    headerSubtitle: { color: '#6B7280' },
    scrollContent: { padding: 16 },
    card: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    companyRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    company: {
        fontWeight: 'bold',
        fontSize: 16,
    },
    price: {
        fontWeight: 'bold',
        fontSize: 16,
        color: '#059669',
    },
    timeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    time: {
        fontSize: 20,
        fontWeight: '700',
    },
    arrow: {
        marginHorizontal: 12,
        color: '#9CA3AF',
    },
    seats: {
        fontSize: 12,
        color: '#6B7280',
    }
});
