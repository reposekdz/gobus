

import { useState, useEffect, useRef } from 'react';
// These would be imported from expo in a real project
// import * as Device from 'expo-device';
// import * as Notifications from 'expo-notifications';
import { Platform, Alert } from 'react-native';
import * as api from '../../services/apiService';

// Mocking the Expo Notifications module for this environment
const Notifications = {
  requestPermissionsAsync: async () => ({ status: 'granted' }),
  getExpoPushTokenAsync: async () => ({ data: 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]' }),
  setNotificationHandler: (handler: any) => {},
  addNotificationReceivedListener: (listener: any) => {
    console.log('Mock: Notification received listener added');
    const subscription = { remove: () => console.log('Mock: Listener removed') };
    return subscription;
  },
  addNotificationResponseReceivedListener: (listener: any) => {
    console.log('Mock: Notification response listener added');
    const subscription = { remove: () => console.log('Mock: Listener removed') };
    return subscription;
  },
  // FIX: Added mock for removeNotificationSubscription to support the modern Expo API.
  removeNotificationSubscription: (subscription: any) => {
    console.log('Mock: removeNotificationSubscription called');
  }
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

async function registerForPushNotificationsAsync() {
  let token;
  // This would use Device.isDevice in a real app
  if (true) { 
    const { status: existingStatus } = await Notifications.requestPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      Alert.alert('Push Notifications', 'Failed to get push token for push notification!');
      return;
    }
    token = (await Notifications.getExpoPushTokenAsync()).data;
    console.log('Expo Push Token:', token);
  } else {
    Alert.alert('Push Notifications', 'Must use physical device for Push Notifications');
  }

  return token;
}

export default function usePushNotifications(user: any) {
  const [expoPushToken, setExpoPushToken] = useState('');
  const notificationListener = useRef<any>();
  const responseListener = useRef<any>();

  useEffect(() => {
    if (!user) return; // Only register if user is logged in

    registerForPushNotificationsAsync().then(token => {
      if (token) {
        setExpoPushToken(token);
        // Send the token to your backend server
        api.subscribePush({ token, platform: 'mobile' })
          .catch(err => console.error("Failed to send push token to server", err));
      }
    });

    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received while app is running:', notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('User tapped on notification:', response);
      // Here you can navigate to a specific screen based on notification data
    });

    return () => {
      // FIX: The .remove() method on subscriptions is deprecated and was causing a type error.
      // Replaced with the current Expo API: Notifications.removeNotificationSubscription().
      if (notificationListener.current) {
        // FIX: Pass the subscription object to removeNotificationSubscription. This call requires one argument.
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        // FIX: Pass the subscription object to removeNotificationSubscription. This call requires one argument.
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, [user]);

  return {
    expoPushToken,
  };
}