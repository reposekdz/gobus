import React, { useState, useEffect } from 'react';
import { BusIcon } from './components/icons';
import { useSocket } from './contexts/SocketContext';
import { useAuth } from './contexts/AuthContext';
import apiService from './lib/api';

// Rough coordinates for Rwanda map percentage calculation
const RWANDA_BOUNDS = {
    minLat: -2.8, maxLat: -1.0,
    minLng: 28.8, maxLng: 30.9
};

const mapLatLngToPercentage = (lat: number, lng: number) => {
    const top = 100 - ((lat - RWANDA_BOUNDS.minLat) / (RWANDA_BOUNDS.maxLat - RWANDA_BOUNDS.minLat)) * 100;
    const left = ((lng - RWANDA_BOUNDS.minLng) / (RWANDA_BOUNDS.maxLng - RWANDA_BOUNDS.minLng)) * 100;
    return { top: `${top}%`, left: `${left}%` };
};

const FleetMonitoring: React.FC = () => {
    const { user } = useAuth();
    const socket = useSocket();
    const [onRouteBuses, setOnRouteBuses] = useState<any[]>([]);
    const [selectedBus, setSelectedBus] = useState<any>(null);
    const [busLocations, setBusLocations] = useState<{ [driverId: string]: { lat: number; lng: number } }>({});
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchFleetData = async () => {
            if (user?.role === 'company') {
                try {
                    setIsLoading(true);
                    const response = await apiService.get('/companies/fleet-monitoring');
                    if (response.success && response.data) {
                        const busesOnRoute = response.data.filter((bus: any) => bus.status === 'On Route' || bus.status === 'Active');
                        setOnRouteBuses(busesOnRoute);
                        if (busesOnRoute.length > 0 && !selectedBus) {
                            setSelectedBus(busesOnRoute[0]);
                        }
                    }
                } catch (error) {
                    console.error('Failed to fetch fleet data:', error);
                } finally {
                    setIsLoading(false);
                }
            }
        };

        fetchFleetData();
    }, [user]);

    useEffect(() => {
        if (socket && user?.role === 'company') {
            socket.on('fleetLocationUpdate', ({ driverId, location }) => {
                setBusLocations(prev => ({
                    ...prev,
                    [driverId]: location
                }));
            });

            return () => {
                socket.off('fleetLocationUpdate');
            };
        }
    }, [socket, user]);

    if (isLoading) {
        return (
            <div>
                <h1 className="text-3xl font-bold dark:text-gray-200 mb-6">Live Fleet Monitoring</h1>
                <p className="text-gray-500">Loading fleet data...</p>
            </div>
        );
    }

    return (
        <div>
            <h1 className="text-3xl font-bold dark:text-gray-200 mb-6">Live Fleet Monitoring</h1>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white dark:bg-gray-800/50 p-6 rounded-2xl shadow-lg h-[600px] flex flex-col">
                    <h2 className="text-xl font-bold dark:text-white mb-4">Bus Locations</h2>
                    <div className="flex-grow bg-gray-200 dark:bg-gray-700/50 rounded-lg flex items-center justify-center relative overflow-hidden">
                        <img src="https://www.researchgate.net/publication/322968537/figure/fig1/AS:631631525920800@1527604113101/Administrative-map-of-Rwanda-showing-the-four-provinces-and-the-capital-city-Kigali.png" alt="Map of Rwanda" className="w-full h-full object-contain opacity-20 dark:opacity-10"/>
                        
                        {onRouteBuses.map(bus => {
                             const location = busLocations[bus.driver_id];
                             if(!location) return null;
                             
                             const { top, left } = mapLatLngToPercentage(location.lat, location.lng);
                             const isSelected = selectedBus?.id === bus.id;

                             return (
                                 <button 
                                     key={bus.id}
                                     onClick={() => setSelectedBus(bus)}
                                     className={`absolute transition-all duration-1000 ease-linear ${isSelected ? 'z-10' : ''}`}
                                     style={{ top, left }}
                                     title={`${bus.plate} - ${bus.driver}`}
                                 >
                                     <BusIcon className={`w-7 h-7 text-blue-500 transform transition-transform ${isSelected ? 'scale-150' : 'scale-100'}`} />
                                     {isSelected && <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-gray-900 text-white text-xs rounded-md shadow-lg whitespace-nowrap">{bus.plate}</div>}
                                 </button>
                             );
                        })}
                    </div>
                </div>
                <div className="space-y-6">
                    <div className="bg-white dark:bg-gray-800/50 p-6 rounded-2xl shadow-lg">
                        <h2 className="text-xl font-bold dark:text-white mb-4">Selected Bus Details</h2>
                        {selectedBus ? (
                            <div className="space-y-3">
                                <p className="font-bold text-2xl text-blue-600 dark:text-blue-400">{selectedBus.plate}</p>
                                <p><span className="font-semibold">Route:</span> {selectedBus.route}</p>
                                <p><span className="font-semibold">Driver:</span> {selectedBus.driver}</p>
                                <p><span className="font-semibold">Status:</span> <span className="text-green-500">{selectedBus.status}</span></p>
                                <div className="pt-2">
                                     <p className="text-xs text-gray-500">Live Location:</p>
                                     {busLocations[selectedBus.driver_id] ? (
                                        <p className="font-mono text-sm">{busLocations[selectedBus.driver_id].lat.toFixed(4)}, {busLocations[selectedBus.driver_id].lng.toFixed(4)}</p>
                                     ) : (
                                        <p className="text-sm text-gray-400">Awaiting location data...</p>
                                     )}
                                </div>
                            </div>
                        ) : (
                            <p className="text-gray-500">Click a bus on the map to see details.</p>
                        )}
                    </div>
                    <div className="bg-white dark:bg-gray-800/50 p-6 rounded-2xl shadow-lg">
                        <h2 className="text-xl font-bold dark:text-white mb-4">All Buses On Route ({onRouteBuses.length})</h2>
                        <div className="space-y-3 h-[260px] overflow-y-auto custom-scrollbar">
                            {onRouteBuses.map(bus => (
                                <button key={bus.id} onClick={() => setSelectedBus(bus)} className={`w-full text-left bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg border-2 ${selectedBus?.id === bus.id ? 'border-blue-500' : 'border-transparent'}`}>
                                    <p className="font-bold dark:text-white">{bus.plate}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{bus.route}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FleetMonitoring;