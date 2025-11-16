import React, { useState } from 'react';
import { Page } from './App';
import { KeyIcon } from './components/icons';
import apiService from './lib/api';

const VehicleRentalsPage: React.FC<{ onNavigate: (page: Page) => void }> = ({ onNavigate }) => {
    const [location, setLocation] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!location.trim()) {
            setError('Please enter a location');
            return;
        }
        
        setIsLoading(true);
        setError(null);
        
        try {
            const response = await apiService.get(`/vehicle-rentals?location=${encodeURIComponent(location)}`);
            if (response.success && response.data) {
                setResults(response.data);
            } else {
                setError('No vehicles found in this location');
                setResults([]);
            }
        } catch (err: any) {
            setError(err.message || 'Failed to search vehicles. Please try again.');
            setResults([]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            <form onSubmit={handleSearch} className="flex space-x-2">
                <input type="text" value={location} onChange={e => setLocation(e.target.value)} placeholder="Enter pickup city..." className="flex-grow p-2 border rounded-md dark:bg-gray-700" required />
                <button type="submit" className="px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg">Find Vehicles</button>
            </form>
            <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar pr-2">
                {isLoading && <p className="text-gray-500">Searching vehicles...</p>}
                {error && <p className="text-red-500 text-sm">{error}</p>}
                {!isLoading && !error && results.length === 0 && <p className="text-gray-500">No vehicles available. Please try a different location.</p>}
                {results.map((vehicle, index) => (
                    <div key={vehicle.id || index} className="flex items-center space-x-3 bg-gray-100 dark:bg-gray-700/50 p-2 rounded-lg">
                        <img src={vehicle.image} alt={vehicle.name} className="w-24 h-16 object-contain rounded-md"/>
                        <div className="flex-grow">
                            <p className="font-bold">{vehicle.name}</p>
                            <p className="text-xs text-gray-500">{vehicle.type}</p>
                            <p className="font-semibold text-green-600">{new Intl.NumberFormat('fr-RW').format(vehicle.price)} RWF / day</p>
                        </div>
                        <button className="px-3 py-1 bg-green-500 text-white text-xs rounded-md">Rent Now</button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default VehicleRentalsPage;