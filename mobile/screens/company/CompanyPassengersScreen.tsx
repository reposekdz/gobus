import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const mockPassengers = [
  { id: '1', name: 'Kalisa Jean', route: 'Kigali - Rubavu', date: '2024-10-25' },
  { id: '2', name: 'Mugisha Frank', route: 'Kigali - Musanze', date: '2024-10-25' },
  { id: '3', name: 'Irakoze Grace', route: 'Kigali - Rubavu', date: '2024-10-24' },
  { id: '4', name: 'Umutoni Aline', route: 'Kigali - Huye', date: '2024-10-23' },
  { id: '5', name: 'Gatete David', route: 'Huye - Kigali', date: '2024-10-22' },
];

export default function CompanyPassengersScreen() {
    const [searchTerm, setSearchTerm] = useState('');
    
    const filteredPassengers = useMemo(() => {
        return mockPassengers.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [searchTerm]);

    const renderItem = ({ item }) => (
        <View style={styles.item}>
            <View>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.details}>{item.route}</Text>
            </View>
            <Text style={styles.details}>{item.date}</Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Passenger History</Text>
            </View>
             <View style={styles.searchContainer}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search by passenger name..."
                    value={searchTerm}
                    onChangeText={setSearchTerm}
                />
            </View>
            <FlatList
                data={filteredPassengers}
                keyExtractor={item => item.id}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
                 ListEmptyComponent={<Text style={styles.emptyText}>No passengers found.</Text>}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F3F4F6' },
    header: { padding: 20, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
    headerTitle: { fontSize: 24, fontWeight: 'bold' },
    searchContainer: {
        padding: 16,
        backgroundColor: 'white',
    },
    searchInput: {
        backgroundColor: '#F3F4F6',
        padding: 12,
        borderRadius: 8,
    },
    list: { padding: 16 },
    item: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'white',
        borderRadius: 8,
        padding: 16,
        marginBottom: 12,
    },
    name: { fontWeight: 'bold', fontSize: 16 },
    details: { color: '#6B7280', fontSize: 12, marginTop: 4 },
    emptyText: {
        textAlign: 'center',
        marginTop: 40,
        color: '#6B7280'
    }
});