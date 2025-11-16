
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '../../components/Icon';

const mockBuses = [
  { id: 'b1', plate: 'RAD 123 B', model: 'Yutong Explorer', status: 'Operational' },
  { id: 'b2', plate: 'RAE 789 A', model: 'Coaster', status: 'On Route' },
  { id: 'b3', plate: 'RAF 456 C', model: 'Yutong Explorer', status: 'Maintenance' },
];

const BusItem = ({ bus, onPress }) => {
    const statusColor = bus.status === 'Operational' ? '#10B981' : bus.status === 'On Route' ? '#3B82F6' : '#F59E0B';
    return (
        <TouchableOpacity style={styles.item} onPress={onPress}>
            <Icon name="bus" size={24} color="#6B7280" />
            <View style={styles.itemContent}>
                <Text style={styles.plate}>{bus.plate}</Text>
                <Text style={styles.model}>{bus.model}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                <Text style={[styles.status, { color: statusColor }]}>{bus.status}</Text>
            </View>
        </TouchableOpacity>
    );
};

export default function ManageFleetScreen({ navigation }) {
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Manage Fleet</Text>
                <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('AddEditBus')}>
                    <Text style={styles.addButtonText}>+</Text>
                </TouchableOpacity>
            </View>
            <FlatList
                data={mockBuses}
                keyExtractor={item => item.id}
                renderItem={({ item }) => <BusItem bus={item} onPress={() => navigation.navigate('AddEditBus', { bus: item })} />}
                contentContainerStyle={styles.list}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F3F4F6' },
    header: { padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
    headerTitle: { fontSize: 24, fontWeight: 'bold' },
    addButton: { backgroundColor: '#0033A0', width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
    addButtonText: { color: 'white', fontSize: 24, lineHeight: 30 },
    list: { padding: 16 },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
    },
    itemContent: { flex: 1, marginHorizontal: 12 },
    plate: { fontWeight: 'bold', fontSize: 16 },
    model: { color: '#6B7280', fontSize: 12 },
    statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
    status: { fontSize: 12, fontWeight: '600' },
});
