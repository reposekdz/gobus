

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../../contexts/LanguageContext';

// Import Screens
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import MyTicketsScreen from '../screens/MyTicketsScreen';
import ServicesScreen from '../screens/ServicesScreen';
import ProfileScreen from '../screens/ProfileScreen';
import TicketDetailsScreen from '../screens/TicketDetailsScreen';
import SearchResultsScreen from '../screens/SearchResultsScreen';
import SeatSelectionScreen from '../screens/SeatSelectionScreen';
import BookingConfirmationScreen from '../screens/BookingConfirmationScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import WalletScreen from '../screens/WalletScreen';
import BusCharterScreen from '../screens/BusCharterScreen';
import LostAndFoundScreen from '../screens/LostAndFoundScreen';
import PackageDeliveryScreen from '../screens/PackageDeliveryScreen';
import ReportLostItemScreen from '../screens/ReportLostItemScreen';
import LoyaltyScreen from '../screens/LoyaltyScreen';
import PaymentScreen from '../screens/PaymentScreen';


// Agent Screens
import AgentDashboardScreen from '../screens/agent/AgentDashboardScreen';
import AgentDepositScreen from '../screens/agent/AgentDepositScreen';
import AgentTransactionsScreen from '../screens/agent/AgentTransactionsScreen';
import AgentProfileScreen from '../screens/agent/AgentProfileScreen';

// Driver Screens
import DriverDashboardScreen from '../screens/driver/DriverDashboardScreen';
import BoardingScreen from '../screens/driver/BoardingScreen';
import DriverSettingsScreen from '../screens/driver/DriverSettingsScreen';
import DriverTripHistoryScreen from '../screens/driver/DriverTripHistoryScreen';


// Company Screens
import CompanyDashboardScreen from '../screens/company/CompanyDashboardScreen';
import ManageFleetScreen from '../screens/company/ManageFleetScreen';
import ManageDriversScreen from '../screens/company/ManageDriversScreen';
import AddEditBusScreen from '../screens/company/AddEditBusScreen';
import AddEditDriverScreen from '../screens/company/AddEditDriverScreen';
import CompanyPassengersScreen from '../screens/company/CompanyPassengersScreen';


// Admin Screens
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';

import Icon from '../components/Icon';
import { RootStackParamList } from './types';


const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();
const ProfileStack = createStackNavigator();

function ProfileNavigator() {
    return (
        <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
            <ProfileStack.Screen name="ProfileMain" component={ProfileScreen} />
            <ProfileStack.Screen name="EditProfile" component={EditProfileScreen} />
            <ProfileStack.Screen name="Wallet" component={WalletScreen} />
            <ProfileStack.Screen name="Loyalty" component={LoyaltyScreen} />
        </ProfileStack.Navigator>
    );
}


function PassengerTabs() {
    const { t } = useLanguage();
    return (
        <Tab.Navigator screenOptions={({ route }) => ({
            headerShown: false,
            tabBarIcon: ({ color, size }) => {
                let iconName;
                if (route.name === t('mobile_tab_home')) iconName = 'home';
                else if (route.name === t('mobile_tab_tickets')) iconName = 'ticket';
                else if (route.name === t('mobile_tab_services')) iconName = 'briefcase';
                else if (route.name === t('mobile_tab_profile')) iconName = 'user-circle';
                return <Icon name={iconName} size={size} color={color} />;
            },
        })}>
            <Tab.Screen name={t('mobile_tab_home')} component={HomeScreen} />
            <Tab.Screen name={t('mobile_tab_tickets')} component={MyTicketsScreen} />
            <Tab.Screen name={t('mobile_tab_services')} component={ServicesScreen} />
            <Tab.Screen name={t('mobile_tab_profile')} component={ProfileNavigator} />
        </Tab.Navigator>
    );
}

function DriverTabs() {
    const { t } = useLanguage();
     return (
        <Tab.Navigator screenOptions={({ route }) => ({
            headerShown: false,
            tabBarIcon: ({ color, size }) => {
                let iconName;
                if (route.name === 'Dashboard') iconName = 'chart-bar';
                else if (route.name === 'Boarding') iconName = 'qr-code';
                else if (route.name === t('mobile_tab_history')) iconName = 'clipboard-document-list';
                else if (route.name === 'Settings') iconName = 'user-circle';
                return <Icon name={iconName} size={size} color={color} />;
            },
        })}>
            <Tab.Screen name="Dashboard" component={DriverDashboardScreen} />
            <Tab.Screen name="Boarding" component={BoardingScreen} />
            <Tab.Screen name={t('mobile_tab_history')} component={DriverTripHistoryScreen} />
            <Tab.Screen name="Settings" component={DriverSettingsScreen} />
        </Tab.Navigator>
    );
}

