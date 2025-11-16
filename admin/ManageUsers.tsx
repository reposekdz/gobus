import React, { useState, useMemo, useEffect } from 'react';
import { UsersIcon, SearchIcon, EyeIcon } from '../components/icons';
import { Page } from '../App';
import * as api from '../services/apiService';
import LoadingSpinner from '../components/LoadingSpinner';

const ManageUsers: React.FC<{ navigate: (page: Page, data?: any) => void }> = ({ navigate }) => {
    const [users, setUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('All');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string|null>(null);

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const data = await api.adminGetAllUsers();
            setUsers(data);
        } catch(e) {
            setError((e as Error).message);
        } finally {
            setIsLoading(false);
        }
    }
    
    useEffect(() => {
        fetchUsers();
    }, []);

    const filteredUsers = useMemo(() => {
        return users.filter(user => 
            (user.name.toLowerCase().includes(searchTerm.toLowerCase()) || user.email.toLowerCase().includes(searchTerm.toLowerCase())) &&
            (roleFilter === 'All' || user.role === roleFilter.toLowerCase())
        );
    }, [users, searchTerm, roleFilter]);
    
    const toggleStatus = (id: number) => {
        // This would be an API call in a real app
        setUsers(users.map(user => user.id === id ? { ...user, status: user.status === 'Active' ? 'Suspended' : 'Active' } : user));
    };
    
    const handleViewProfile = (user: any) => {
        // This navigation will be limited by the data available in the user object
        switch(user.role) {
            case 'passenger': navigate('passengerProfile', user); break;
            case 'driver': navigate('driverProfile', user); break;
            case 'agent': navigate('agentProfile', user); break;
            default: alert(`Profile page for role '${user.role}' is not available.`);
        }
    };

    return (
        <div>
            {isLoading && <LoadingSpinner />}
            <h1 className="text-3xl font-bold dark:text-gray-200 mb-6">User Management</h1>
            <div className="bg-white dark:bg-gray-800/50 p-6 rounded-2xl shadow-lg">
                 <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center space-x-4">
                        <div className="relative w-full max-w-xs">
                            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by name or email..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                            />
                        </div>
                        <select 
                            value={roleFilter} 
                            onChange={e => setRoleFilter(e.target.value)}
                            className="p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                        >
                            <option>All</option>
                            <option>Passenger</option>
                            <option>Driver</option>
                            <option>Agent</option>
                            <option>Company</option>
                            <option>Admin</option>
                        </select>
                    </div>
                </div>

                {error && <p className="text-red-500">{error}</p>}
                
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                            <tr>
                                <th className="p-3">Name</th>
                                <th className="p-3">Email</th>
                                <th className="p-3">Role</th>
                                <th className="p-3">Join Date</th>
                                <th className="p-3">Status</th>
                                <th className="p-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map(user => (
                                <tr key={user._id} className="border-t dark:border-gray-700">
                                    <td className="p-3 font-semibold dark:text-white flex items-center space-x-3">
                                        {user.avatar_url ? (
                                            <img src={user.avatar_url} alt={user.name} className="w-8 h-8 rounded-full object-cover"/>
                                        ) : (
                                            <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                                <span className="text-xs font-bold text-gray-500">{user.name.charAt(0)}</span>
                                            </div>
                                        )}
                                        <span>{user.name}</span>
                                    </td>
                                    <td>{user.email}</td>
                                    <td className="capitalize">{user.role}</td>
                                    <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                                    <td>
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${user.status === 'Active' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'}`}>
                                            {user.status}
                                        </span>
                                    </td>
                                    <td className="p-3 flex items-center space-x-3">
                                        <button onClick={() => toggleStatus(user._id)} className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                                            {user.status === 'Active' ? 'Suspend' : 'Activate'}
                                        </button>
                                        <button onClick={() => handleViewProfile(user)} className="p-1 text-gray-500 hover:text-green-600" title="View Profile">
                                            <EyeIcon className="w-5 h-5"/>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ManageUsers;