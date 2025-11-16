import React, { useState, useEffect } from 'react';
import { MapIcon, SearchIcon, PlusIcon, PencilSquareIcon, TrashIcon } from '../components/icons';
import Modal from '../components/Modal';
import ConfirmationModal from '../components/ConfirmationModal';
import * as api from '../services/apiService';
import LoadingSpinner from '../components/LoadingSpinner';

const RouteForm = ({ route, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
        from: route?.from || '',
        to: route?.to || '',
        price: route?.price || 0,
        duration: route?.duration ? (route.duration / 60).toFixed(2) : '', // convert minutes to hours
        status: route?.status || 'Active',
    });

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'number' ? parseFloat(value) : value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">From</label>
                    <input type="text" name="from" value={formData.from} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">To</label>
                    <input type="text" name="to" value={formData.to} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" required />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Price (RWF)</label>
                    <input type="number" name="price" value={formData.price} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Duration (in hours)</label>
                    <input type="number" step="0.1" name="duration" value={formData.duration} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" placeholder="e.g., 3.5"/>
                </div>
            </div>
            <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-semibold border rounded-lg dark:border-gray-600">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700">Save Route</button>
            </div>
        </form>
    );
};


interface CompanyRoutesProps {
    companyId: string;
}

const CompanyRoutes: React.FC<CompanyRoutesProps> = ({ companyId }) => {
    const [routes, setRoutes] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentRoute, setCurrentRoute] = useState<any | null>(null);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string|null>(null);

    const fetchRoutes = async () => {
        setIsLoading(true);
        try {
            const data = await api.companyGetMyRoutes();
            setRoutes(data);
        } catch (e: any) {
            setError(e.message || 'Failed to fetch routes');
        } finally {
            setIsLoading(false);
        }
    };
    
    useEffect(() => {
        fetchRoutes();
    }, []);


    const openModal = (route = null) => {
        setCurrentRoute(route);
        setIsModalOpen(true);
    };

    const handleSave = async (routeData: any) => {
        setIsModalOpen(false);
        setIsLoading(true);
        try {
            if (currentRoute) {
                await api.companyUpdateRoute(currentRoute.id, routeData);
            } else {
                await api.companyCreateRoute(routeData);
            }
            await fetchRoutes();
        } catch(e: any) {
            setError(e.message || 'Failed to save route.');
        } finally {
            setIsLoading(false);
        }
    };

     const handleDeleteClick = (id: string) => {
        setItemToDelete(id);
        setIsConfirmModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!itemToDelete) return;
        setIsConfirmModalOpen(false);
        setIsLoading(true);
        try {
            await api.companyDeleteRoute(itemToDelete);
            await fetchRoutes();
        } catch (e: any) {
            setError(e.message || 'Failed to delete route.');
        } finally {
            setIsLoading(false);
            setItemToDelete(null);
        }
    };

    const formatDuration = (minutes: number) => {
        if (!minutes) return 'N/A';
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return `${h}h ${m}m`;
    };

    return (
        <div>
            {isLoading && <LoadingSpinner />}
            <h1 className="text-3xl font-bold dark:text-gray-200 mb-6">Manage Routes</h1>
            <div className="bg-white dark:bg-gray-800/50 p-6 rounded-2xl shadow-lg">
                <div className="flex justify-between items-center mb-4">
                    <div className="relative w-full max-w-xs">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input type="text" placeholder="Search routes..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" />
                    </div>
                    <button onClick={() => openModal()} className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700">
                        <PlusIcon className="w-5 h-5 mr-2" /> Add Route
                    </button>
                </div>

                {error && <p className="text-red-500 mb-4">{error}</p>}

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                            <tr>
                                <th className="p-3">Route</th>
                                <th className="p-3">Price</th>
                                <th className="p-3">Duration</th>
                                <th className="p-3">Status</th>
                                <th className="p-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {routes.filter(r => `${r.from}-${r.to}`.toLowerCase().includes(searchTerm.toLowerCase())).map(route => (
                                <tr key={route.id} className="border-t dark:border-gray-700">
                                    <td className="p-3 font-semibold dark:text-white">{route.from} - {route.to}</td>
                                    <td>{new Intl.NumberFormat('fr-RW').format(route.price)} RWF</td>
                                    <td>{formatDuration(route.duration)}</td>
                                    <td>
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${route.status === 'Active' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'}`}>
                                            {route.status}
                                        </span>
                                    </td>
                                    <td className="flex space-x-2 p-3">
                                        <button onClick={() => openModal(route)} className="p-1 text-gray-500 hover:text-blue-600"><PencilSquareIcon className="w-5 h-5"/></button>
                                        <button onClick={() => handleDeleteClick(route.id)} className="p-1 text-gray-500 hover:text-red-600"><TrashIcon className="w-5 h-5"/></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={currentRoute ? "Edit Route" : "Add New Route"}>
                <RouteForm route={currentRoute} onSave={handleSave} onCancel={() => setIsModalOpen(false)} />
            </Modal>
             <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Delete Route"
                message="Are you sure you want to delete this route? This action cannot be undone."
                isLoading={isLoading}
            />
        </div>
    );
};

export default CompanyRoutes;