function AgentTabs() {
    return (
        <Tab.Navigator screenOptions={({ route }) => ({
            headerShown: false,
            tabBarIcon: ({ color, size }) => {
                let iconName;
                if (route.name === 'Dashboard') iconName = 'chart-bar';
                else if (route.name === 'Deposit') iconName = 'qr-code';
                else if (route.name === 'Transactions') iconName = 'briefcase';
                 else if (route.name === 'Profile') iconName = 'user-circle';
                return <Icon name={iconName} size={size} color={color} />;
            },
        })}>
            <Tab.Screen name="Dashboard" component={AgentDashboardScreen} />
            <Tab.Screen name="Deposit" component={AgentDepositScreen} />
            <Tab.Screen name="Transactions" component={AgentTransactionsScreen} />
            <Tab.Screen name="Profile" component={AgentProfileScreen} />
        </Tab.Navigator>
    );
}


function CompanyTabs() {
     return (
        <Tab.Navigator screenOptions={({ route }) => ({
            headerShown: false,
            tabBarIcon: ({ color, size }) => {
                let iconName;
                if (route.name === 'Dashboard') iconName = 'chart-bar';
                else if (route.name === 'Fleet') iconName = 'bus';
                else if (route.name === 'Drivers') iconName = 'users';
                 else if (route.name === 'Passengers') iconName = 'users';
                return <Icon name={iconName} size={size} color={color} />;
            },
        })}>
            <Tab.Screen name="Dashboard" component={CompanyDashboardScreen} />
            <Tab.Screen name="Fleet" component={ManageFleetScreen} />
            <Tab.Screen name="Drivers" component={ManageDriversScreen} />
            <Tab.Screen name="Passengers" component={CompanyPassengersScreen} />
        </Tab.Navigator>
    );
}

function AdminTabs() {
    return (
        <Tab.Navigator>
             <Tab.Screen name="Dashboard" component={AdminDashboardScreen} options={{ headerShown: false }} />
             {/* Add other admin tabs here */}
        </Tab.Navigator>
    );
}

function AppStack() {
    const { user, isLoading } = useAuth();
    
    if (isLoading) {
        // You can return a loading splash screen here
        return null;
    }

    switch(user?.role) {
        case 'passenger': return <PassengerTabs />;
        case 'driver': return <DriverTabs />;
        case 'agent': return <AgentTabs />;
        case 'company': return <CompanyTabs />;
        case 'admin': return <AdminTabs />;
        default: return <PassengerTabs />;
    }
}


export default function AppNavigator() {
    const { user, isLoading } = useAuth();

    if (isLoading) {
        return null; // Or a splash screen
    }

    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            {user ? (
                <>
                    <Stack.Screen name="MainApp" component={AppStack} />
                    {/* Screens accessible after login */}
                    <Stack.Screen name="SearchResults" component={SearchResultsScreen} />
                    <Stack.Screen name="SeatSelection" component={SeatSelectionScreen} />
                    <Stack.Screen name="Payment" component={PaymentScreen} />
                    <Stack.Screen name="BookingConfirmation" component={BookingConfirmationScreen} />
                    <Stack.Screen name="TicketDetails" component={TicketDetailsScreen} />
                    <Stack.Screen name="DriverBoarding" component={BoardingScreen} />
                    <Stack.Screen name="DriverTripHistory" component={DriverTripHistoryScreen} />
                    <Stack.Screen name="BusCharter" component={BusCharterScreen} />
                    <Stack.Screen name="LostAndFound" component={LostAndFoundScreen} />
                    <Stack.Screen name="PackageDelivery" component={PackageDeliveryScreen} />
                    <Stack.Screen name="ReportLostItem" component={ReportLostItemScreen} />
                    <Stack.Screen name="AddEditBus" component={AddEditBusScreen} />
                    <Stack.Screen name="AddEditDriver" component={AddEditDriverScreen} />
                </>
            ) : (
                <>
                    <Stack.Screen name="Login" component={LoginScreen} />
                    <Stack.Screen name="Register" component={RegisterScreen} />
                </>
            )}
        </Stack.Navigator>
    );
}