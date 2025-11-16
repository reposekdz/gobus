import React, { useState, useEffect, useRef } from 'react';
import { MegaphoneIcon, PlusIcon, PencilSquareIcon, TrashIcon } from '../components/icons';
import Modal from '../components/Modal';
import ConfirmationModal from '../components/ConfirmationModal';
import * as api from '../services/apiService';
import LoadingSpinner from '../components/LoadingSpinner';

const AdForm = ({ ad, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
        company_name: ad?.company_name || '',
        link_url: ad?.link_url || '',
        image_data_uri: ad?.image_data_uri || '',
        status: ad?.status || 'Active',
    });
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setFormData(prev => ({ ...prev, image_data_uri: event.target?.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };
    
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
                <label className="block text-sm font-medium">Image Preview</label>
                <div className="mt-1 flex items-center space-x-4">
                    {formData.image_data_uri && <img src={formData.image_data_uri} alt="preview" className="w-48 h-24 object-cover rounded-md"/>}
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="text-sm font-semibold text-blue-600 hover:underline">
                        Upload Image
                    </button>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} required={!ad} />
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Company Name</label>
                <input type="text" name="company_name" value={formData.company_name} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" required />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Link URL</label>
                <input type="url" name="link_url" value={formData.link_url} onChange={handleChange} placeholder="https://example.com" className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                <select name="status" value={formData.status} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600">
                    <option>Active</option>
                    <option>Inactive</option>
                </select>
            </div>
            <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-semibold border rounded-lg dark:border-gray-600">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700">Save Ad</button>
            </div>
        </form>
    );
};


const ManageAds: React.FC = () => {
    const [ads, setAds] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentAd, setCurrentAd] = useState<any | null>(null);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchAds = async () => {
        setIsLoading(true);
        try {
            const { data } = await api.adminGetAds();
            setAds(data);
        } catch (e: any) {
            setError(e.message || 'Failed to fetch ads.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAds();
    }, []);

    const openModal = (ad = null) => {
        setCurrentAd(ad);
        setIsModalOpen(true);
    };

    const handleSave = async (adData) => {
        setIsModalOpen(false);
        try {
            if (currentAd) {
                await api.adminUpdateAd(currentAd.id, adData);
            } else {
                await api.adminCreateAd(adData);
            }
            fetchAds();
        } catch(e) {
            setError(e.message);
        }
    };

    const handleDeleteClick = (id: number) => {
        setItemToDelete(id);
        setIsConfirmModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (itemToDelete === null) return;
        try {
            await api.adminDeleteAd(itemToDelete);
            fetchAds();
        } catch (e) {
            setError(e.message);
        } finally {
            setIsConfirmModalOpen(false);
            setItemToDelete(null);
        }
    };

    return (
        <div>
            {isLoading && <LoadingSpinner />}
            <h1 className="text-3xl font-bold dark:text-gray-200 mb-6">Manage Advertisements</h1>
            <div className="bg-white dark:bg-gray-800/50 p-6 rounded-2xl shadow-lg">
                <div className="flex justify-end mb-4">
                     <button onClick={() => openModal()} className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700">
                        <PlusIcon className="w-5 h-5 mr-2" /> Create Ad
                    </button>
                </div>

                {error && <p className="text-red-500">{error}</p>}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {ads.map(ad => (
                        <div key={ad.id} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg shadow-md overflow-hidden group">
                            <img src={ad.image_data_uri} alt={ad.company_name} className="w-full h-32 object-cover"/>
                            <div className="p-4">
                                <p className="font-bold text-lg dark:text-white">{ad.company_name}</p>
                                <a href={ad.link_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 truncate">{ad.link_url}</a>
                                <div className="mt-2">
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${ad.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{ad.status}</span>
                                </div>
                            </div>
                             <div className="p-2 bg-gray-100 dark:bg-gray-700 flex justify-end space-x-2">
                                <button onClick={() => openModal(ad)} className="p-1 text-gray-500 hover:text-blue-600"><PencilSquareIcon className="w-5 h-5"/></button>
                                <button onClick={() => handleDeleteClick(ad.id)} className="p-1 text-gray-500 hover:text-red-600"><TrashIcon className="w-5 h-5"/></button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={currentAd ? 'Edit Ad' : 'Create New Ad'}>
                <AdForm ad={currentAd} onSave={handleSave} onCancel={() => setIsModalOpen(false)} />
            </Modal>
            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Delete Ad"
                message="Are you sure you want to delete this advertisement? This action cannot be undone."
            />
        </div>
    );
};

export default ManageAds;