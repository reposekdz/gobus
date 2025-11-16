import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../hooks/useAuth';

const mockHistory = [
    { id: '1', type: 'earn', description: 'Trip to Rubavu', points: 90 },
    { id: '2', type: 'referral', description: 'Friend sign-up', points: 500 },
    { id: '3', type: 'redeem', description: 'Discount on Huye trip', points: -500 },
];

export default function LoyaltyScreen({ navigation }) {
    const { user } = useAuth();

    const renderItem = ({ item }) => (
        <View style={styles.item}>
            <View style={styles.itemLeft}>
                <Text style={styles.itemIcon}>{item.type === 'earn' ? '🎟️' : item.type === 'referral' ? '👥' : '💸'}</Text>
                <Text style={styles.itemDescription}>{item.description}</Text>
            </View>
            <Text style={[styles.itemPoints, { color: item.points > 0 ? '#10B981' : '#EF4444'}]}>
                {item.points > 0 ? '+' : ''}{item.points}
            </Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.backButton}>{'<'}</Text></TouchableOpacity>
                <Text style={styles.headerTitle}>GoPoints</Text>
            </View>

            <View style={styles.balanceCard}>
                <Text style={styles.balanceLabel}>Current Balance</Text>
                <Text style={styles.balanceAmount}>{new Intl.NumberFormat().format(user?.loyalty_points || 0)}</Text>
                <Text style={styles.balanceSub}>GoPoints</Text>
            </View>
            
            <Text style={styles.historyTitle}>Points History</Text>
            
            <FlatList
                data={mockHistory}
                keyExtractor={item => item.id}
                renderItem={renderItem}
                ListEmptyComponent={<Text style={styles.emptyText}>No points history yet.</Text>}
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
        backgroundColor: '#FEF3C7',
        borderRadius: 16,
        padding: 24,
        margin: 16,
        alignItems: 'center',
    },
    balanceLabel: { color: '#92400E', fontSize: 14, fontWeight: '600' },
    balanceAmount: { color: '#92400E', fontSize: 48, fontWeight: 'bold' },
    balanceSub: { color: '#D97706', fontSize: 16 },
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
    itemDescription: { fontWeight: '600' },
    itemPoints: { fontWeight: 'bold', fontSize: 16 },
    emptyText: { textAlign: 'center', color: '#6B7280', marginTop: 20 }
});
