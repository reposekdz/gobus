import React, { useState, useEffect } from 'react';
import { BriefcaseIcon, SearchIcon, PlusIcon, PencilSquareIcon, TrashIcon, EyeIcon, ArrowUpTrayIcon } from '../components/icons';
import Modal from '../components/Modal';
import { Page } from '../App';
import * as api from '../services/apiService';
import LoadingSpinner from '../components/LoadingSpinner';
import ConfirmationModal from '../components/ConfirmationModal';

const AgentForm = ({ agent, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
        name: agent?.name || '',
        email: agent?.email || '',
        phone: agent?.phone || '',
        password: '',
        location: agent?.location || '',
        commissionRate: (agent?.commissionRate || 0.05) * 100,
        status: agent?.status || 'Active',
        avatarUrl: agent?.avatarUrl || '',
    });
    const isEditing = !!agent;
    const [avatarPreview, setAvatarPreview] = useState(formData.avatarUrl);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'number' ? parseFloat(value) : value }));
    };
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                setAvatarPreview(reader.result as string);
                setFormData(prev => ({ ...prev, avatarUrl: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({ ...formData, commissionRate: formData.commissionRate / 100 });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center space-x-4">
                <img src={avatarPreview || 'https://randomuser.me/api/portraits/lego/3.jpg'} alt="Avatar" className="w-20 h-20 rounded-full object-cover bg-gray-200"/>
                <div>
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="text-sm font-semibold text-blue-600 hover:underline">Upload Photo</button>
                    <p className="text-xs text-gray-500">PNG or JPG. Max 2MB.</p>
                </div>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
            </div>
            <div>
                <label className="block text-sm font-medium">Agent Name</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" required />
            </div>
            <div>
                <label className="block text-sm font-medium">Email (Login)</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" required disabled={isEditing} />
            </div>
            {!isEditing && (
                 <div>
                    <label className="block text-sm font-medium">Initial Password</label>
                    <input type="password" name="password" value={formData.password} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" required />
                </div>
            )}
            <div>
                <label className="block text-sm font-medium">Location</label>
                <input type="text" name="location" value={formData.location} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" required />
            </div>
            <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-semibold border rounded-lg dark:border-gray-600">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700">Save Agent</button>
            </div>
        </form>
    );
};

const ManageAgents: React.FC<{ navigate: (page: Page, data?: any) => void; }> = ({ navigate }) => {
    const [agents, setAgents] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentAgent, setCurrentAgent] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string|null>(null);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<string | null>(null);

    const fetchAgents = async () => {
        setIsLoading(true);
        try {
            const data = await api.adminGetAllAgents();
            setAgents(data);
        } catch(e) {
            setError((e as Error).message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAgents();
    }, []);


    const openModal = (agent = null) => {
        setCurrentAgent(agent);
        setIsModalOpen(true);
    };

    const [credentials, setCredentials] = useState<any>(null);
    const [isCredentialsModalOpen, setIsCredentialsModalOpen] = useState(false);

    const handleSave = async (agentData) => {
        setIsModalOpen(false);
        setIsLoading(true);
        try {
            if (currentAgent) {
                await api.adminUpdateAgent(currentAgent._id, agentData);
                await fetchAgents();
            } else {
                const response = await api.adminCreateAgent(agentData);
                if (response.success && response.data) {
                    // Show credentials if auto-generated
                    if (response.data.password || response.data.email) {
                        setCredentials({
                            agentName: agentData.name,
                            email: response.data.email || agentData.email,
                            password: response.data.password,
                            serialCode: response.data.serial_code,
                            agentCode: response.data.agent_code
                        });
                        setIsCredentialsModalOpen(true);
                    }
                }
                await fetchAgents();
            }
        } catch(e) {
            setError((e as Error).message);
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
            await api.adminDeleteAgent(itemToDelete);
            await fetchAgents();
        } catch(e) {
            setError((e as Error).message);
        } finally {
            setIsLoading(false);
            setItemToDelete(null);
        }
    };
    

    return (
        <div>
            {isLoading && <LoadingSpinner />}
            <h1 className="text-3xl font-bold dark:text-gray-200 mb-6">Manage Agents</h1>
            <div className="bg-white dark:bg-gray-800/50 p-6 rounded-2xl shadow-lg">
                 <div className="flex justify-between items-center mb-4">
                    <div className="relative w-full max-w-xs">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search agents..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                        />
                    </div>
                    <button onClick={() => openModal()} className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700">
                        <PlusIcon className="w-5 h-5 mr-2" /> Add Agent
                    </button>
                </div>
                 {error && <p className="text-red-500">{error}</p>}
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                            <tr>
                                <th className="p-3">Agent Name</th>
                                <th className="p-3">Location</th>
                                <th className="p-3">Status</th>
                                <th className="p-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {agents.filter(a => a.name.toLowerCase().includes(searchTerm.toLowerCase())).map(agent => (
                                <tr key={agent.id} className="border-t dark:border-gray-700">
                                    <td className="p-3 font-semibold dark:text-white flex items-center">
                                        <img src={agent.avatarUrl} alt={agent.name} className="w-8 h-8 rounded-full object-cover mr-3"/>
                                        {agent.name}
                                    </td>
                                    <td>{agent.location}</td>
                                    <td>
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${agent.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{agent.status}</span>
                                    </td>
                                    <td className="flex space-x-1 p-3">
                                        <button onClick={() => navigate('agentProfile', agent)} className="p-1 text-gray-500 hover:text-green-600" title="View Profile"><EyeIcon className="w-5 h-5"/></button>
                                        <button onClick={() => openModal(agent)} className="p-1 text-gray-500 hover:text-blue-600" title="Edit"><PencilSquareIcon className="w-5 h-5"/></button>
                                        <button onClick={() => handleDeleteClick(agent.id)} className="p-1 text-gray-500 hover:text-red-600" title="Delete"><TrashIcon className="w-5 h-5"/></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                     {agents.length === 0 && !isLoading && <p className="text-center p-4 text-gray-500">No agents found.</p>}
                </div>
            </div>
             <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={currentAgent ? "Edit Agent" : "Add New Agent"}>
                <AgentForm agent={currentAgent} onSave={handleSave} onCancel={() => setIsModalOpen(false)} />
            </Modal>
             <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Delete Agent"
                message="Are you sure you want to delete this agent? This action is permanent and cannot be undone."
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
                    title="Agent Credentials Created"
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
                                    Agent Name
                                </label>
                                <p className="text-lg font-semibold dark:text-white">{credentials.agentName}</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Email (Login)
                                </label>
                                <div className="flex items-center space-x-2">
                                    <p className="text-lg font-mono dark:text-white">{credentials.email}</p>
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(credentials.email);
                                            alert('Email copied to clipboard!');
                                        }}
                                        className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800"
                                    >
                                        Copy
                                    </button>
                                </div>
                            </div>

                            {credentials.password && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Password
                                    </label>
                                    <div className="flex items-center space-x-2">
                                        <p className="text-lg font-mono dark:text-white">{credentials.password}</p>
                                        <button
                                            onClick={() => {
                                                navigator.clipboard.writeText(credentials.password);
                                                alert('Password copied to clipboard!');
                                            }}
                                            className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800"
                                        >
                                            Copy
                                        </button>
                                    </div>
                                </div>
                            )}

                            {credentials.serialCode && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Serial Code
                                    </label>
                                    <div className="flex items-center space-x-2">
                                        <p className="text-lg font-mono dark:text-white">{credentials.serialCode}</p>
                                        <button
                                            onClick={() => {
                                                navigator.clipboard.writeText(credentials.serialCode);
                                                alert('Serial code copied to clipboard!');
                                            }}
                                            className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800"
                                        >
                                            Copy
                                        </button>
                                    </div>
                                </div>
                            )}

                            {credentials.agentCode && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Agent Code
                                    </label>
                                    <div className="flex items-center space-x-2">
                                        <p className="text-lg font-mono dark:text-white">{credentials.agentCode}</p>
                                        <button
                                            onClick={() => {
                                                navigator.clipboard.writeText(credentials.agentCode);
                                                alert('Agent code copied to clipboard!');
                                            }}
                                            className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800"
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

export default ManageAgents;
