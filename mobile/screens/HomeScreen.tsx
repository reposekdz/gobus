import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../contexts/LanguageContext';
import { useOfflineStorage } from '../hooks/useOfflineStorage';
import { useAuth } from '../hooks/useAuth';
import Card from '../components/Card';
import Header from '../components/Header';



const HomeScreen = ({ navigation }) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { isOnline, getOfflineRoutes, cacheRoutes } = useOfflineStorage();
  const [refreshing, setRefreshing] = useState(false);
  const [featuredRoutes, setFeaturedRoutes] = useState([
    { id: 1, from: 'Kigali', to: 'Musanze', price: '2,500 RWF', duration: '2h 30m', available: true },
    { id: 2, from: 'Kigali', to: 'Huye', price: '2,800 RWF', duration: '2h 45m', available: true },
    { id: 3, from: 'Kigali', to: 'Rubavu', price: '3,200 RWF', duration: '3h 15m', available: true },
    { id: 4, from: 'Kigali', to: 'Rusizi', price: '4,500 RWF', duration: '4h 30m', available: true },
  ]);

  const quickActions = [
    { id: 1, title: t('nav_booking'), icon: 'bus-outline', screen: 'SearchResults', color: '#3B82F6' },
    { id: 2, title: t('nav_services'), icon: 'grid-outline', screen: 'Services', color: '#059669' },
    { id: 3, title: t('usermenu_bookings'), icon: 'ticket-outline', screen: 'MyTickets', color: '#DC2626' },
    { id: 4, title: t('usermenu_wallet'), icon: 'wallet-outline', screen: 'Wallet', color: '#7C3AED' },
    { id: 5, title: t('service_lost_title'), icon: 'help-circle-outline', screen: 'LostAndFound', color: '#EA580C' },
    { id: 6, title: t('service_package_title'), icon: 'cube-outline', screen: 'PackageDelivery', color: '#0891B2' },
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      if (isOnline) {
        // Fetch fresh data from API when online
      } else {
        const offlineRoutes = getOfflineRoutes();
        if (offlineRoutes.length > 0) {
          setFeaturedRoutes(offlineRoutes);
        }
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleQuickAction = (action) => {
    if (!isOnline && ['Wallet', 'MyTickets'].includes(action.screen)) {
      Alert.alert(
        t('offline_mode_title'),
        t('offline_mode_message'),
        [{ text: t('ok'), style: 'default' }]
      );
      return;
    }
    navigation.navigate(action.screen);
  };

  const handleBookRoute = (route) => {
    if (!isOnline) {
      Alert.alert(
        t('offline_mode_title'),
        t('booking_requires_internet'),
        [{ text: t('ok'), style: 'default' }]
      );
      return;
    }
    navigation.navigate('SearchResults', { from: route.from, to: route.to });
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header 
        title={t('nav_home')} 
        showNotifications={true}
        showProfile={true}
      />
      
      {!isOnline && (
        <View style={styles.offlineIndicator}>
          <Ionicons name="cloud-offline-outline" size={16} color="white" />
          <Text style={styles.offlineText}>{t('offline_mode')}</Text>
        </View>
      )}
      
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>
            {user ? t('welcome_back_user', { name: user.name?.split(' ')[0] }) : t('hero_title')}
          </Text>
          <Text style={styles.welcomeSubtitle}>{t('hero_subtitle')}</Text>
          {user?.wallet_balance !== undefined && (
            <View style={styles.walletInfo}>
              <Ionicons name="wallet-outline" size={16} color="white" />
              <Text style={styles.walletBalance}>
                {t('usermenu_wallet_balance')}: {user.wallet_balance.toLocaleString()} RWF
              </Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('home_quick_actions')}</Text>
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={styles.quickActionItem}
                onPress={() => handleQuickAction(action)}
                activeOpacity={0.7}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: `${action.color}15` }]}>
                  <Ionicons name={action.icon} size={24} color={action.color} />
                </View>
                <Text style={styles.quickActionText}>{action.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('destinations_title')}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('SearchResults')}>
              <Text style={styles.seeAllText}>{t('see_all')}</Text>
            </TouchableOpacity>
          </View>
          {featuredRoutes.map((route) => (
            <Card key={route.id} style={styles.routeCard}>
              <View style={styles.routeInfo}>
                <View style={styles.routeHeader}>
                  <View style={styles.routeDestination}>
                    <Text style={styles.routeTitle}>{route.from}</Text>
                    <Ionicons name="arrow-forward" size={16} color="#6B7280" style={styles.routeArrow} />
                    <Text style={styles.routeTitle}>{route.to}</Text>
                  </View>
                  <View style={styles.routePriceContainer}>
                    <Text style={styles.routePrice}>{route.price}</Text>
                    {route.available && (
                      <View style={styles.availableBadge}>
                        <Text style={styles.availableText}>{t('available')}</Text>
                      </View>
                    )}
                  </View>
                </View>
                <View style={styles.routeDetails}>
                  <View style={styles.routeDetailItem}>
                    <Ionicons name="time-outline" size={14} color="#6B7280" />
                    <Text style={styles.routeDuration}>{route.duration}</Text>
                  </View>
                </View>
                <TouchableOpacity 
                  style={[styles.bookButton, !isOnline && styles.bookButtonDisabled]}
                  onPress={() => handleBookRoute(route)}
                  disabled={!isOnline}
                >
                  <Text style={styles.bookButtonText}>{t('destinations_book_now')}</Text>
                  <Ionicons name="arrow-forward" size={14} color="white" style={styles.bookButtonIcon} />
                </TouchableOpacity>
              </View>
            </Card>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  offlineIndicator: {
    backgroundColor: '#EF4444',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  offlineText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  welcomeSection: {
    backgroundColor: '#3B82F6',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#DBEAFE',
    marginBottom: 12,
  },
  walletInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
  },
  walletBalance: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  seeAllText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '600',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionItem: {
    width: '31%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  routeCard: {
    marginBottom: 12,
  },
  routeInfo: {
    padding: 16,
  },
  routeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  routeDestination: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  routeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  routeArrow: {
    marginHorizontal: 8,
  },
  routePriceContainer: {
    alignItems: 'flex-end',
  },
  routePrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#059669',
    marginBottom: 4,
  },
  availableBadge: {
    backgroundColor: '#D1FAE5',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  availableText: {
    fontSize: 10,
    color: '#059669',
    fontWeight: '600',
  },
  routeDetails: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  routeDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  routeDuration: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
  },
  bookButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  bookButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  bookButtonIcon: {
    marginLeft: 8,
  },
});