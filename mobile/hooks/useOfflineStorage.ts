import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { useState, useEffect } from 'react';

interface OfflineData {
  bookings: any[];
  routes: any[];
  cities: any[];
  userProfile: any;
  lastSync: string;
}

export const useOfflineStorage = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [offlineData, setOfflineData] = useState<OfflineData>({
    bookings: [],
    routes: [],
    cities: [],
    userProfile: null,
    lastSync: ''
  });

  useEffect(() => {
    // Monitor network status
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected ?? false);
    });

    // Load offline data on app start
    loadOfflineData();

    return () => unsubscribe();
  }, []);

  const loadOfflineData = async () => {
    try {
      const data = await AsyncStorage.getItem('offlineData');
      if (data) {
        setOfflineData(JSON.parse(data));
      }
    } catch (error) {
      console.error('Failed to load offline data:', error);
    }
  };

  const saveOfflineData = async (data: Partial<OfflineData>) => {
    try {
      const currentData = { ...offlineData, ...data, lastSync: new Date().toISOString() };
      await AsyncStorage.setItem('offlineData', JSON.stringify(currentData));
      setOfflineData(currentData);
    } catch (error) {
      console.error('Failed to save offline data:', error);
    }
  };

  const cacheBookings = async (bookings: any[]) => {
    await saveOfflineData({ bookings });
  };

  const cacheRoutes = async (routes: any[]) => {
    await saveOfflineData({ routes });
  };

  const cacheCities = async (cities: any[]) => {
    await saveOfflineData({ cities });
  };

  const cacheUserProfile = async (userProfile: any) => {
    await saveOfflineData({ userProfile });
  };

  const getOfflineBookings = () => offlineData.bookings;
  const getOfflineRoutes = () => offlineData.routes;
  const getOfflineCities = () => offlineData.cities;
  const getOfflineUserProfile = () => offlineData.userProfile;

  const clearOfflineData = async () => {
    try {
      await AsyncStorage.removeItem('offlineData');
      setOfflineData({
        bookings: [],
        routes: [],
        cities: [],
        userProfile: null,
        lastSync: ''
      });
    } catch (error) {
      console.error('Failed to clear offline data:', error);
    }
  };

  const syncPendingActions = async () => {
    try {
      const pendingActions = await AsyncStorage.getItem('pendingActions');
      if (pendingActions && isOnline) {
        const actions = JSON.parse(pendingActions);
        // Process pending actions when back online
        for (const action of actions) {
          // Handle different action types (bookings, updates, etc.)
          console.log('Processing pending action:', action);
        }
        await AsyncStorage.removeItem('pendingActions');
      }
    } catch (error) {
      console.error('Failed to sync pending actions:', error);
    }
  };

  const addPendingAction = async (action: any) => {
    try {
      const pendingActions = await AsyncStorage.getItem('pendingActions');
      const actions = pendingActions ? JSON.parse(pendingActions) : [];
      actions.push({ ...action, timestamp: new Date().toISOString() });
      await AsyncStorage.setItem('pendingActions', JSON.stringify(actions));
    } catch (error) {
      console.error('Failed to add pending action:', error);
    }
  };

  return {
    isOnline,
    offlineData,
    cacheBookings,
    cacheRoutes,
    cacheCities,
    cacheUserProfile,
    getOfflineBookings,
    getOfflineRoutes,
    getOfflineCities,
    getOfflineUserProfile,
    clearOfflineData,
    syncPendingActions,
    addPendingAction,
    saveOfflineData
  };
};