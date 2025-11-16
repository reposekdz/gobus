import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../contexts/LanguageContext';

const mockTransactions = [
    { id: '1', type: 'topup', amount: 20000, date: '2024-10-20' },
    { id: '2', type: 'purchase', amount: -4500, date: '2024-10-22', details: 'Kigali to Rubavu' },
    { id: '3', type: 'purchase', amount: -3000, date: '2024-10-24', details: 'Huye to Kigali' },
];

export default function WalletScreen({ navigation }) {
    const { user } = useAuth();
    const { t } = useLanguage();

    const renderTransaction = ({ item }) => {
        const isTopUp = item.type === 'topup';
        return (
            <View style={styles.item}>
                <View style={styles.itemLeft}>
                    <Text style={styles.itemIcon}>{isTopUp ? '➕' : '🎟️'}</Text>
                    <View>
                        <Text style={styles.itemType}>{isTopUp ? 'Top Up' : 'Ticket Purchase'}</Text>
                        <Text style={styles.itemDate}>{item.date}</Text>
                    </View>
                </View>
                <Text style={[styles.itemAmount, { color: isTopUp ? '#10B981' : '#374151'}]}>
                    {isTopUp ? '+' : ''}{new Intl.NumberFormat('fr-RW').format(item.amount)}
                </Text>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.backButton}>{'<'}</Text></TouchableOpacity>
                <Text style={styles.headerTitle}>{t('mobile_wallet_title')}</Text>
            </View>

            <View style={styles.balanceCard}>
                <Text style={styles.balanceLabel}>{t('mobile_wallet_balance')}</Text>
                <Text style={styles.balanceAmount}>{new Intl.NumberFormat('fr-RW').format(user?.wallet_balance || 0)} RWF</Text>
                <TouchableOpacity style={styles.addButton}>
                    <Text style={styles.addButtonText}>{t('mobile_wallet_add')}</Text>
                </TouchableOpacity>
            </View>
            
            <Text style={styles.historyTitle}>{t('mobile_wallet_history')}</Text>
            
            <FlatList
                data={mockTransactions}
                keyExtractor={item => item.id}
                renderItem={renderTransaction}
                ListEmptyComponent={<Text style={styles.emptyText}>{t('mobile_wallet_empty')}</Text>}
                contentContainerStyle={styles.listContainer}
            />

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F3F4F6' },
    header: { padding: 16, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#E5E7EB', flexDirection: 'row', alignItems: 'center' },
    backButton: { fontSize: 24, fontWeight: 'bold', marginRight: 16, color: '#0033A0' },
    headerTitle: { fontSize: 20, fontWeight: 'bold' },
    balanceCard: {
        backgroundColor: '#0033A0',
        borderRadius: 16,
        padding: 24,
        margin: 16,
        alignItems: 'center',
    },
    balanceLabel: { color: '#A7C7E7', fontSize: 14 },
    balanceAmount: { color: 'white', fontSize: 36, fontWeight: 'bold', marginVertical: 8 },
    addButton: { backgroundColor: 'white', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 20 },
    addButtonText: { color: '#0033A0', fontWeight: 'bold' },
    historyTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 16,
        marginBottom: 8,
    },
    listContainer: {
        paddingHorizontal: 16,
    },
    item: {
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    itemLeft: { flexDirection: 'row', alignItems: 'center' },
    itemIcon: { fontSize: 20, marginRight: 12 },
    itemType: { fontWeight: '600' },
    itemDate: { fontSize: 12, color: '#6B7280' },
    itemAmount: { fontWeight: 'bold', fontSize: 16 },
    emptyText: { textAlign: 'center', color: '#6B7280', marginTop: 20 }
});
