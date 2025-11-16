import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/useAuth';

const StatCard = ({ title, value }) => (
    <View style={styles.statCard}>
        <Text style={styles.statTitle}>{title}</Text>
        <Text style={styles.statValue}>{value}</Text>
    </View>
);

export default function AgentProfileScreen() {
    const { user } = useAuth();

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView>
                <View style={styles.header}>
                    <Image source={{ uri: user?.avatar_url }} style={styles.avatar} />
                    <Text style={styles.name}>{user?.name}</Text>
                    <Text style={styles.location}>Nyabugogo Agent</Text>
                </View>
                
                <View style={styles.statsContainer}>
                    <StatCard title="Total Commission (Month)" value={`${new Intl.NumberFormat('fr-RW').format(185000)} RWF`} />
                    <StatCard title="Total Deposits (Month)" value={`${new Intl.NumberFormat('fr-RW').format(3700000)} RWF`} />
                    <StatCard title="Transactions (Month)" value="128" />
                    <StatCard title="Avg. Tx Size" value={`${new Intl.NumberFormat('fr-RW').format(28906)} RWF`} />
                </View>

                 <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Performance</Text>
                    <Text style={styles.placeholder}>Charts and performance details will be shown here.</Text>
                 </View>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F3F4F6' },
    header: {
        backgroundColor: 'white',
        padding: 24,
        alignItems: 'center',
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    avatar: { width: 100, height: 100, borderRadius: 50, marginBottom: 12 },
    name: { fontSize: 24, fontWeight: 'bold' },
    location: { color: '#6B7280' },
    statsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        padding: 20,
    },
    statCard: {
        width: '48%',
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
    },
    statTitle: { color: '#6B7280', fontSize: 12 },
    statValue: { fontSize: 18, fontWeight: 'bold', marginTop: 8 },
    section: {
        paddingHorizontal: 20,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    placeholder: {
        color: '#9CA3AF',
        textAlign: 'center',
        paddingVertical: 40,
    },
});
