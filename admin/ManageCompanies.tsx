import React, { useState, useEffect } from 'react';
import { BuildingOfficeIcon, SearchIcon, PlusIcon, PencilSquareIcon, TrashIcon } from '../components/icons';
import * as api from '../services/apiService';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import ConfirmationModal from '../components/ConfirmationModal';

// Form for adding/editing a company
const CompanyForm = ({ company, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
        name: company?.name || '',
        ownerName: company?.owner?.name || '',
        ownerEmail: company?.owner?.email || '',
        password: '', // Only for new companies
        contactEmail: company?.contact?.email || '',
        contactPhone: company?.contact?.phone || '',
        status: company?.status || 'Active',
    });
    const isEditing = !!company;

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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Company Name</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" required />
            </div>
             <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Manager's Name</label>
                <input type="text" name="ownerName" value={formData.ownerName} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" required />
            </div>
             <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Manager's Email (Login)</label>
                <input type="email" name="ownerEmail" value={formData.ownerEmail} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" required disabled={isEditing} />
            </div>
            {!isEditing && (
                 <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Manager's Initial Password</label>
                    <input type="password" name="password" value={formData.password} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" required />
                </div>
            )}
            <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-semibold border rounded-lg dark:border-gray-600">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700">Save Company</button>
            </div>
        </form>
    );
};

