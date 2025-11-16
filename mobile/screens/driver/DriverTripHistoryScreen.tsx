import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as api from '../../../services/apiService';
import { useLanguage } from '../../../contexts/LanguageContext';

const TripItem = ({ item }) => {
    const statusColor = item.status === 'Completed' ? '#10B981' : '#F59E0B';
    return (
        <View style={styles.item}>
            <View style={styles.itemContent}>
                <Text style={styles.route}>{item.route}</Text>
                <Text style={styles.date}>{new Date(item.date).toLocaleDateString()}</Text>
                <Text style={styles.passengers}>Passengers: {item.passengers}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                <Text style={[styles.status, { color: statusColor }]}>{item.status}</Text>
            </View>
        </View>
    );
};

export default function DriverTripHistoryScreen() {
    const [history, setHistory] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { t } = useLanguage();

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                setIsLoading(true);
                const data = await api.driverGetMyHistory();
                setHistory(data);
            } catch (err) {
                setError((err as Error).message || 'Failed to load trip history.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchHistory();
    }, []);

    if (isLoading) {
        return (
            <SafeAreaView style={[styles.container, styles.center]}>
                <ActivityIndicator size="large" />
            </SafeAreaView>
        );
    }
    
     if (error) {
        return (
            <SafeAreaView style={[styles.container, styles.center]}>
                <Text style={styles.errorText}>{error}</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>{t('mobile_driver_history_title')}</Text>
            </View>
            <FlatList
                data={history}
                keyExtractor={item => item.id.toString()}
                renderItem={({ item }) => <TripItem item={item} />}
                contentContainerStyle={styles.list}
                ListEmptyComponent={<Text style={styles.emptyText}>No trip history found.</Text>}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F3F4F6' },
    center: { justifyContent: 'center', alignItems: 'center' },
    header: { padding: 20, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
    headerTitle: { fontSize: 24, fontWeight: 'bold' },
    list: { padding: 16 },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
    },
    itemContent: { flex: 1 },
    route: { fontWeight: 'bold', fontSize: 16 },
    date: { color: '#6B7280', fontSize: 12, marginVertical: 4 },
    passengers: { color: '#6B7280', fontSize: 12 },
    statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
    status: { fontSize: 12, fontWeight: '600' },
    emptyText: { textAlign: 'center', color: '#6B7280', marginTop: 40 },
    errorText: { color: 'red', textAlign: 'center' }
});