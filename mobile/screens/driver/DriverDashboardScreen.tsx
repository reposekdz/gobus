import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const StatCard = ({ label, value, icon }) => (
    <View style={styles.statCard}>
        <Text style={styles.statIcon}>{icon}</Text>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
    </View>
);

const mockTrip = {
    id: 'trip123',
    route: 'Kigali - Rubavu',
    departure: '07:00 AM',
    arrival: '10:30 AM',
    busPlate: 'RAD 123 B',
    passengerCount: 38,
};


export default function DriverDashboardScreen({ navigation }) {
    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Driver Dashboard</Text>
                </View>

                <View style={styles.statsRow}>
                    <StatCard label="Today's Trips" value="4" icon="🚌" />
                    <StatCard label="Total Passengers" value="142" icon="👥" />
                    <StatCard label="Safety Score" value="98%" icon="✅" />
                </View>

                <Text style={styles.sectionTitle}>Current Trip</Text>
                <View style={styles.card}>
                    <Text style={styles.route}>{mockTrip.route}</Text>
                    <View style={styles.timeContainer}>
                        <Text style={styles.time}>{mockTrip.departure}</Text>
                        <Text style={styles.arrow}>→</Text>
                        <Text style={styles.time}>{mockTrip.arrival}</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.tripDetailsRow}>
                        <Text style={styles.detailText}>Plate: {mockTrip.busPlate}</Text>
                        <Text style={styles.detailText}>Passengers: {mockTrip.passengerCount}</Text>
                    </View>
                </View>

                 <TouchableOpacity style={styles.boardingButton} onPress={() => navigation.navigate('DriverBoarding', { trip: mockTrip })}>
                    <Text style={styles.boardingButtonText}>Start Boarding</Text>
                </TouchableOpacity>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F3F4F6' },
    content: { padding: 20 },
    header: { marginBottom: 20 },
    headerTitle: { fontSize: 28, fontWeight: 'bold' },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    statCard: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        width: '32%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    statIcon: {
        fontSize: 24,
    },
    statValue: {
        fontSize: 20,
        fontWeight: 'bold',
        marginVertical: 4,
    },
    statLabel: {
        color: '#6B7280',
        fontSize: 12,
        textAlign: 'center',
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    card: { backgroundColor: 'white', borderRadius: 16, padding: 20, marginBottom: 20 },
    route: { fontSize: 24, fontWeight: 'bold', textAlign: 'center' },
    timeContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginVertical: 8 },
    time: { fontSize: 20, color: '#374151' },
    arrow: { fontSize: 20, color: '#9CA3AF', marginHorizontal: 12 },
    divider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 16 },
    tripDetailsRow: { flexDirection: 'row', justifyContent: 'space-around' },
    detailText: { fontSize: 14, color: '#374151' },
    boardingButton: {
        backgroundColor: '#0033A0',
        padding: 20,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: '#0033A0',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    boardingButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
});