// Reusable component for a single seat in the bus layout.

import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

export type SeatStatus = 'available' | 'occupied' | 'selected' | 'aisle';

interface BusSeatProps {
    seatId: string;
    status: SeatStatus;
    onPress: (seatId: string) => void;
}

const BusSeat: React.FC<BusSeatProps> = ({ seatId, status, onPress }) => {
    if (status === 'aisle') {
        return <TouchableOpacity style={styles.aisle} disabled />;
    }

    const handlePress = () => {
        if (status === 'available' || status === 'selected') {
            onPress(seatId);
        }
    };
    
    return (
        <TouchableOpacity 
            style={[styles.seat, styles[status]]} 
            onPress={handlePress}
            disabled={status === 'occupied'}
        >
            <Text style={styles.seatText}>{seatId}</Text>
        </TouchableOpacity>
    );
};

export default BusSeat;

const styles = StyleSheet.create({
    seat: {
        width: 40,
        height: 45,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 6,
        borderBottomWidth: 4,
    },
    aisle: {
        width: 40,
        height: 45,
    },
    available: {
        backgroundColor: '#A7C7E7',
        borderColor: '#60A5FA',
    },
    occupied: {
        backgroundColor: '#D1D5DB',
        borderColor: '#9CA3AF',
    },
    selected: {
        backgroundColor: '#FBBF24',
        borderColor: '#F59E0B',
    },
    seatText: {
        fontSize: 10,
        fontWeight: 'bold',
    }
});