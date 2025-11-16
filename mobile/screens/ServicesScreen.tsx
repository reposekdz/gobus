import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '../contexts/LanguageContext';

const services = [
    { title: 'Send a Package', description: 'Reliable and fast parcel delivery.', icon: '📦', screen: 'PackageDelivery' },
    { title: 'Bus Charter', description: 'Rent a bus for your group event.', icon: '🚌', screen: 'BusCharter' },
    { title: 'Lost & Found', description: 'Report or find a lost item.', icon: '🔍', screen: 'LostAndFound' },
];

interface ServiceCardProps {
    service: typeof services[0];
    onPress: () => void;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ service, onPress }) => (
    <TouchableOpacity style={styles.card} onPress={onPress}>
        <Text style={styles.icon}>{service.icon}</Text>
        <View style={styles.textContainer}>
            <Text style={styles.cardTitle}>{service.title}</Text>
            <Text style={styles.cardDescription}>{service.description}</Text>
        </View>
        <Text style={styles.arrow}>{'>'}</Text>
    </TouchableOpacity>
);

export default function ServicesScreen({ navigation }) {
    const { t } = useLanguage();
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>{t('mobile_services_title')}</Text>
            </View>
            <ScrollView contentContainerStyle={styles.content}>
                {services.map(service => (
                    <ServiceCard 
                        key={service.title} 
                        service={service} 
                        onPress={() => service.screen ? navigation.navigate(service.screen) : alert('Coming soon!')}
                    />
                ))}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F3F4F6' },
    header: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#E5E7EB', backgroundColor: 'white' },
    headerTitle: { fontSize: 24, fontWeight: 'bold' },
    content: { padding: 16 },
    card: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    icon: {
        fontSize: 32,
        marginRight: 16,
    },
    textContainer: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    cardDescription: {
        color: '#6B7280',
        fontSize: 12,
        marginTop: 4,
    },
    arrow: {
        fontSize: 20,
        color: '#9CA3AF',
    },
});