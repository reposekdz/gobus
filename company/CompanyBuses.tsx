import React, { useState, useEffect } from 'react';
import { BusIcon, SearchIcon, PlusIcon, PencilSquareIcon, TrashIcon } from '../components/icons';
import Modal from '../components/Modal';
import ConfirmationModal from '../components/ConfirmationModal';
import * as api from '../services/apiService';
import LoadingSpinner from '../components/LoadingSpinner';

const BusForm = ({ bus, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
        plate: bus?.plate_number || '',
        model: bus?.model || '',
        capacity: bus?.capacity || 30,
        status: bus?.status || 'Operational',
        maintenanceDate: bus?.maintenanceDate ? new Date(bus.maintenanceDate).toISOString().split('T')[0] : '',
    });

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'number' ? parseInt(value) : value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Plate Number</label>
                <input type="text" name="plate" value={formData.plate} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" required />
            </div>
             <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Bus Model</label>
                <input type="text" name="model" value={formData.model} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" required />
            </div>
             <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Capacity</label>
                    <input type="number" name="capacity" value={formData.capacity} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" required />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                    <select name="status" value={formData.status} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600">
                        <option>Operational</option>
                        <option>On Route</option>
                        <option>Maintenance</option>
                    </select>
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Next Maintenance</label>
                <input type="date" name="maintenanceDate" value={formData.maintenanceDate} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
            </div>
            <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-semibold border rounded-lg dark:border-gray-600">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700">Save Bus</button>
            </div>
        </form>
    );
};

interface CompanyBusesProps {
    companyId: string;
}

const CompanyBuses: React.FC<CompanyBusesProps> = ({ companyId }) => {
    const [buses, setBuses] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentBus, setCurrentBus] = useState<any | null>(null);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string|null>(null);

    const fetchBuses = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await api.companyGetMyBuses();
            setBuses(data);
        } catch (e: any) {
            setError(e.message || 'Failed to fetch buses');
        } finally {
            setIsLoading(false);
        }
    };
    
    useEffect(() => {
        fetchBuses();
    }, []);


    const openModal = (bus = null) => {
        setCurrentBus(bus);
        setIsModalOpen(true);
    };

    const handleSave = async (busData: any) => {
        setIsModalOpen(false);
        setIsLoading(true);
        try {
            if (currentBus) {
                await api.companyUpdateBus(currentBus.id, busData);
            } else {
                await api.companyCreateBus(busData);
            }
            await fetchBuses();
        } catch(e: any) {
            setError(e.message || 'Failed to save bus.');
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
            await api.companyDeleteBus(itemToDelete);
            await fetchBuses();
        } catch (e: any) {
            setError(e.message || 'Failed to delete bus.');
        } finally {
            setIsLoading(false);
            setItemToDelete(null);
        }
    };

    return (
        <div>
            {isLoading && <LoadingSpinner />}
            <h1 className="text-3xl font-bold dark:text-gray-200 mb-6">Manage Buses</h1>
            <div className="bg-white dark:bg-gray-800/50 p-6 rounded-2xl shadow-lg">
                 <div className="flex justify-between items-center mb-4">
                    <div className="relative w-full max-w-xs">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by plate or model..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                        />
                    </div>
                    <button onClick={() => openModal()} className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700">
                        <PlusIcon className="w-5 h-5 mr-2" /> Add Bus
                    </button>
                </div>

                {error && <p className="text-red-500 mb-4">{error}</p>}

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                            <tr>
                                <th className="p-3">Plate Number</th>
                                <th className="p-3">Model</th>
                                <th className="p-3">Capacity</th>
                                <th className="p-3">Status</th>
                                <th className="p-3">Next Maintenance</th>
                                <th className="p-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {buses.filter(b => b.plate_number.toLowerCase().includes(searchTerm.toLowerCase()) || b.model.toLowerCase().includes(searchTerm.toLowerCase())).map(bus => (
                                <tr key={bus.id} className="border-t dark:border-gray-700">
                                    <td className="p-3 font-semibold dark:text-white flex items-center"><BusIcon className="w-5 h-5 mr-3 text-gray-400"/>{bus.plate_number}</td>
                                    <td>{bus.model}</td>
                                    <td>{bus.capacity} seats</td>
                                    <td>
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${bus.status === 'Operational' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : bus.status === 'On Route' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300'}`}>
                                            {bus.status}
                                        </span>
                                    </td>
                                    <td>{bus.maintenanceDate ? new Date(bus.maintenanceDate).toLocaleDateString() : 'N/A'}</td>
                                    <td className="flex space-x-2 p-3">
                                        <button onClick={() => openModal(bus)} className="p-1 text-gray-500 hover:text-blue-600"><PencilSquareIcon className="w-5 h-5"/></button>
                                        <button onClick={() => handleDeleteClick(bus.id)} className="p-1 text-gray-500 hover:text-red-600"><TrashIcon className="w-5 h-5"/></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={currentBus ? "Edit Bus" : "Add New Bus"}>
                <BusForm bus={currentBus} onSave={handleSave} onCancel={() => setIsModalOpen(false)} />
            </Modal>
            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Delete Bus"
                message="Are you sure you want to delete this bus? This action cannot be undone."
                isLoading={isLoading}
            />
        </div>
    );
};

export default CompanyBuses;