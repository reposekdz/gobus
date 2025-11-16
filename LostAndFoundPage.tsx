import React, { useState, useEffect } from 'react';
import { Page } from './App';
import { QuestionMarkCircleIcon, PlusIcon } from './components/icons';
import Modal from './components/Modal';
import * as api from './services/apiService';
import LoadingSpinner from './components/LoadingSpinner';

const ReportLostItemForm = ({ onSave, onCancel }) => {
    const [formData, setFormData] = useState({ item_name: '', description: '', route_found_on: '', date_found: '', contact: '' });
    const handleChange = e => setFormData(p => ({...p, [e.target.name]: e.target.value}));

    const handleSubmit = e => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Please provide as much detail as possible to help us find your item.</p>
            <div>
                <label className="block text-sm font-medium">Item Name</label>
                <input type="text" name="item_name" value={formData.item_name} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700" required />
            </div>
            <div>
                <label className="block text-sm font-medium">Description</label>
                <textarea name="description" value={formData.description} onChange={handleChange} rows={3} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700" />
            </div>
             <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium">Route</label>
                    <input type="text" name="route_found_on" value={formData.route_found_on} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700" placeholder="e.g., Kigali - Huye" required/>
                </div>
                 <div>
                    <label className="block text-sm font-medium">Date of Travel</label>
                    <input type="date" name="date_found" value={formData.date_found} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700" required/>
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium">Contact Phone</label>
                <input type="tel" name="contact" value={formData.contact} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700" required/>
            </div>
            <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-semibold border rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg">Submit Report</button>
            </div>
        </form>
    );
};

const LostAndFoundPage: React.FC<{ onNavigate: (page: Page) => void }> = ({ onNavigate }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [items, setItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchItems = async () => {
        setIsLoading(true);
        try {
            const data = await api.getLostAndFoundItems();
            setItems(data);
        } catch (error) {
            console.error("Failed to fetch lost and found items", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchItems();
    }, []);

    const handleSaveReport = async (data) => {
        try {
            await api.reportLostItem(data);
            setIsModalOpen(false);
            alert('Your report has been submitted. We will contact you if we find a match.');
            fetchItems(); // Refresh list
        } catch (error) {
            alert(`Failed to submit report: ${error.message}`);
        }
    };

    return (
        <div className="bg-gray-100 dark:bg-gray-900 min-h-screen">
            <header className="bg-white dark:bg-gray-800/50 shadow-sm pt-12 pb-8">
                <div className="container mx-auto px-6 text-center">
                    <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">Lost & Found</h1>
                    <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-600 dark:text-gray-400">
                        Lost an item on one of our partner buses? Report it here or check our list of found items.
                    </p>
                </div>
            </header>
            <main className="container mx-auto px-6 py-12">
                <div className="flex justify-end mb-6">
                    <button onClick={() => setIsModalOpen(true)} className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700">
                        <PlusIcon className="w-5 h-5 mr-2" /> Report a Lost Item
                    </button>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
                    <h2 className="text-xl font-bold dark:text-white mb-4">Recently Found Items</h2>
                     {isLoading ? <LoadingSpinner /> : (
                         <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-gray-700">
                                    <tr>
                                        <th className="p-3">Item</th>
                                        <th className="p-3">Date Found</th>
                                        <th className="p-3">Route</th>
                                        <th className="p-3">Status / Location</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map((item: any) => (
                                        <tr key={item.id} className="border-t dark:border-gray-700">
                                            <td className="p-3 font-semibold dark:text-white">{item.item_name}</td>
                                            <td>{new Date(item.date_found).toLocaleDateString()}</td>
                                            <td>{item.route_found_on}</td>
                                            <td>
                                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${item.status === 'Claimed' ? 'bg-gray-200 text-gray-800' : 'bg-green-100 text-green-800'}`}>
                                                    {item.status} ({item.location_stored})
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                             {items.length === 0 && <p className="text-center py-8 text-gray-500">No found items have been reported yet.</p>}
                        </div>
                     )}
                </div>
            </main>
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Report a Lost Item">
                <ReportLostItemForm onSave={handleSaveReport} onCancel={() => setIsModalOpen(false)} />
            </Modal>
        </div>
    );
};

export default LostAndFoundPage;