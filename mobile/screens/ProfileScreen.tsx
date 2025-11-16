import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../../contexts/LanguageContext';

const ProfileOption = ({ label, icon, onPress }) => (
    <TouchableOpacity style={styles.option} onPress={onPress}>
        <Text style={styles.optionIcon}>{icon}</Text>
        <Text style={styles.optionLabel}>{label}</Text>
        <Text style={styles.optionArrow}>{'>'}</Text>
    </TouchableOpacity>
);

export default function ProfileScreen({ navigation }) {
    const { user, logout } = useAuth();
    const { t } = useLanguage();

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView>
                <View style={styles.header}>
                    <Image source={{ uri: user?.avatar_url }} style={styles.avatar} />
                    <Text style={styles.name}>{user?.name}</Text>
                    <Text style={styles.email}>{user?.email}</Text>
                     <View style={styles.pointsContainer}>
                        <Text style={styles.pointsIcon}>✨</Text>
                        <Text style={styles.points}>{new Intl.NumberFormat().format(user?.loyalty_points || 0)} GoPoints</Text>
                    </View>
                </View>
                
                <View style={styles.menu}>
                    <ProfileOption label={t('mobile_profile_edit')} icon="👤" onPress={() => navigation.navigate('EditProfile')} />
                    <ProfileOption label={t('mobile_profile_bookings')} icon="🎟️" onPress={() => navigation.navigate(t('mobile_tab_tickets'))} />
                    <ProfileOption label="GoPoints" icon="✨" onPress={() => navigation.navigate('Loyalty')} />
                    <ProfileOption label={t('mobile_profile_wallet')} icon="💳" onPress={() => navigation.navigate('Wallet')} />
                    <ProfileOption label={t('mobile_profile_settings')} icon="⚙️" onPress={() => alert('Navigate to Settings')} />
                    <ProfileOption label={t('mobile_profile_help')} icon="❓" onPress={() => alert('Navigate to Help Center')} />
                </View>

                <TouchableOpacity style={styles.logoutButton} onPress={logout}>
                    <Text style={styles.logoutButtonText}>{t('mobile_profile_logout')}</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F3F4F6' },
    header: {
        backgroundColor: 'white',
        padding: 24,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        marginBottom: 12,
    },
    name: {
        fontSize: 22,
        fontWeight: 'bold',
    },
    email: {
        color: '#6B7280',
    },
    pointsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 12,
        backgroundColor: '#FEF3C7',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16
    },
    pointsIcon: {
        fontSize: 16,
        marginRight: 6
    },
    points: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#92400E'
    },
    menu: {
        marginTop: 24,
        backgroundColor: 'white',
    },
    option: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    optionIcon: {
        fontSize: 20,
        marginRight: 16,
    },
    optionLabel: {
        flex: 1,
        fontSize: 16,
    },
    optionArrow: {
        color: '#9CA3AF',
        fontSize: 16,
    },
    logoutButton: {
        margin: 16,
        backgroundColor: '#FEE2E2',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    logoutButtonText: {
        color: '#DC2626',
        fontWeight: 'bold',
        fontSize: 16,
    },
});
