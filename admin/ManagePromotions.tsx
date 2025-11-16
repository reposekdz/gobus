import React, { useState } from 'react';
import { TagIcon, PlusIcon, PencilSquareIcon, TrashIcon } from '../components/icons';
import Modal from '../components/Modal';
import ConfirmationModal from '../components/ConfirmationModal';

const mockPromotions = [
    { id: 'VOLC01', title: 'Gura Itike ya Gatatu ku buntu!', code: 'GENDANEZA', discount: '100% off 3rd ticket', expiryDate: '2024-11-30', status: 'Active' },
    { id: 'VOLC02', title: 'Igabanyirizwa rya Weekend', code: 'WEEKEND10', discount: '10%', expiryDate: '2024-12-22', status: 'Active' },
    { id: 'RITCO01', title: 'Igabanyirizwa ry\'Abanyeshuri', code: 'STUDENT15', discount: '15%', expiryDate: '2024-12-31', status: 'Inactive' },
];

const PromotionForm = ({ promo, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
        title: '',
        code: '',
        discount: '',
        expiryDate: '',
        status: 'Active',
        ...promo
    });

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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Promotion Title</label>
                <input type="text" name="title" value={formData.title} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Promo Code</label>
                    <input type="text" name="code" value={formData.code} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Discount (e.g., 10% or 500RWF)</label>
                    <input type="text" name="discount" value={formData.discount} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" required />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Expiry Date</label>
                    <input type="date" name="expiryDate" value={formData.expiryDate} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                    <select name="status" value={formData.status} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600">
                        <option>Active</option>
                        <option>Inactive</option>
                    </select>
                </div>
            </div>
            <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-semibold border rounded-lg dark:border-gray-600">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700">Save Promotion</button>
            </div>
        </form>
    );
};


const ManagePromotions: React.FC = () => {
    const [promotions, setPromotions] = useState(mockPromotions);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentPromo, setCurrentPromo] = useState<any | null>(null);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<string | null>(null);

    const openModal = (promo = null) => {
        setCurrentPromo(promo);
        setIsModalOpen(true);
    };

    const handleSave = (promoData) => {
        if (currentPromo) {
            setPromotions(promotions.map(p => p.id === currentPromo.id ? { ...p, ...promoData } : p));
        } else {
            setPromotions([...promotions, { ...promoData, id: `PROMO-${Date.now()}` }]);
        }
        setIsModalOpen(false);
    };

     const handleDeleteClick = (id: string) => {
        setItemToDelete(id);
        setIsConfirmModalOpen(true);
    };

    const handleConfirmDelete = () => {
        if (!itemToDelete) return;
        setPromotions(promotions.filter(p => p.id !== itemToDelete));
        setIsConfirmModalOpen(false);
        setItemToDelete(null);
    };

    return (
        <div>
            <h1 className="text-3xl font-bold dark:text-gray-200 mb-6">Manage Promotions</h1>
            <div className="bg-white dark:bg-gray-800/50 p-6 rounded-2xl shadow-lg">
                <div className="flex justify-end mb-4">
                     <button onClick={() => openModal()} className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700">
                        <PlusIcon className="w-5 h-5 mr-2" /> Create Promotion
                    </button>
                </div>
                 <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                            <tr>
                                <th className="p-3">Title</th>
                                <th className="p-3">Code</th>
                                <th className="p-3">Discount</th>
                                <th className="p-3">Expires</th>
                                <th className="p-3">Status</th>
                                <th className="p-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {promotions.map(promo => (
                                <tr key={promo.id} className="border-t dark:border-gray-700">
                                    <td className="p-3 font-semibold dark:text-white">{promo.title}</td>
                                    <td className="font-mono">{promo.code}</td>
                                    <td>{promo.discount}</td>
                                    <td>{new Date(promo.expiryDate).toLocaleDateString()}</td>
                                    <td>
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${promo.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{promo.status}</span>
                                    </td>
                                    <td className="flex space-x-2 p-3">
                                        <button onClick={() => openModal(promo)} className="p-1 text-gray-500 hover:text-blue-600"><PencilSquareIcon className="w-5 h-5"/></button>
                                        <button onClick={() => handleDeleteClick(promo.id)} className="p-1 text-gray-500 hover:text-red-600"><TrashIcon className="w-5 h-5"/></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
             <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={currentPromo ? 'Edit Promotion' : 'Create New Promotion'}>
                <PromotionForm promo={currentPromo} onSave={handleSave} onCancel={() => setIsModalOpen(false)} />
            </Modal>
            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Delete Promotion"
                message="Are you sure you want to delete this promotion? This action cannot be undone."
            />
        </div>
    );
};

export default ManagePromotions;