const ManageCompanies: React.FC = () => {
    const [companies, setCompanies] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string|null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentCompany, setCurrentCompany] = useState<any | null>(null);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<string | null>(null);

    const fetchCompanies = async () => {
        try {
            setIsLoading(true);
            const data = await api.adminGetCompanies();
            setCompanies(data);
        } catch(e) {
            setError(e.message || 'Failed to load companies.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCompanies();
    }, []);

    const openModal = (company = null) => {
        setCurrentCompany(company);
        setIsModalOpen(true);
    };

    const [credentials, setCredentials] = useState<any>(null);
    const [isCredentialsModalOpen, setIsCredentialsModalOpen] = useState(false);

    const handleSave = async (companyData) => {
        setIsLoading(true);
        setIsModalOpen(false);
        try {
            if (currentCompany) {
                await api.adminUpdateCompany(currentCompany._id, companyData);
                await fetchCompanies();
            } else {
                const response = await api.adminCreateCompany(companyData);
                if (response.success && response.data) {
                    // Show credentials if auto-generated
                    if (response.data.managerPassword || response.data.managerEmail) {
                        setCredentials({
                            companyName: companyData.name,
                            managerEmail: response.data.managerEmail || companyData.ownerEmail,
                            managerPassword: response.data.managerPassword,
                            apiKey: response.data.apiKey,
                            apiSecret: response.data.apiSecret
                        });
                        setIsCredentialsModalOpen(true);
                    }
                }
                await fetchCompanies();
            }
        } catch(e) {
            setError(e.message || 'Failed to save company.');
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
            await api.adminDeleteCompany(itemToDelete);
            await fetchCompanies();
        } catch(e) {
             setError(e.message || 'Failed to delete company.');
        } finally {
            setIsLoading(false);
            setItemToDelete(null);
        }
    };


    return (
        <div>
            {isLoading && <LoadingSpinner />}
            <h1 className="text-3xl font-bold dark:text-gray-200 mb-6">Manage Companies</h1>
            <div className="bg-white dark:bg-gray-800/50 p-6 rounded-2xl shadow-lg">
                <div className="flex justify-between items-center mb-4">
                    <div className="relative w-full max-w-xs">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search companies..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                        />
                    </div>
                    <button onClick={() => openModal()} className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700">
                        <PlusIcon className="w-5 h-5 mr-2" /> Add Company
                    </button>
                </div>
                
                {error && <p className="text-red-500 my-2">{error}</p>}

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                            <tr>
                                <th className="p-3">Company Name</th>
                                <th className="p-3">Manager</th>
                                <th className="p-3">Status</th>
                                <th className="p-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {companies.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase())).map(company => (
                                <tr key={company._id} className="border-t dark:border-gray-700">
                                    <td className="p-3 font-semibold dark:text-white flex items-center">
                                        <img src={company.logoUrl} alt={company.name} className="w-8 h-8 rounded-full mr-3 object-contain bg-gray-100 p-1"/>
                                        {company.name}
                                    </td>
                                     <td>
                                        <p className="font-semibold">{company.owner?.name}</p>
                                        <p className="text-xs text-gray-500">{company.owner?.email}</p>
                                    </td>
                                    <td>
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${company.status === 'Active' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'}`}>
                                            {company.status}
                                        </span>
                                    </td>
                                    <td className="flex space-x-2 p-3">
                                        <button onClick={() => openModal(company)} className="p-1 text-gray-500 hover:text-blue-600"><PencilSquareIcon className="w-5 h-5"/></button>
                                        <button onClick={() => handleDeleteClick(company._id)} className="p-1 text-gray-500 hover:text-red-600"><TrashIcon className="w-5 h-5"/></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
             <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={currentCompany ? "Edit Company" : "Add New Company"}>
                <CompanyForm company={currentCompany} onSave={handleSave} onCancel={() => setIsModalOpen(false)} />
            </Modal>
             <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Delete Company"
                message="Are you sure you want to delete this company? This will also delete associated routes, buses, and trips. This action cannot be undone."
                isLoading={isLoading}
            />

            {/* Credentials Modal */}
            {credentials && (
                <Modal
                    isOpen={isCredentialsModalOpen}
                    onClose={() => {
                        setIsCredentialsModalOpen(false);
                        setCredentials(null);
                    }}
                    title="Company Credentials Created"
                >
                    <div className="space-y-4">
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                            <p className="text-sm text-yellow-800 dark:text-yellow-200 font-semibold mb-2">
                                ⚠️ Important: Save these credentials securely. They will not be shown again.
                            </p>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Company Name
                                </label>
                                <p className="text-lg font-semibold dark:text-white">{credentials.companyName}</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Manager Email (Login)
                                </label>
                                <div className="flex items-center space-x-2">
                                    <p className="text-lg font-mono dark:text-white">{credentials.managerEmail}</p>
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(credentials.managerEmail);
                                            alert('Email copied to clipboard!');
                                        }}
                                        className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800"
                                    >
                                        Copy
                                    </button>
                                </div>
                            </div>

                            {credentials.managerPassword && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Manager Password
                                    </label>
                                    <div className="flex items-center space-x-2">
                                        <p className="text-lg font-mono dark:text-white">{credentials.managerPassword}</p>
                                        <button
                                            onClick={() => {
                                                navigator.clipboard.writeText(credentials.managerPassword);
                                                alert('Password copied to clipboard!');
                                            }}
                                            className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800"
                                        >
                                            Copy
                                        </button>
                                    </div>
                                </div>
                            )}

                            {credentials.apiKey && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        API Key
                                    </label>
                                    <div className="flex items-center space-x-2">
                                        <p className="text-sm font-mono dark:text-white break-all">{credentials.apiKey}</p>
                                        <button
                                            onClick={() => {
                                                navigator.clipboard.writeText(credentials.apiKey);
                                                alert('API Key copied to clipboard!');
                                            }}
                                            className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800 flex-shrink-0"
                                        >
                                            Copy
                                        </button>
                                    </div>
                                </div>
                            )}

                            {credentials.apiSecret && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        API Secret
                                    </label>
                                    <div className="flex items-center space-x-2">
                                        <p className="text-sm font-mono dark:text-white break-all">{credentials.apiSecret}</p>
                                        <button
                                            onClick={() => {
                                                navigator.clipboard.writeText(credentials.apiSecret);
                                                alert('API Secret copied to clipboard!');
                                            }}
                                            className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800 flex-shrink-0"
                                        >
                                            Copy
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end pt-4">
                            <button
                                onClick={() => {
                                    setIsCredentialsModalOpen(false);
                                    setCredentials(null);
                                }}
                                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all"
                            >
                                I've Saved These Credentials
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default ManageCompanies;
