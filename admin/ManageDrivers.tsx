

import React, { useState, useEffect } from 'react';
import { BusIcon, SearchIcon, PlusIcon, PencilSquareIcon, TrashIcon, EyeIcon } from '../components/icons';
import { Page } from '../App';
import * as api from '../services/apiService';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import ConfirmationModal from '../components/ConfirmationModal';


// Form component
const DriverForm = ({ driver, companies, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
        name: driver?.name || '',
        email: driver?.email || '',
        phone: driver?.phone || '',
        companyId: driver?.company?._id || companies[0]?._id || '',
        password: '',
    });

    const isEditing = !!driver;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Driver Name</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" required />
            </div>
             <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" required disabled={isEditing} />
            </div>
            {!isEditing && (
                 <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Initial Password</label>
                    <input type="password" name="password" value={formData.password} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" required />
                </div>
            )}
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Phone</label>
                <input type="text" name="phone" value={formData.phone} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" required />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Company</label>
                <select name="companyId" value={formData.companyId} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600">
                    {companies.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
            </div>
             <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-semibold border rounded-lg dark:border-gray-600">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700">Save Driver</button>
            </div>
        </form>
    );
};


const ManageDrivers: React.FC<{ navigate: (page: Page, data?: any) => void; }> = ({ navigate }) => {
    const [drivers, setDrivers] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentDriver, setCurrentDriver] = useState(null);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<string | null>(null);

    const fetchAllData = async () => {
        setIsLoading(true);
        try {
            const [driversData, companiesData] = await Promise.all([api.adminGetAllDrivers(), api.getCompanies()]);
            setDrivers(driversData);
            setCompanies(companiesData);
            setError(null);
        } catch (err) {
            setError("Failed to fetch data. Please try again later.");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };
    
    useEffect(() => {
        fetchAllData();
    }, []);
    
    const openModal = (driver = null) => {
        setCurrentDriver(driver);
        setIsModalOpen(true);
    };

    const handleSave = async (driverData) => {
        setIsModalOpen(false);
        setIsLoading(true);
        try {
            if (currentDriver) {
                await api.adminUpdateDriver(currentDriver._id, driverData);
            } else {
                await api.adminCreateDriver(driverData);
            }
            await fetchAllData();
        } catch (err) {
            setError(`Failed to save driver: ${(err as Error).message}`);
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

        setIsLoading(true);
        setIsConfirmModalOpen(false);
        try {
            await api.adminDeleteDriver(itemToDelete);
            await fetchAllData();
        } catch (err) {
            setError(`Failed to delete driver: ${(err as Error).message}`);
        } finally {
            setIsLoading(false);
            setItemToDelete(null);
        }
    };
    
    return (
        <div>
            {isLoading && <LoadingSpinner />}
            <h1 className="text-3xl font-bold dark:text-gray-200 mb-6">Manage Drivers</h1>
            <div className="bg-white dark:bg-gray-800/50 p-6 rounded-2xl shadow-lg">
                 <div className="flex justify-between items-center mb-4">
                    <div className="relative w-full max-w-xs">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search drivers..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                        />
                    </div>
                    <button onClick={() => openModal()} className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700">
                        <PlusIcon className="w-5 h-5 mr-2" /> Add Driver
                    </button>
                </div>

                {error && <div className="text-red-500 bg-red-100 p-3 rounded-md mb-4">{error}</div>}

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                            <tr>
                                <th className="p-3">Driver Name</th>
                                <th className="p-3">Company</th>
                                <th className="p-3">Phone</th>
                                <th className="p-3">Status</th>
                                <th className="p-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {drivers.filter(d => d.name.toLowerCase().includes(searchTerm.toLowerCase())).map(driver => (
                                <tr key={driver._id} className="border-t dark:border-gray-700">
                                    <td className="p-3 font-semibold dark:text-white">
                                        <div className="flex items-center space-x-3">
                                            {driver.avatar_url ? (
                                                <img src={driver.avatar_url} alt={driver.name} className="w-8 h-8 rounded-full object-cover"/>
                                            ) : (
                                                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                                    <span className="text-xs font-bold text-gray-500">{driver.name.charAt(0)}</span>
                                                </div>
                                            )}
                                            <button onClick={() => navigate('driverProfile', driver)} className="hover:underline">
                                                {driver.name}
                                            </button>
                                        </div>
                                    </td>
                                    <td>{driver.company?.name || 'N/A'}</td>
                                    <td>{driver.phone || 'N/A'}</td>
                                    <td>
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${driver.status === 'Active' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300'}`}>
                                            {driver.status}
                                        </span>
                                    </td>
                                    <td className="flex space-x-1 p-3">
                                        <button onClick={() => navigate('driverProfile', driver)} className="p-1 text-gray-500 hover:text-green-600" title="View Profile"><EyeIcon className="w-5 h-5"/></button>
                                        <button onClick={() => openModal(driver)} className="p-1 text-gray-500 hover:text-blue-600"><PencilSquareIcon className="w-5 h-5"/></button>
                                        <button onClick={() => handleDeleteClick(driver._id)} className="p-1 text-gray-500 hover:text-red-600"><TrashIcon className="w-5 h-5"/></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
             <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={currentDriver ? "Edit Driver" : "Add New Driver"}>
                {companies.length > 0 ? (
                    <DriverForm driver={currentDriver} companies={companies} onSave={handleSave} onCancel={() => setIsModalOpen(false)} />
                ) : (
                    <p>Please add a company before adding a driver.</p>
                )}
            </Modal>
            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Delete Driver"
                message="Are you sure you want to delete this driver? This action is permanent and cannot be undone."
                isLoading={isLoading}
            />
        </div>
    );
};

export default ManageDrivers;