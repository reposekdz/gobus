// New screen for interactive seat selection.

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BusSeat, { SeatStatus } from '../components/BusSeat';
import * as api from '../../services/apiService';

const generateSeatGrid = (seatMap: { [key: string]: string }, capacity: number) => {
    const grid: any[][] = [];
    if (!seatMap || Object.keys(seatMap).length === 0) return grid;

    const seats = Object.keys(seatMap).sort((a,b) => parseInt(a.slice(0, -1)) - parseInt(b.slice(0, -1)) || a.charCodeAt(a.length - 1) - b.charCodeAt(b.length - 1));
    
    let row: any[] = [];
    let currentRowNum = "1";
    seats.forEach(seatId => {
        const rowNum = seatId.slice(0, -1);
        if (rowNum !== currentRowNum) {
            grid.push(row);
            row = [];
            currentRowNum = rowNum;
        }
        
        // Add aisle placeholder
        if(seatId.endsWith('C') && !row.some(s => s.id === 'aisle')) {
            row.push({id: `aisle-${rowNum}`, status: 'aisle'});
        }

        row.push({
            id: seatId,
            status: seatMap[seatId],
        });
    });
    grid.push(row); // push the last row
    return grid;
}


export default function SeatSelectionScreen({ route, navigation }) {
    const { trip: initialTrip } = route.params;
    
    const [tripDetails, setTripDetails] = useState(null);
    const [seatGrid, setSeatGrid] = useState<any[][]>([]);
    const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchTripDetails = async () => {
            setIsLoading(true);
            try {
                const data = await api.getTripDetails(initialTrip.id);
                setTripDetails(data);
                const grid = generateSeatGrid(data.seatMap, data.bus.capacity);
                setSeatGrid(grid);
            } catch (e) {
                setError('Failed to load seat map.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchTripDetails();
    }, [initialTrip.id]);

    const handleSelectSeat = (seatId: string) => {
        if (selectedSeats.includes(seatId)) {
            setSelectedSeats(selectedSeats.filter(id => id !== seatId));
        } else {
            setSelectedSeats([...selectedSeats, seatId]);
        }
    };
    
    const totalPrice = selectedSeats.length * (tripDetails?.route.basePrice || 0);

    const renderContent = () => {
        if (isLoading) {
            return <ActivityIndicator size="large" style={{ marginTop: 50 }} />;
        }
        if (error) {
            return <Text style={styles.errorText}>{error}</Text>;
        }
        return (
            <View style={styles.busContainer}>
                <View style={styles.driverArea}><Text>Driver</Text></View>
                {seatGrid.map((row, rowIndex) => (
                    <View key={rowIndex} style={styles.seatRow}>
                        {row.map(seat => (
                            <BusSeat 
                                key={seat.id} 
                                seatId={seat.id}
                                status={selectedSeats.includes(seat.id) ? 'selected' : seat.status} 
                                onPress={handleSelectSeat}
                            />
                        ))}
                    </View>
                ))}
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.backButton}>{'<'}</Text></TouchableOpacity>
                <Text style={styles.headerTitle}>Select Your Seat</Text>
            </View>
            
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                {renderContent()}
                 {!isLoading && !error && (
                    <View style={styles.legendContainer}>
                        <View style={styles.legendItem}><View style={[styles.legendBox, styles.available]} /><Text>Available</Text></View>
                        <View style={styles.legendItem}><View style={[styles.legendBox, styles.occupied]} /><Text>Occupied</Text></View>
                        <View style={styles.legendItem}><View style={[styles.legendBox, styles.selected]} /><Text>Selected</Text></View>
                    </View>
                )}
            </ScrollView>
            
            <View style={styles.footer}>
                <View>
                    <Text style={styles.totalPrice}>{new Intl.NumberFormat('fr-RW').format(totalPrice)} RWF</Text>
                    <Text style={styles.seatsSelected}>{selectedSeats.length} seat(s) selected</Text>
                </View>
                <TouchableOpacity 
                    style={[styles.confirmButton, selectedSeats.length === 0 && styles.disabledButton]}
                    disabled={selectedSeats.length === 0}
                    onPress={() => navigation.navigate('Payment', { tripDetails, selectedSeats })}
                >
                    <Text style={styles.confirmButtonText}>Confirm</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'white' },
    header: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#E5E7EB', flexDirection: 'row', alignItems: 'center' },
    backButton: { fontSize: 24, fontWeight: 'bold', marginRight: 16, color: '#0033A0' },
    headerTitle: { fontSize: 20, fontWeight: 'bold' },
    scrollContainer: { padding: 20 },
    busContainer: {
        backgroundColor: '#F3F4F6',
        borderRadius: 20,
        padding: 16,
        borderWidth: 2,
        borderColor: '#E5E7EB',
    },
    driverArea: {
        height: 50,
        backgroundColor: '#D1D5DB',
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    seatRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 10,
    },
    legendContainer: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 20 },
    legendItem: { flexDirection: 'row', alignItems: 'center' },
    legendBox: { width: 14, height: 14, borderRadius: 3, marginRight: 6 },
    available: { backgroundColor: '#A7C7E7' },
    occupied: { backgroundColor: '#D1D5DB' },
    selected: { backgroundColor: '#FBBF24' },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    totalPrice: { fontSize: 22, fontWeight: 'bold' },
    seatsSelected: { color: '#6B7280' },
    confirmButton: {
        backgroundColor: '#0033A0',
        paddingHorizontal: 32,
        paddingVertical: 12,
        borderRadius: 8,
    },
    disabledButton: { backgroundColor: '#9CA3AF' },
    confirmButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
    errorText: {
        textAlign: 'center',
        color: 'red',
        marginTop: 50,
    }
});