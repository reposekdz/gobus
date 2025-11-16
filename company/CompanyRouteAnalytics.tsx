import React, { useState, useMemo } from 'react';
import { MapIcon, SearchIcon, ChartPieIcon, UsersIcon, CurrencyDollarIcon } from '../components/icons';

const mockRouteData = [
    { id: 'r1', from: 'Kigali', to: 'Rubavu', passengers: 12580, revenue: 56610000, avgOccupancy: 85 },
    { id: 'r2', from: 'Kigali', to: 'Musanze', passengers: 9850, revenue: 34475000, avgOccupancy: 92 },
    { id: 'r3', from: 'Kigali', to: 'Huye', passengers: 7500, revenue: 22500000, avgOccupancy: 78 },
    { id: 'r4', from: 'Rubavu', to: 'Kigali', passengers: 11950, revenue: 53775000, avgOccupancy: 82 },
    { id: 'r5', from: 'Kigali', to: 'Gitarama', passengers: 25000, revenue: 25000000, avgOccupancy: 95 },
];

const CompanyRouteAnalytics: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: string } | null>({ key: 'revenue', direction: 'desc' });

    const sortedData = useMemo(() => {
        let sortableItems = [...mockRouteData];
        if (sortConfig !== null) {
            sortableItems.sort((a, b) => {
                if (a[sortConfig.key] < b[sortConfig.key]) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (a[sortConfig.key] > b[sortConfig.key]) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableItems.filter(r => `${r.from}-${r.to}`.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [sortConfig, searchTerm]);
    
    const requestSort = (key: string) => {
        let direction = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const getSortIndicator = (key: string) => {
        if (!sortConfig || sortConfig.key !== key) return '↕';
        return sortConfig.direction === 'asc' ? '↑' : '↓';
    };

    return (
        <div>
            <h1 className="text-3xl font-bold dark:text-gray-200 mb-6">Route Performance Analytics</h1>
            <div className="bg-white dark:bg-gray-800/50 p-6 rounded-2xl shadow-lg">
                <div className="relative w-full max-w-xs mb-4">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input type="text" placeholder="Search routes..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"/>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                            <tr>
                                <th className="p-3">Route</th>
                                <th className="p-3 cursor-pointer" onClick={() => requestSort('passengers')}>
                                    <div className="flex items-center"><UsersIcon className="w-4 h-4 mr-2"/> Total Passengers {getSortIndicator('passengers')}</div>
                                </th>
                                <th className="p-3 cursor-pointer" onClick={() => requestSort('revenue')}>
                                     <div className="flex items-center"><CurrencyDollarIcon className="w-4 h-4 mr-2"/> Total Revenue {getSortIndicator('revenue')}</div>
                                </th>
                                <th className="p-3 cursor-pointer" onClick={() => requestSort('avgOccupancy')}>
                                    <div className="flex items-center"><ChartPieIcon className="w-4 h-4 mr-2"/> Avg. Occupancy {getSortIndicator('avgOccupancy')}</div>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedData.map(route => (
                                <tr key={route.id} className="border-t dark:border-gray-700">
                                    <td className="p-3 font-semibold dark:text-white">{route.from} - {route.to}</td>
                                    <td>{new Intl.NumberFormat().format(route.passengers)}</td>
                                    <td className="font-semibold text-green-600 dark:text-green-400">{new Intl.NumberFormat('fr-RW').format(route.revenue)} RWF</td>
                                    <td>{route.avgOccupancy}%</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default CompanyRouteAnalytics;