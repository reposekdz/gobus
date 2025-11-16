import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BookingCard from '../components/BookingCard';
import { useLanguage } from '../contexts/LanguageContext';

const mockUpcoming = [
  { id: '1', from: 'Kigali', to: 'Rubavu', company: 'Volcano Express', date: 'Oct 28', time: '07:00', seats: 'A5', qrValue: 'TICKET-001', logoUrl: 'https://pbs.twimg.com/profile_images/1237839357116452865/p-28c8o-_400x400.jpg' },
];

const mockPast = [
  { id: '2', from: 'Kigali', to: 'Musanze', company: 'Horizon Express', date: 'Oct 15', time: '09:00', seats: 'D3', qrValue: 'TICKET-003' },
];

export default function MyTicketsScreen({ navigation }) {
    const [activeTab, setActiveTab] = useState('upcoming');
    const { t } = useLanguage();
    
    const ticketsToShow = activeTab === 'upcoming' ? mockUpcoming : mockPast;

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>{t('mobile_tickets_title')}</Text>
            </View>
            <View style={styles.tabContainer}>
                <TouchableOpacity style={[styles.tab, activeTab === 'upcoming' && styles.activeTab]} onPress={() => setActiveTab('upcoming')}>
                    <Text style={[styles.tabText, activeTab === 'upcoming' && styles.activeTabText]}>{t('mobile_tickets_upcoming')}</Text>
                </TouchableOpacity>
                 <TouchableOpacity style={[styles.tab, activeTab === 'past' && styles.activeTab]} onPress={() => setActiveTab('past')}>
                    <Text style={[styles.tabText, activeTab === 'past' && styles.activeTabText]}>{t('mobile_tickets_past')}</Text>
                </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {ticketsToShow.map(ticket => (
                    <BookingCard 
                        key={ticket.id} 
                        ticket={ticket} 
                        isPast={activeTab === 'past'} 
                        onPress={() => navigation.navigate('TicketDetails', { ticket })}
                    />
                ))}
                 {ticketsToShow.length === 0 && (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>{t('mobile_tickets_empty')} {activeTab}.</Text>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F3F4F6' },
    header: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#E5E7EB', backgroundColor: 'white' },
    headerTitle: { fontSize: 24, fontWeight: 'bold' },
    tabContainer: {
        flexDirection: 'row',
        padding: 4,
        margin: 16,
        backgroundColor: '#E5E7EB',
        borderRadius: 8,
    },
    tab: {
        flex: 1,
        padding: 8,
        borderRadius: 6,
        alignItems: 'center',
    },
    activeTab: {
        backgroundColor: 'white',
    },
    tabText: {
        fontWeight: '600',
        color: '#6B7280'
    },
    activeTabText: {
        color: '#0033A0'
    },
    scrollContent: {
        paddingHorizontal: 16,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 50,
    },
    emptyText: {
        color: '#6B7280',
    }
});