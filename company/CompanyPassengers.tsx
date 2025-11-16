import React, { useState, useMemo, useEffect } from 'react';
import { UsersIcon, SearchIcon, EyeIcon } from '../components/icons';
import PassengerDetailModal from '../components/PassengerDetailModal';
import * as api from '../services/apiService';
import LoadingSpinner from '../components/LoadingSpinner';


const CompanyPassengers: React.FC = () => {
    const [passengers, setPassengers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string|null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [routeFilter, setRouteFilter] = useState('All');
    const [selectedPassenger, setSelectedPassenger] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    useEffect(() => {
        const fetchPassengers = async () => {
            setIsLoading(true);
            try {
                const data = await api.companyGetMyPassengers();
                setPassengers(data);
            } catch (e: any) {
                setError(e.message || 'Failed to load passengers.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchPassengers();
    }, []);

    const uniqueRoutes = useMemo(() => ['All', ...new Set(passengers.map(p => p.route))], [passengers]);

    const filteredPassengers = useMemo(() => {
        return passengers.filter(p => 
            (p.name.toLowerCase().includes(searchTerm.toLowerCase()) || (p.email && p.email.toLowerCase().includes(searchTerm.toLowerCase()))) &&
            (routeFilter === 'All' || p.route === routeFilter)
        );
    }, [searchTerm, routeFilter, passengers]);

    const viewPassengerDetails = (passenger: any) => {
        // In a real app, you might fetch more detailed history here
        const history = passengers.filter(p => p.email === passenger.email);
        setSelectedPassenger({ ...passenger, history });
        setIsModalOpen(true);
    };

    if (isLoading) {
        return <LoadingSpinner />;
    }

    return (
        <div>
            <h1 className="text-3xl font-bold dark:text-gray-200 mb-6">Passenger History</h1>
            <div className="bg-white dark:bg-gray-800/50 p-6 rounded-2xl shadow-lg">
                 <div className="flex items-center space-x-4 mb-4">
                    <div className="relative w-full max-w-xs">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by passenger name..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                        />
                    </div>
                     <select 
                        value={routeFilter} 
                        onChange={e => setRouteFilter(e.target.value)}
                        className="p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    >
                        {uniqueRoutes.map(route => <option key={route} value={route}>{route}</option>)}
                    </select>
                </div>

                {error && <p className="text-red-500">{error}</p>}

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                            <tr>
                                <th className="p-3">Passenger Name</th>
                                <th className="p-3">Route</th>
                                <th className="p-3">Date</th>
                                <th className="p-3">Ticket ID</th>
                                <th className="p-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredPassengers.map(passenger => (
                                <tr key={passenger.id} className="border-t dark:border-gray-700">
                                    <td className="p-3 font-semibold dark:text-white">{passenger.name}</td>
                                    <td>{passenger.route}</td>
                                    <td>{new Date(passenger.date).toLocaleDateString()}</td>
                                    <td className="font-mono">{passenger.ticketId}</td>
                                    <td>
                                        <button onClick={() => viewPassengerDetails(passenger)} className="p-1 text-gray-500 hover:text-blue-600" title="View Details">
                                            <EyeIcon className="w-5 h-5"/>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
             {isModalOpen && selectedPassenger && (
                <PassengerDetailModal 
                    passenger={selectedPassenger} 
                    onClose={() => setIsModalOpen(false)} 
                />
            )}
        </div>
    );
};

export default CompanyPassengers;