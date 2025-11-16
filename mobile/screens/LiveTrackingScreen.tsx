
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LiveTrackingScreen({ navigation }) {
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.backButton}>{'<'}</Text></TouchableOpacity>
                <Text style={styles.headerTitle}>Live Tracking</Text>
            </View>
            <View style={styles.mapPlaceholder}>
                <Text style={styles.mapText}>Map View Placeholder</Text>
            </View>
            <View style={styles.infoCard}>
                <Text style={styles.infoTitle}>Kigali - Rubavu</Text>
                <Text style={styles.infoSubtitle}>Volcano Express - RAD 123 B</Text>
                <View style={styles.statusContainer}>
                    <View style={styles.statusDot} />
                    <Text style={styles.statusText}>On Time</Text>
                </View>
                <Text style={styles.etaText}>Estimated Arrival: 10:30 AM</Text>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { padding: 20, flexDirection: 'row', alignItems: 'center', backgroundColor: 'white' },
    backButton: { fontSize: 24, fontWeight: 'bold', marginRight: 16, color: '#0033A0' },
    headerTitle: { fontSize: 20, fontWeight: 'bold' },
    mapPlaceholder: {
        flex: 1,
        backgroundColor: '#E5E7EB',
        justifyContent: 'center',
        alignItems: 'center',
    },
    mapText: { color: '#9CA3AF' },
    infoCard: {
        backgroundColor: 'white',
        padding: 20,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 10,
    },
    infoTitle: { fontSize: 22, fontWeight: 'bold' },
    infoSubtitle: { color: '#6B7280', marginBottom: 12 },
    statusContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    statusDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#10B981', marginRight: 8 },
    statusText: { color: '#059669', fontWeight: '600' },
    etaText: { fontSize: 16 },
});
