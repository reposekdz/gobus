import React, { useState, useEffect } from 'react';
import { EnvelopeIcon, SearchIcon, CheckCircleIcon } from '../components/icons';
import * as api from '../services/apiService';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';

const MessageDetailModal = ({ message, onClose, onMarkRead }) => (
    <Modal isOpen={true} onClose={onClose} title={`Message from ${message.name}`}>
        <div className="space-y-4">
            <p><strong>From:</strong> {message.name} &lt;{message.email}&gt;</p>
            <p><strong>Subject:</strong> {message.subject}</p>
            <div className="p-3 bg-gray-100 dark:bg-gray-700/50 rounded-md max-h-64 overflow-y-auto">
                <p>{message.message}</p>
            </div>
            <div className="flex justify-end pt-4">
                {message.status === 'New' && (
                    <button 
                        onClick={() => onMarkRead(message._id)} 
                        className="px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        Mark as Read
                    </button>
                )}
            </div>
        </div>
    </Modal>
);

const ManageMessages: React.FC = () => {
    const [messages, setMessages] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string|null>(null);
    const [selectedMessage, setSelectedMessage] = useState<any | null>(null);

    const fetchMessages = async () => {
        try {
            setIsLoading(true);
            const data = await api.adminGetMessages();
            setMessages(data);
        } catch(e) {
            setError(e.message || 'Failed to load messages.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchMessages();
    }, []);

    const handleMarkAsRead = async (id: string) => {
        try {
            await api.adminUpdateMessage(id, { status: 'Read' });
            await fetchMessages();
            setSelectedMessage(null);
        } catch (e) {
            setError(e.message || 'Failed to update message status.');
        }
    };

    return (
        <div>
            {isLoading && <LoadingSpinner />}
            <h1 className="text-3xl font-bold dark:text-gray-200 mb-6">Contact Messages</h1>
            <div className="bg-white dark:bg-gray-800/50 p-6 rounded-2xl shadow-lg">
                <div className="relative w-full max-w-xs mb-4">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by name or subject..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    />
                </div>
                
                {error && <p className="text-red-500 my-2">{error}</p>}

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                            <tr>
                                <th className="p-3">From</th>
                                <th className="p-3">Subject</th>
                                <th className="p-3">Date</th>
                                <th className="p-3">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {messages.filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase()) || m.subject.toLowerCase().includes(searchTerm.toLowerCase())).map(message => (
                                <tr key={message._id} className="border-t dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer" onClick={() => setSelectedMessage(message)}>
                                    <td className="p-3">
                                        <p className="font-semibold dark:text-white">{message.name}</p>
                                        <p className="text-xs text-gray-500">{message.email}</p>
                                    </td>
                                    <td className="max-w-xs truncate">{message.subject}</td>
                                    <td>{new Date(message.createdAt).toLocaleString()}</td>
                                    <td>
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${message.status === 'New' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300' : 'bg-gray-200 text-gray-700 dark:bg-gray-900/50 dark:text-gray-300'}`}>
                                            {message.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            {selectedMessage && (
                <MessageDetailModal 
                    message={selectedMessage}
                    onClose={() => setSelectedMessage(null)}
                    onMarkRead={handleMarkAsRead}
                />
            )}
        </div>
    );
};

export default ManageMessages;