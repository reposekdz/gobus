import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const mockFoundItems = [
    { id: '1', item: 'Black Backpack', date: '2024-10-27', route: 'Kigali - Huye', status: 'At Nyabugogo Office' },
    { id: '2', item: 'Headphones', date: '2024-10-26', route: 'Kigali - Rubavu', status: 'Claimed' },
    { id: '3', item: 'Blue Umbrella', date: '2024-10-25', route: 'Kigali - Musanze', status: 'At Musanze Office' },
];


export default function LostAndFoundScreen({ navigation }) {
    
    const renderItem = ({ item }) => (
        <View style={styles.itemCard}>
            <Text style={styles.itemTitle}>{item.item}</Text>
            <Text style={styles.itemDetails}>Found on {item.date} ({item.route})</Text>
            <Text style={[styles.itemStatus, { color: item.status === 'Claimed' ? '#9CA3AF' : '#10B981' }]}>{item.status}</Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.backButton}>{'<'}</Text></TouchableOpacity>
                <Text style={styles.headerTitle}>Lost & Found</Text>
            </View>
            <ScrollView style={styles.content}>
                <Text style={styles.description}>
                    Lost an item on one of our buses? Found something that someone else left behind? Let us know.
                </Text>
                <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('ReportLostItem')}>
                    <Text style={styles.buttonText}>Report a Lost Item</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.button, styles.secondaryButton]}>
                    <Text style={[styles.buttonText, styles.secondaryButtonText]}>Inquire About a Found Item</Text>
                </TouchableOpacity>
                
                 <Text style={styles.listHeader}>Recently Found Items</Text>
                 <FlatList
                    data={mockFoundItems}
                    keyExtractor={item => item.id}
                    renderItem={renderItem}
                    scrollEnabled={false} // To allow parent scrollview to handle scroll
                />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    header: { padding: 16, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#E5E7EB', flexDirection: 'row', alignItems: 'center' },
    backButton: { fontSize: 24, fontWeight: 'bold', marginRight: 16, color: '#0033A0' },
    headerTitle: { fontSize: 20, fontWeight: 'bold' },
    content: { padding: 20 },
    description: { fontSize: 16, color: '#374151', lineHeight: 24, marginBottom: 24 },
    button: { backgroundColor: '#0033A0', padding: 16, borderRadius: 8, alignItems: 'center', marginBottom: 16 },
    buttonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
    secondaryButton: { backgroundColor: 'white', borderWidth: 1, borderColor: '#0033A0' },
    secondaryButtonText: { color: '#0033A0' },
    listHeader: {
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 24,
        marginBottom: 12,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        paddingTop: 16,
    },
    itemCard: {
        backgroundColor: 'white',
        borderRadius: 8,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    itemTitle: {
        fontWeight: 'bold',
        fontSize: 16,
    },
    itemDetails: {
        color: '#6B7280',
        fontSize: 12,
        marginTop: 4,
    },
    itemStatus: {
        fontWeight: '600',
        fontSize: 12,
        marginTop: 8,
    },
});