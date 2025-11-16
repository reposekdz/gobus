import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import useNetwork from '../../hooks/useNetwork';

const StatCard = ({ title, value, icon, format = 'currency' }) => (
    <View style={styles.statCard}>
        <View style={styles.iconBg}>
            <Text>{icon}</Text>
        </View>
        <View>
            <Text style={styles.statTitle}>{title}</Text>
            <Text style={styles.statValue}>
                 {format === 'currency' ? `${new Intl.NumberFormat('fr-RW').format(value)} RWF` : new Intl.NumberFormat().format(value)}
            </Text>
        </View>
    </View>
);

const BarChart = ({ data, title }) => {
    const maxValue = Math.max(...data.map(d => d.amount));
    return (
        <View style={styles.card}>
            <Text style={styles.cardTitle}>{title}</Text>
            <View style={styles.chartContainer}>
                {data.map(item => (
                    <View key={item.day} style={styles.barWrapper}>
                        <View style={[styles.bar, { height: `${(item.amount / maxValue) * 100}%` }]} />
                        <Text style={styles.barLabel}>{item.day}</Text>
                    </View>
                ))}
            </View>
        </View>
    );
}

export default function AgentDashboardScreen() {
    const { isOnline } = useNetwork();
    const dailyDeposits = [
        { day: 'M', amount: 150000 }, { day: 'T', amount: 220000 }, { day: 'W', amount: 180000 },
        { day: 'Th', amount: 250000 }, { day: 'F', amount: 350000 }, { day: 'Sa', amount: 450000 },
        { day: 'Su', amount: 320000 }
    ];

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
                <View style={styles.header}>
                    <Text style={styles.title}>Agent Dashboard</Text>
                     <View style={[styles.statusIndicator, { backgroundColor: isOnline ? '#10B981' : '#F87171' }]}>
                        <Text style={styles.statusText}>{isOnline ? 'Online' : 'Offline'}</Text>
                    </View>
                </View>
                
                {!isOnline && (
                    <View style={styles.offlineBanner}>
                        <Text style={styles.offlineBannerText}>You are offline. Transactions will be queued and synced later.</Text>
                    </View>
                )}

                <View style={styles.statsGrid}>
                    <StatCard title="Today's Deposits" value={1250000} icon="💰" />
                    <StatCard title="Today's Commission" value={25000} icon="💸" />
                    <StatCard title="Total Transactions" value={32} icon="📄" format="number" />
                    <StatCard title="Active Customers" value={18} icon="👥" format="number" />
                </View>
                
                <BarChart data={dailyDeposits} title="Weekly Deposit Trends" />

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F3F4F6' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingHorizontal: 20, paddingTop: 20 },
    title: { fontSize: 28, fontWeight: 'bold' },
    statusIndicator: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    statusText: { color: 'white', fontWeight: '600', fontSize: 12 },
    offlineBanner: {
        backgroundColor: '#FEF2F2',
        borderColor: '#F87171',
        borderWidth: 1,
        padding: 12,
        borderRadius: 8,
        marginHorizontal: 20,
        marginBottom: 20,
    },
    offlineBannerText: {
        color: '#DC2626',
        textAlign: 'center',
        fontSize: 12,
        fontWeight: '500',
    },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: 20 },
    statCard: { width: '48%', backgroundColor: 'white', padding: 16, borderRadius: 12, marginBottom: 16, flexDirection: 'row', alignItems: 'center' },
    iconBg: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E0E7FF', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    statTitle: { color: '#6B7280', fontSize: 12 },
    statValue: { fontSize: 16, fontWeight: 'bold', marginTop: 4 },
    card: { backgroundColor: 'white', padding: 20, borderRadius: 12, marginHorizontal: 20, marginBottom: 16 },
    cardTitle: { fontWeight: 'bold', fontSize: 16, marginBottom: 16 },
    chartContainer: { flexDirection: 'row', height: 150, alignItems: 'flex-end', justifyContent: 'space-between' },
    barWrapper: { flex: 1, alignItems: 'center' },
    bar: { width: '60%', backgroundColor: '#60A5FA', borderRadius: 4 },
    barLabel: { fontSize: 12, color: '#6B7280', marginTop: 4 },
});