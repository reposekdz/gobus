
import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '../../components/Icon';

const mockDrivers = [
  { id: 'd1', name: 'John Doe', status: 'Active', avatarUrl: 'https://randomuser.me/api/portraits/men/4.jpg' },
  { id: 'd2', name: 'Mary Anne', status: 'On Leave', avatarUrl: 'https://randomuser.me/api/portraits/women/6.jpg' },
];

const DriverItem = ({ driver, onPress }) => {
     const statusColor = driver.status === 'Active' ? '#10B981' : '#F59E0B';
    return (
        <TouchableOpacity style={styles.item} onPress={onPress}>
            <Image source={{ uri: driver.avatarUrl }} style={styles.avatar} />
            <View style={styles.itemContent}>
                <Text style={styles.name}>{driver.name}</Text>
            </View>
             <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                <Text style={[styles.status, { color: statusColor }]}>{driver.status}</Text>
            </View>
        </TouchableOpacity>
    );
};

export default function ManageDriversScreen({ navigation }) {
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Manage Drivers</Text>
                <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('AddEditDriver')}>
                    <Text style={styles.addButtonText}>+</Text>
                </TouchableOpacity>
            </View>
            <FlatList
                data={mockDrivers}
                keyExtractor={item => item.id}
                renderItem={({ item }) => <DriverItem driver={item} onPress={() => navigation.navigate('AddEditDriver', { driver: item })} />}
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
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    itemContent: { flex: 1, marginHorizontal: 12 },
    name: { fontWeight: 'bold', fontSize: 16 },
    statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
    status: { fontSize: 12, fontWeight: '600' },
});
