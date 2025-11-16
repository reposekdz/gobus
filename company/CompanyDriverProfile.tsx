import React, { useState, useEffect } from 'react';
import { PhoneIcon, EnvelopeIcon, BriefcaseIcon, ClipboardDocumentListIcon, ChartPieIcon, ShieldCheckIcon, ArrowLeftIcon, TicketIcon } from '../components/icons';
import LoadingSpinner from '../components/LoadingSpinner';
import * as api from '../services/apiService';

const StatCard = ({ label, value, icon }) => (
    <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl flex items-center space-x-3">
        <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-full">
            {React.cloneElement(icon, { className: "w-6 h-6 text-blue-500"})}
        </div>
        <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
            <p className="font-bold text-xl dark:text-white">{value}</p>
        </div>
    </div>
);

const getDocumentStatus = (expiryDate: string) => {
    if (!expiryDate) return { text: 'N/A', color: 'bg-gray-200 text-gray-800' };
    const today = new Date();
    const expiry = new Date(expiryDate);
    today.setHours(0, 0, 0, 0);
    expiry.setHours(0, 0, 0, 0);
    
    const daysUntilExpiry = (expiry.getTime() - today.getTime()) / (1000 * 3600 * 24);

    if (daysUntilExpiry < 0) {
        return { text: 'Expired', color: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300' };
    }
    if (daysUntilExpiry <= 30) {
        return { text: 'Expiring Soon', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300' };
    }
    return { text: 'Valid', color: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' };
};

interface CompanyDriverProfileProps {
    driver: any;
    onBack: () => void;
}

const CompanyDriverProfile: React.FC<CompanyDriverProfileProps> = ({ driver, onBack }) => {
    const [activeTab, setActiveTab] = useState('details');
    const [tripHistory, setTripHistory] = useState([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    
    useEffect(() => {
        if (driver?.id) {
            const fetchHistory = async () => {
                setIsLoadingHistory(true);
                try {
                    const data = await api.companyGetDriverHistory(driver.id);
                    setTripHistory(data);
                } catch (error) {
                    console.error("Failed to fetch trip history", error);
                } finally {
                    setIsLoadingHistory(false);
                }
            };
            fetchHistory();
        }
    }, [driver?.id]);


    if (!driver) {
        return (
            <div>
                <button onClick={onBack}>&larr; Back to list</button>
                <p>Driver not found.</p>
            </div>
        );
    }
    
    // Mock data for display if not present
    const performance = driver.performance || { onTimeRate: 98, averageRating: 4.8, safetyScore: 99 };
    const documents = driver.documents || [
        { name: 'Driving License', expiry: '2025-12-31'},
        { name: 'Medical Certificate', expiry: '2024-11-15'},
    ];


    return (
        <div className="max-w-4xl mx-auto">
            <button onClick={onBack} className="flex items-center text-gray-600 dark:text-gray-400 font-semibold mb-4 hover:text-black dark:hover:text-white">
                <ArrowLeftIcon className="w-5 h-5 mr-2" /> Back to Drivers List
            </button>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
                <div className="p-6 flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
                    {driver.avatar_url ? (
                        <img src={driver.avatar_url} alt={driver.name} className="w-24 h-24 rounded-full border-4 border-gray-200 dark:border-gray-700 object-cover"/>
                    ) : (
                         <div className="w-24 h-24 rounded-full border-4 border-gray-200 dark:border-gray-700 bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                            <span className="text-4xl font-bold text-gray-500">{driver.name ? driver.name.charAt(0) : '?'}</span>
                        </div>
                    )}
                    <div className="text-center sm:text-left">
                        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">{driver.name}</h1>
                        <p className="font-semibold text-blue-600 dark:text-blue-400">{driver.company_name || 'No Company Assigned'}</p>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">{driver.email || 'No email provided'}</p>
                    </div>
                </div>
                
                 <div className="px-6 pb-6 border-y dark:border-gray-700">
                    <div className="border-b dark:border-gray-700 mb-4">
                        <nav className="flex space-x-6 -mb-px">
                            <button onClick={() => setActiveTab('details')} className={`py-2 px-1 text-sm font-semibold ${activeTab === 'details' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 border-transparent'}`}>Details</button>
                            <button onClick={() => setActiveTab('history')} className={`py-2 px-1 text-sm font-semibold ${activeTab === 'history' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 border-transparent'}`}>Trip History</button>
                            <button onClick={() => setActiveTab('documents')} className={`py-2 px-1 text-sm font-semibold ${activeTab === 'documents' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 border-transparent'}`}>Documents</button>
                        </nav>
                    </div>
                     {activeTab === 'details' && (
                        <div className="animate-fade-in grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <h3 className="font-bold text-lg dark:text-white mb-2">Contact Information</h3>
                                <div className="text-gray-700 dark:text-gray-300 space-y-2 text-sm">
                                    <p className="flex items-center"><PhoneIcon className="w-4 h-4 mr-2 text-gray-400"/> {driver.phone_number}</p>
                                    <p className="flex items-center"><EnvelopeIcon className="w-4 h-4 mr-2 text-gray-400"/> {driver.email}</p>
                                </div>
                            </div>
                            <div>
                                <h3 className="font-bold text-lg dark:text-white mb-2">Performance Summary</h3>
                                <div className="space-y-2">
                                     <div className="flex justify-between text-sm"><span className="text-gray-500">On-Time Rate:</span> <span className="font-semibold">{performance.onTimeRate}%</span></div>
                                     <div className="flex justify-between text-sm"><span className="text-gray-500">Avg. Rating:</span> <span className="font-semibold">{performance.averageRating}/5</span></div>
                                     <div className="flex justify-between text-sm"><span className="text-gray-500">Safety Score:</span> <span className="font-semibold">{performance.safetyScore}%</span></div>
                                </div>
                            </div>
                        </div>
                     )}
                     {activeTab === 'history' && (
                         <div className="animate-fade-in space-y-3 max-h-80 overflow-y-auto custom-scrollbar">
                            {isLoadingHistory ? <p>Loading history...</p> : tripHistory.map(trip => (
                                 <div key={trip.id} className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg flex justify-between items-center">
                                    <div>
                                        <p className="font-semibold text-sm dark:text-white">{trip.route}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(trip.date).toLocaleDateString()}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className={`px-2 py-0.5 text-xs rounded-full font-semibold ${trip.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{trip.status}</span>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{trip.passengers} passengers</p>
                                    </div>
                                </div>
                            ))}
                         </div>
                     )}
                     {activeTab === 'documents' && (
                        <div className="animate-fade-in space-y-3">
                             {documents.map((doc: any) => {
                                const status = getDocumentStatus(doc.expiry);
                                return (
                                    <div key={doc.name} className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg flex justify-between items-center">
                                        <div className="flex items-center space-x-3">
                                            <ClipboardDocumentListIcon className="w-6 h-6 text-gray-400"/>
                                            <div>
                                                <p className="font-semibold text-sm dark:text-white">{doc.name}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">Expires: {new Date(doc.expiry).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <div className={`px-2 py-1 text-xs font-semibold rounded-full ${status.color}`}>
                                            {status.text}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                     )}
                </div>
            </div>
        </div>
    );
};

export default CompanyDriverProfile;