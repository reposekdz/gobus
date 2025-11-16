import React, { useState, useEffect } from 'react';
import { UsersIcon, SearchIcon, PlusIcon, PencilSquareIcon, TrashIcon, EyeIcon } from '../components/icons';
import Modal from '../components/Modal';
import * as api from '../services/apiService';
import LoadingSpinner from '../components/LoadingSpinner';
import { Page } from '../App';
import ConfirmationModal from '../components/ConfirmationModal';


const DriverForm = ({ driver, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
        name: driver?.name || '',
        email: driver?.email || '',
        phone: driver?.phone || '',
        password: '',
        status: driver?.status || 'Active',
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email (Login)</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" required disabled={isEditing}/>
            </div>
            {!isEditing && (
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Initial Password</label>
                    <input type="password" name="password" value={formData.password} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" required/>
                </div>
            )}
             <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Phone Number</label>
                <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" required />
            </div>
             <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                <select name="status" value={formData.status} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600">
                    <option>Active</option>
                    <option>Unavailable</option>
                    <option>On Leave</option>
                    <option>Suspended</option>
                </select>
            </div>
            <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-semibold border rounded-lg dark:border-gray-600">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700">Save Driver</button>
            </div>
        </form>
    );
};

interface CompanyDriversProps {
    companyId: string;
    navigate: (page: Page, data?: any) => void;
}

const CompanyDrivers: React.FC<CompanyDriversProps> = ({ companyId, navigate }) => {
    const [drivers, setDrivers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentDriver, setCurrentDriver] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string|null>(null);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<string | null>(null);
    const [credentials, setCredentials] = useState<any>(null);
    const [isCredentialsModalOpen, setIsCredentialsModalOpen] = useState(false);

    const fetchDrivers = async () => {
        setIsLoading(true);
        try {
            const data = await api.companyGetMyDrivers();
            setDrivers(data);
        } catch (err) {
            setError(err.message || 'Failed to load drivers.');
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        fetchDrivers();
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
                await api.companyUpdateDriver(currentDriver._id, driverData);
                await fetchDrivers();
            } else {
                const response = await api.companyCreateDriver(driverData);
                if (response.success && response.data) {
                    // Show credentials if auto-generated
                    if (response.data.credentials || response.data.password) {
                        setCredentials({
                            driverName: driverData.name,
                            email: response.data.email || driverData.email,
                            password: response.data.password || response.data.credentials?.password,
                            serialCode: response.data.serial_code || response.data.credentials?.serialCode
                        });
                        setIsCredentialsModalOpen(true);
                    }
                }
                await fetchDrivers();
            }
        } catch (err) {
            setError((err as Error).message || 'Failed to save driver.');
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
            await api.companyDeleteDriver(itemToDelete);
            fetchDrivers();
        } catch (err) {
            setError(err.message || 'Failed to delete driver.');
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
                            placeholder="Search by name or phone..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                        />
                    </div>
                    <button onClick={() => openModal()} className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700">
                        <PlusIcon className="w-5 h-5 mr-2" /> Add Driver
                    </button>
                </div>

                {error && <p className="text-red-500 mb-4">{error}</p>}

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                            <tr>
                                <th className="p-3">Driver Name</th>
                                <th className="p-3">Phone</th>
                                <th className="p-3">Assigned Bus</th>
                                <th className="p-3">Status</th>
                                <th className="p-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {drivers.filter(d => d.name.toLowerCase().includes(searchTerm.toLowerCase()) || (d.phone && d.phone.includes(searchTerm))).map(driver => (
                                <tr key={driver._id} className="border-t dark:border-gray-700">
                                    <td className="p-3 font-semibold dark:text-white flex items-center space-x-3">
                                        {driver.avatar_url ? (
                                            <img src={driver.avatar_url} alt={driver.name} className="w-8 h-8 rounded-full object-cover"/>
                                        ) : (
                                            <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                                <span className="text-xs font-bold text-gray-500">{driver.name.charAt(0)}</span>
                                            </div>
                                        )}
                                        <span>{driver.name}</span>
                                    </td>
                                    <td>{driver.phone}</td>
                                    <td>{driver.assignedBusId || 'N/A'}</td>
                                    <td>
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${driver.status === 'Active' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300'}`}>
                                            {driver.status}
                                        </span>
                                    </td>
                                    <td className="flex space-x-2 p-3">
                                        <button onClick={() => navigate('companyDriverProfile', driver)} className="p-1 text-gray-500 hover:text-green-600" title="View Profile"><EyeIcon className="w-5 h-5"/></button>
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
                <DriverForm driver={currentDriver} onSave={handleSave} onCancel={() => setIsModalOpen(false)} />
            </Modal>
            {credentials && (
                <Modal
                    isOpen={isCredentialsModalOpen}
                    onClose={() => {
                        setIsCredentialsModalOpen(false);
                        setCredentials(null);
                    }}
                    title="Driver Credentials Created"
                >
                    <div className="space-y-4">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Driver account created successfully. Please save these credentials securely.
                        </p>
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                            <p className="text-xs font-semibold text-yellow-800 dark:text-yellow-300 mb-2">⚠️ Important: Save these credentials now. They will not be shown again.</p>
                        </div>
                        <div className="space-y-3">
                            <div>
                                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Driver Name</label>
                                <p className="font-mono text-sm font-bold dark:text-white">{credentials.driverName}</p>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Email (Login)</label>
                                <div className="flex items-center space-x-2">
                                    <p className="font-mono text-sm font-bold dark:text-white flex-1">{credentials.email}</p>
                                    <button
                                        onClick={() => navigator.clipboard.writeText(credentials.email)}
                                        className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                                    >
                                        Copy
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Password</label>
                                <div className="flex items-center space-x-2">
                                    <p className="font-mono text-sm font-bold dark:text-white flex-1">{credentials.password}</p>
                                    <button
                                        onClick={() => navigator.clipboard.writeText(credentials.password)}
                                        className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                                    >
                                        Copy
                                    </button>
                                </div>
                            </div>
                            {credentials.serialCode && (
                                <div>
                                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Serial Code</label>
                                    <div className="flex items-center space-x-2">
                                        <p className="font-mono text-sm font-bold dark:text-white flex-1">{credentials.serialCode}</p>
                                        <button
                                            onClick={() => navigator.clipboard.writeText(credentials.serialCode)}
                                            className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                                        >
                                            Copy
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </Modal>
            )}
             <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Delete Driver"
                message="Are you sure you want to delete this driver? This action cannot be undone."
                isLoading={isLoading}
            />
        </div>
    );
};

export default CompanyDrivers;