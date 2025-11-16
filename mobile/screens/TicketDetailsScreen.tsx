// New screen to display a single ticket's details and QR code.

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { toDataURL } from 'qrcode';

const RealQRCode: React.FC<{ value: any; size: number }> = ({ value, size }) => {
    const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

    useEffect(() => {
        const generateQR = async () => {
            try {
                const dataString = JSON.stringify(value);
                const url = await toDataURL(dataString, {
                    width: size,
                    margin: 1,
                    color: { dark: '#002B7F' }
                });
                setQrDataUrl(url);
            } catch (err) {
                console.error('Failed to generate QR code', err);
            }
        };
        generateQR();
    }, [value, size]);

    return (
        <View style={[styles.qrContainer, { width: size, height: size }]}>
            {qrDataUrl ? (
                <Image source={{ uri: qrDataUrl }} style={{ width: size, height: size }} />
            ) : (
                <Text style={styles.qrText}>Loading QR...</Text>
            )}
        </View>
    );
};

const InfoRow = ({ label, value }) => (
    <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
    </View>
);

export default function TicketDetailsScreen({ route, navigation }) {
    const { ticket } = route.params;

    return (
        <SafeAreaView style={styles.container}>
             <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.backButton}>{'<'}</Text></TouchableOpacity>
                <Text style={styles.headerTitle}>Boarding Pass</Text>
            </View>
            <View style={styles.ticket}>
                <View style={styles.ticketTop}>
                    <Text style={styles.company}>{ticket.company}</Text>
                    <View style={styles.routeContainer}>
                        <Text style={styles.location}>{ticket.from}</Text>
                        <Text style={styles.arrow}>→</Text>
                        <Text style={styles.location}>{ticket.to}</Text>
                    </View>
                </View>
                <View style={styles.ticketMiddle}>
                    <RealQRCode value={ticket} size={200} />
                    <Text style={styles.scanText}>Present this QR code for scanning</Text>
                </View>
                <View style={styles.ticketBottom}>
                    <InfoRow label="Passenger" value="Kalisa Jean" />
                    <InfoRow label="Date" value={ticket.date} />
                    <InfoRow label="Time" value={ticket.time} />
                    <InfoRow label="Seats" value={ticket.seats} />
                    <InfoRow label="Ticket ID" value={ticket.qrValue} />
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
    header: {
        position: 'absolute',
        top: 50,
        left: 0,
        right: 0,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
    },
    backButton: { fontSize: 24, fontWeight: 'bold', color: '#6B7280' },
    headerTitle: { flex: 1, textAlign: 'center', fontSize: 20, fontWeight: 'bold' },
    ticket: {
        backgroundColor: 'white',
        borderRadius: 24,
        width: '90%',
        maxWidth: 400,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.15,
        shadowRadius: 15,
        elevation: 10,
    },
    ticketTop: {
        backgroundColor: '#0033A0',
        padding: 24,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
    },
    company: { color: 'white', fontSize: 20, fontWeight: 'bold', textAlign: 'center' },
    routeContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
    location: { color: 'white', fontSize: 24, fontWeight: 'bold' },
    arrow: { color: '#A7C7E7', fontSize: 24 },
    ticketMiddle: {
        padding: 24,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: '#E5E7EB',
        borderStyle: 'dashed',
    },
    qrContainer: {
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    qrText: { color: '#9CA3AF', fontWeight: 'bold' },
    scanText: { marginTop: 16, color: '#6B7280', fontSize: 12 },
    ticketBottom: { padding: 24 },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    infoLabel: { color: '#6B7280', fontSize: 14 },
    infoValue: { color: '#111827', fontSize: 14, fontWeight: '600' },
});