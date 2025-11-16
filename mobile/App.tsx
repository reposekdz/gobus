

import 'react-native-gesture-handler';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './navigation/AppNavigator';
import { AuthProvider, useAuth } from './hooks/useAuth';
import useCachedResources from './hooks/useCachedResources';
import { LanguageProvider } from '../contexts/LanguageContext';
import { SocketProvider } from '../contexts/SocketContext';
import usePushNotifications from './hooks/usePushNotifications';

const AppContent = () => {
  const { user } = useAuth();
  usePushNotifications(user); // Register for push notifications when a user is logged in.

  return (
    <NavigationContainer>
      <AppNavigator />
      <StatusBar style="auto" />
    </NavigationContainer>
  );
};


export default function App() {
  const isLoadingComplete = useCachedResources();

  if (!isLoadingComplete) {
    return null; // Or a splash screen
  }

  return (
    <AuthProvider>
      <SocketProvider>
        <LanguageProvider>
          <AppContent />
        </LanguageProvider>
      </SocketProvider>
    </AuthProvider>
  );
}