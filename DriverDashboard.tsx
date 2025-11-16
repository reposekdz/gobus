import React, { useState, useEffect, useRef } from 'react';
import { SunIcon, MoonIcon, CogIcon, UsersIcon, ChartBarIcon, QrCodeIcon, ChartPieIcon, ClipboardDocumentListIcon, WrenchScrewdriverIcon, MegaphoneIcon, CalendarIcon, ChatBubbleLeftRightIcon, CheckCircleIcon, StarIcon, ShieldCheckIcon, MenuIcon, XIcon, ArrowRightIcon, BusIcon } from './components/icons';
import { Page } from './App';
import * as api from './services/apiService';
import LoadingSpinner from './components/LoadingSpinner';
import { useSocket } from './contexts/SocketContext';
import EnhancedDriverTripView from './components/EnhancedDriverTripView';
import { useAuth } from './contexts/AuthContext';

interface DriverDashboardProps {
    onLogout: () => void;
    theme: 'light' | 'dark';
    setTheme: (theme: 'light' | 'dark') => void;
    driverData: any;
    navigate: (page: Page, data?: any) => void;
}

const AvailabilityToggle: React.FC<{ isAvailable: boolean; onToggle: () => void; isLoading: boolean }> = ({ isAvailable, onToggle, isLoading }) => {
    return (
        <div className="flex items-center space-x-2">
            <span className={`text-sm font-semibold ${isAvailable ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}`}>
                {isAvailable ? 'Available' : 'Unavailable'}
            </span>
            <button
                onClick={onToggle}
                disabled={isLoading}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 ${isAvailable ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}
            >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isAvailable ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
        </div>
    );
};


const TripCard: React.FC<{ trip: any, onSelect: (trip: any) => void }> = ({ trip, onSelect }) => (
    <button onClick={() => onSelect(trip)} className="w-full text-left bg-white dark:bg-gray-800/50 p-4 rounded-xl shadow-md hover:shadow-lg hover:border-blue-500 border-2 border-transparent transition-all">
        <div className="flex justify-between items-center">
            <p className="font-bold text-lg dark:text-white">{trip.route}</p>
            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${trip.status === 'Scheduled' ? 'bg-yellow-200 text-yellow-800' : 'bg-blue-200 text-blue-800'}`}>
                {trip.status}
            </span>
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            <p>Departure: {new Date(trip.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
            <p>Bus: {trip.bus_plate}</p>
        </div>
    </button>
);


// TripManagementView is now replaced by EnhancedDriverTripView


const DriverDashboard: React.FC<DriverDashboardProps> = ({ onLogout, theme, setTheme, driverData, navigate }) => {
    const { user } = useAuth();
    const [trips, setTrips] = useState<any[]>([]);
    const [selectedTrip, setSelectedTrip] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [isAvailable, setIsAvailable] = useState(driverData.status === 'Active');
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
    const [driverStats, setDriverStats] = useState<any>(null);
    const socket = useSocket();
    const watchIdRef = useRef<number | null>(null);

    const handleToggleAvailability = async () => {
        setIsUpdatingStatus(true);
        const newStatus = !isAvailable ? 'Active' : 'Unavailable';
        try {
            await api.driverUpdateMyStatus(newStatus as 'Active' | 'Unavailable');
            setIsAvailable(!isAvailable);
        } catch (error) {
            console.error("Failed to update status", error);
            alert("Could not update availability status. Please try again.");
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [tripsData, statsData] = await Promise.all([
                    api.driverGetMyTrips(),
                    api.driverGetStats().catch(() => null)
                ]);
                setTrips(tripsData);
                setDriverStats(statsData);
            } catch (err) {
                setError((err as Error).message || "Failed to fetch trips.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);
    
    // Real-time location tracking effect
    useEffect(() => {
        if (socket && selectedTrip?.status === 'Departed') {
            watchIdRef.current = navigator.geolocation.watchPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    socket.emit('updateDriverLocation', { lat: latitude, lng: longitude });
                },
                (error) => {
                    console.error("Geolocation error:", error);
                },
                { enableHighAccuracy: true }
            );

            return () => {
                if (watchIdRef.current !== null) {
                    navigator.geolocation.clearWatch(watchIdRef.current);
                }
            };
        } else {
             if (watchIdRef.current !== null) {
                navigator.geolocation.clearWatch(watchIdRef.current);
             }
        }
    }, [socket, selectedTrip]);


    const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');

    const renderContent = () => {
        if (isLoading) return <LoadingSpinner />;
        if (error) return <p className="text-red-500">{error}</p>;

        if (selectedTrip) {
            return (
                <EnhancedDriverTripView
                    trip={selectedTrip}
                    onBack={() => setSelectedTrip(null)}
                    driverId={user?.id || driverData.id}
                />
            );
        }

        return (
            <div className="space-y-6">
                {/* Driver Stats */}
                {driverStats && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md">
                            <p className="text-sm text-gray-600 dark:text-gray-400">Total Trips</p>
                            <p className="text-2xl font-bold dark:text-white">{driverStats.totalTrips || 0}</p>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md">
                            <p className="text-sm text-gray-600 dark:text-gray-400">Total Passengers</p>
                            <p className="text-2xl font-bold dark:text-white">{driverStats.totalPassengers || 0}</p>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md">
                            <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
                            <p className="text-2xl font-bold dark:text-white">{driverStats.completedTrips || 0}</p>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md">
                            <p className="text-sm text-gray-600 dark:text-gray-400">Upcoming</p>
                            <p className="text-2xl font-bold dark:text-white">{driverStats.upcomingTrips || 0}</p>
                        </div>
                    </div>
                )}

                <div>
                    <h1 className="text-3xl font-bold dark:text-white mb-6">Today's Assigned Trips</h1>
                    {trips.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {trips.map(trip => <TripCard key={trip.id} trip={trip} onSelect={setSelectedTrip} />)}
                        </div>
                    ) : (
                        <p className="text-center text-gray-500 dark:text-gray-400 py-10">No trips assigned for today.</p>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className={`min-h-screen flex ${theme}`}>
            {/* Sidebar can be added back if needed */}
            <div className="flex-1 flex flex-col bg-gray-100 dark:bg-gray-900">
                <header className="h-16 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-sm flex items-center justify-between px-6 border-b dark:border-gray-700/50">
                    <div className="font-bold text-gray-800 dark:text-white">Welcome, {driverData.name.split(' ')[0]}</div>
                    <div className="flex items-center space-x-4">
                        <AvailabilityToggle isAvailable={isAvailable} onToggle={handleToggleAvailability} isLoading={isUpdatingStatus} />
                        <button onClick={() => navigate('driverSettings')} className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                            <CogIcon className="w-6 h-6"/>
                        </button>
                        <button onClick={toggleTheme} className="text-gray-500 dark:text-gray-400">{theme === 'light' ? <MoonIcon className="w-6 h-6"/> : <SunIcon className="w-6 h-6"/>}</button>
                        <button onClick={onLogout} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700">Logout</button>
                    </div>
                </header>
                <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
                   {renderContent()}
                </main>
            </div>
        </div>
    );
};

export default DriverDashboard;