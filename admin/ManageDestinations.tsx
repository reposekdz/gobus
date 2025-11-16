import React, { useState, useEffect, useRef } from 'react';
import { MapIcon, PlusIcon, PencilSquareIcon, TrashIcon } from '../components/icons';
import * as api from '../services/apiService';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import ConfirmationModal from '../components/ConfirmationModal';

const DestinationForm = ({ destination, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
        from_location: destination?.from_location || '',
        to_location: destination?.to_location || '',
        price: destination?.price || '',
        image_data_uri: destination?.image_data_uri || '',
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

    const handleChange = e => setFormData(p => ({...p, [e.target.name]: e.target.value}));

    const handleSubmit = e => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
             <div>
                <label className="block text-sm font-medium">Image</label>
                <div className="mt-1 flex items-center space-x-4">
                    {formData.image_data_uri && <img src={formData.image_data_uri} alt="preview" className="w-24 h-24 object-cover rounded-md"/>}
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="text-sm font-semibold text-blue-600 hover:underline">
                        {formData.image_data_uri ? 'Change' : 'Upload'} Image
                    </button>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div><label className="text-sm">From</label><input type="text" name="from_location" value={formData.from_location} onChange={handleChange} className="w-full mt-1 p-2 border rounded-md dark:bg-gray-700" required /></div>
                <div><label className="text-sm">To</label><input type="text" name="to_location" value={formData.to_location} onChange={handleChange} className="w-full mt-1 p-2 border rounded-md dark:bg-gray-700" required /></div>
            </div>
            <div><label className="text-sm">Price (RWF)</label><input type="number" name="price" value={formData.price} onChange={handleChange} className="w-full mt-1 p-2 border rounded-md dark:bg-gray-700" required /></div>
            <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={onCancel}>Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg">Save</button>
            </div>
        </form>
    );
};

const ManageDestinations: React.FC = () => {
    const [destinations, setDestinations] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string|null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentDestination, setCurrentDestination] = useState<any | null>(null);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<number | null>(null);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const data = await api.getAllDestinations();
            setDestinations(data);
        } catch (e) {
            setError(e.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);
    
    const openModal = (dest = null) => {
        setCurrentDestination(dest);
        setIsModalOpen(true);
    };

    const handleSave = async (data) => {
        setIsModalOpen(false);
        try {
            if (currentDestination) {
                await api.adminUpdateDestination(currentDestination.id, data);
            } else {
                await api.adminCreateDestination(data);
            }
            fetchData();
        } catch (e) {
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
            await api.adminDeleteDestination(itemToDelete);
            fetchData();
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
            <h1 className="text-3xl font-bold dark:text-gray-200 mb-6">Manage Featured Destinations</h1>
            <div className="bg-white dark:bg-gray-800/50 p-6 rounded-2xl shadow-lg">
                <div className="flex justify-end mb-4">
                    <button onClick={() => openModal()} className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700">
                        <PlusIcon className="w-5 h-5 mr-2" /> Add Destination
                    </button>
                </div>
                
                {error && <p className="text-red-500 my-2">{error}</p>}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {destinations.map(dest => (
                        <div key={dest.id} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg shadow-md overflow-hidden group">
                            <img src={dest.image_data_uri} alt={dest.to_location} className="w-full h-40 object-cover"/>
                            <div className="p-4">
                                <p className="font-bold text-lg dark:text-white">{dest.from_location} to {dest.to_location}</p>
                                <p className="text-green-600 font-semibold">{new Intl.NumberFormat('fr-RW').format(dest.price)} RWF</p>
                            </div>
                            <div className="p-2 bg-gray-100 dark:bg-gray-700 flex justify-end space-x-2">
                                <button onClick={() => openModal(dest)} className="p-1 text-gray-500 hover:text-blue-600"><PencilSquareIcon className="w-5 h-5"/></button>
                                <button onClick={() => handleDeleteClick(dest.id)} className="p-1 text-gray-500 hover:text-red-600"><TrashIcon className="w-5 h-5"/></button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
             <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={currentDestination ? "Edit Destination" : "Add New Destination"}>
                <DestinationForm destination={currentDestination} onSave={handleSave} onCancel={() => setIsModalOpen(false)} />
            </Modal>
             <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Delete Destination"
                message="Are you sure you want to delete this featured destination? This action cannot be undone."
            />
        </div>
    );
};

export default ManageDestinations;
