
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

export default function AdminDashboardScreen() {
    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.headerTitle}>Admin Overview</Text>
                
                <View style={styles.statsGrid}>
                    <StatCard title="Total Revenue" value="25.8M RWF" icon="💰" />
                    <StatCard title="Total Passengers" value="8.6M" icon="👥" />
                    <StatCard title="Active Companies" value="4" icon="🏢" />
                    <StatCard title="Registered Agents" value="2" icon="👤" />
                </View>

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Recent Activity</Text>
                     <Text style={styles.placeholderText}>A live feed of platform activity will be shown here.</Text>
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
    statTitle: { color: '#6B7280', fontSize: 12, textAlign: 'center' },
    statValue: { fontSize: 18, fontWeight: 'bold', marginTop: 4, textAlign: 'center' },
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
    placeholderText: {
        color: '#9CA3AF',
        textAlign: 'center',
        paddingVertical: 20,
    },
});
