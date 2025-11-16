import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const mockTransactions = [
    { id: '1', name: 'Kalisa Jean', amount: 30000, date: '2024-10-25' },
    { id: '2', name: 'Mutesi Aline', amount: 15000, date: '2024-10-25' },
];

export default function AgentTransactionsScreen() {
    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.title}>Transaction History</Text>
            <FlatList
                data={mockTransactions}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                    <View style={styles.item}>
                        <View>
                            <Text style={styles.name}>{item.name}</Text>
                            <Text style={styles.date}>{item.date}</Text>
                        </View>
                        <Text style={styles.amount}>+{new Intl.NumberFormat('fr-RW').format(item.amount)}</Text>
                    </View>
                )}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: '#F3F4F6' },
    title: { fontSize: 28, fontWeight: 'bold', marginBottom: 20 },
    item: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, backgroundColor: 'white', borderRadius: 8, marginBottom: 12 },
    name: { fontWeight: 'bold' },
    date: { color: '#6B7280', fontSize: 12 },
    amount: { color: '#059669', fontWeight: 'bold' },
});
