import React, { useState } from 'react';
import { MegaphoneIcon, PlusIcon, TrashIcon } from '../components/icons';
import ConfirmationModal from '../components/ConfirmationModal';

const initialAnnouncements = [
    { id: 1, text: "Reminder: All drivers must complete the new safety training module by Friday.", target: "Drivers", date: "2024-10-28" },
    { id: 2, text: "Heavy rain is expected on the Kigali-Huye route this afternoon. Please drive with extra caution.", target: "All", date: "2024-10-27" }
];

const PlatformAnnouncements: React.FC = () => {
    const [announcements, setAnnouncements] = useState(initialAnnouncements);
    const [newMessage, setNewMessage] = useState('');
    const [targetRole, setTargetRole] = useState('All');
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<number | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        const newAnnouncement = {
            id: Date.now(),
            text: newMessage,
            target: targetRole,
            date: new Date().toISOString().split('T')[0],
        };

        setAnnouncements([newAnnouncement, ...announcements]);
        setNewMessage('');
        setTargetRole('All');
    };

    const handleDeleteClick = (id: number) => {
        setItemToDelete(id);
        setIsConfirmModalOpen(true);
    };

    const handleConfirmDelete = () => {
        if (itemToDelete === null) return;
        setAnnouncements(announcements.filter(ann => ann.id !== itemToDelete));
        setIsConfirmModalOpen(false);
        setItemToDelete(null);
    };

    return (
        <div>
            <h1 className="text-3xl font-bold dark:text-gray-200 mb-6">Platform Announcements</h1>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <div className="bg-white dark:bg-gray-800/50 p-6 rounded-2xl shadow-lg">
                         <h2 className="text-xl font-bold dark:text-white mb-4">Past Announcements</h2>
                         <div className="space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
                            {announcements.map(ann => (
                                <div key={ann.id} className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg relative group">
                                    <p className="text-sm text-gray-800 dark:text-gray-200">{ann.text}</p>
                                    <div className="flex items-center justify-between mt-3 text-xs text-gray-500 dark:text-gray-400">
                                        <span>To: <span className="font-semibold">{ann.target}</span></span>
                                        <span>{new Date(ann.date).toLocaleDateString()}</span>
                                    </div>
                                    <button onClick={() => handleDeleteClick(ann.id)} className="absolute top-2 right-2 p-1 bg-white dark:bg-gray-800 rounded-full text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                         </div>
                    </div>
                </div>
                <div>
                    <div className="bg-white dark:bg-gray-800/50 p-6 rounded-2xl shadow-lg">
                        <h2 className="text-xl font-bold dark:text-white mb-4">Create New Announcement</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Message</label>
                                <textarea 
                                    value={newMessage}
                                    onChange={e => setNewMessage(e.target.value)}
                                    rows={5}
                                    className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                                    required
                                />
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Target Audience</label>
                                <select 
                                    value={targetRole} 
                                    onChange={e => setTargetRole(e.target.value)}
                                    className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                                >
                                    <option>All</option>
                                    <option>Passengers</option>
                                    <option>Drivers</option>
                                    <option>Companies</option>
                                    <option>Agents</option>
                                </select>
                            </div>
                            <button type="submit" className="w-full flex items-center justify-center bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700">
                                <PlusIcon className="w-5 h-5 mr-2" /> Publish Announcement
                            </button>
                        </form>
                    </div>
                </div>
            </div>
            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Delete Announcement"
                message="Are you sure you want to delete this announcement? This action cannot be undone."
            />
        </div>
    );
};

export default PlatformAnnouncements;
