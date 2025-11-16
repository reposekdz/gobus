import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const StatCard = ({ title, value, icon }) => (
    <View style={styles.statCard}>
        <Text style={styles.statIcon}>{icon}</Text>
        <Text style={styles.statTitle}>{title}</Text>
        <Text style={styles.statValue}>{value}</Text>
    </View>
);

export default function CompanyDashboardScreen() {
    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.headerTitle}>Volcano Express Dashboard</Text>
                
                <View style={styles.statsGrid}>
                    <StatCard title="Today's Revenue" value="5.6M RWF" icon="💰" />
                    <StatCard title="Today's Passengers" value="1,250" icon="👥" />
                    <StatCard title="Buses on Route" value="28 / 35" icon="🚌" />
                    <StatCard title="Driver Availability" value="32 / 38" icon="👤" />
                </View>

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Live Fleet Map</Text>
                    <View style={styles.mapPlaceholder}>
                        <Text style={styles.placeholderText}>Map View</Text>
                    </View>
                </View>

                 <View style={styles.card}>
                    <Text style={styles.cardTitle}>Recent Activity</Text>
                     <Text style={styles.placeholderText}>Activity feed coming soon.</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F3F4F6' },
    content: { padding: 20 },
    headerTitle: { fontSize: 28, fontWeight: 'bold', marginBottom: 20 },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    statCard: {
        width: '48%',
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        alignItems: 'center',
    },
    statIcon: { fontSize: 32, marginBottom: 8 },
    statTitle: { color: '#6B7280', fontSize: 12 },
    statValue: { fontSize: 20, fontWeight: 'bold', marginTop: 4 },
    card: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    mapPlaceholder: {
        height: 200,
        backgroundColor: '#E5E7EB',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderText: {
        color: '#9CA3AF',
    },
});