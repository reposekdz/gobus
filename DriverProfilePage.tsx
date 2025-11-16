import React, { useState, useMemo, useEffect } from 'react';
import { PhoneIcon, EnvelopeIcon, MapPinIcon, CalendarIcon, BriefcaseIcon, ShieldCheckIcon, ClipboardDocumentListIcon, ChartPieIcon, CameraIcon, BellAlertIcon } from './components/icons';
import * as api from './services/apiService';
import LoadingSpinner from './components/LoadingSpinner';
import DriverPerformance from './components/DriverPerformance';

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


interface DriverProfilePageProps {
    driver: any;
}

const DriverProfilePage: React.FC<DriverProfilePageProps> = ({ driver }) => {
    const [activeTab, setActiveTab] = useState('details');
    const [tripHistory, setTripHistory] = useState([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    
    useEffect(() => {
        if (driver?.id && activeTab === 'history') {
            const fetchHistory = async () => {
                setIsLoadingHistory(true);
                try {
                    const data = await api.adminGetDriverHistory(driver.id);
                    setTripHistory(data);
                } catch (error) {
                    console.error("Failed to fetch trip history", error);
                } finally {
                    setIsLoadingHistory(false);
                }
            };
            fetchHistory();
        }
    }, [driver?.id, activeTab]);


    if (!driver || !driver.name) {
        return <div className="p-8 text-center dark:text-white">Loading driver data...</div>;
    }

    const memberSince = driver.created_at ? new Date(driver.created_at).toLocaleString('default', { month: 'long', year: 'numeric' }) : 'N/A';
    
    // Mock data for display if not present
    const performance = driver.performance || { onTimeRate: 98, averageRating: 4.8, safetyScore: 99, totalTrips: 120 };
    const documents = driver.documents || [
        { _id: 'doc1', name: 'Driving License', expiry: '2025-12-31'},
        { _id: 'doc2', name: 'Medical Certificate', expiry: '2024-11-15'},
    ];


    const documentsWithIssues = useMemo(() => {
        if (!documents) return [];
        return documents.filter(doc => {
            const status = getDocumentStatus(doc.expiry);
            return status.text === 'Expired' || status.text === 'Expiring Soon';
        });
    }, [documents]);

    const TabButton = ({ tabName, label }) => (
        <button onClick={() => setActiveTab(tabName)} className={`py-2 px-3 text-sm font-semibold rounded-md transition-colors ${activeTab === tabName ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
            {label}
        </button>
    );

    return (
        <div className="bg-gray-100/50 dark:bg-gray-900/50 min-h-full py-12">
            <div className="container mx-auto px-6 max-w-4xl">
                {documentsWithIssues.length > 0 && (
                    <div className="bg-yellow-100 dark:bg-yellow-900/50 border-l-4 border-yellow-500 text-yellow-800 dark:text-yellow-200 p-4 rounded-r-lg mb-6 shadow-lg" role="alert">
                        <div className="flex">
                            <div className="py-1"><BellAlertIcon className="w-6 h-6 mr-4"/></div>
                            <div>
                                <p className="font-bold">Attention Required</p>
                                <p className="text-sm">This driver has documents that are expired or expiring soon.</p>
                                <ul className="list-disc list-inside text-sm mt-2">
                                    {documentsWithIssues.map(doc => <li key={doc._id}>{doc.name} ({getDocumentStatus(doc.expiry).text})</li>)}
                                </ul>
                            </div>
                        </div>
                    </div>
                )}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
                    <div className="h-40 bg-blue-600 relative group">
                        <img src={driver.coverUrl || 'https://images.unsplash.com/photo-1533104816-588941750c11?q=80&w=1974&auto=format&fit=crop'} alt="Cover" className="w-full h-full object-cover"/>
                        <div className="absolute inset-0 bg-black/30"></div>
                    </div>
                    <div className="px-6 pb-6">
                        <div className="flex flex-col sm:flex-row items-center -mt-16">
                            {driver.avatar_url ? (
                                <img src={driver.avatar_url} alt={driver.name} className="w-32 h-32 rounded-full border-4 border-white dark:border-gray-800 object-cover"/>
                            ) : (
                                <div className="w-32 h-32 rounded-full border-4 border-white dark:border-gray-800 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                    <span className="text-5xl font-bold text-gray-500">{driver.name ? driver.name.charAt(0) : '?'}</span>
                                </div>
                            )}
                            <div className="sm:ml-6 mt-4 sm:mt-16 text-center sm:text-left">
                                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">{driver.name}</h1>
                                <p className="font-semibold text-blue-500">{driver.company_name || 'No Company Assigned'}</p>
                                <div className="mt-2 flex justify-center sm:justify-start flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500 dark:text-gray-400">
                                    <span className="flex items-center"><MapPinIcon className="w-4 h-4 mr-1.5"/>{driver.location || 'Kigali'}</span>
                                    <span className="flex items-center"><CalendarIcon className="w-4 h-4 mr-1.5"/>Joined {memberSince}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="px-6 py-4 grid grid-cols-2 md:grid-cols-4 gap-4 border-y dark:border-gray-700">
                        <StatCard label="On-Time Rate" value={`${performance.onTimeRate}%`} icon={<ChartPieIcon />} />
                        <StatCard label="Avg. Rating" value={`${performance.averageRating}/5`} icon={<ChartPieIcon />} />
                        <StatCard label="Total Trips" value={performance.totalTrips} icon={<ChartPieIcon />} />
                        <StatCard label="Safety Score" value={`${performance.safetyScore}%`} icon={<ChartPieIcon />} />
                    </div>

                    <div className="p-6">
                        <div className="mb-4 bg-gray-100 dark:bg-gray-900/50 p-1 rounded-lg flex space-x-1">
                            <TabButton tabName="details" label="Details" />
                            <TabButton tabName="performance" label="Performance" />
                            <TabButton tabName="history" label="Trip History" />
                            <TabButton tabName="documents" label="Documents" />
                        </div>
                        
                        {activeTab === 'details' && (
                            <div className="space-y-6 animate-fade-in">
                                {driver.bio && (
                                    <div>
                                        <h3 className="font-bold text-lg dark:text-white mb-2">Bio</h3>
                                        <p className="text-gray-700 dark:text-gray-300 text-sm italic">"{driver.bio}"</p>
                                    </div>
                                )}
                                <div>
                                    <h3 className="font-bold text-lg dark:text-white mb-2">Contact Information</h3>
                                    <div className="text-gray-700 dark:text-gray-300 space-y-2 text-sm">
                                         <p className="flex items-center"><PhoneIcon className="w-4 h-4 mr-2 text-gray-400"/> {driver.phone_number || 'Not provided'}</p>
                                         <p className="flex items-center"><EnvelopeIcon className="w-4 h-4 mr-2 text-gray-400"/> {driver.email || 'Not provided'}</p>
                                        <p className="flex items-center"><BriefcaseIcon className="w-4 h-4 mr-2 text-gray-400"/> Assigned Bus: {driver.assignedBusId || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        {activeTab === 'performance' && (
                            <DriverPerformance performanceData={performance} />
                        )}

                        {activeTab === 'history' && (
                             <div className="space-y-3 animate-fade-in max-h-96 overflow-y-auto custom-scrollbar">
                                {isLoadingHistory ? <LoadingSpinner/> : tripHistory.map((trip: any) => (
                                    <div key={trip.id} className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg flex justify-between items-center">
                                        <div>
                                            <p className="font-semibold text-sm dark:text-white">{trip.route}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(trip.date).toLocaleDateString()}</p>
                                        </div>
                                         <div className="text-right">
                                            <span className={`px-2 py-0.5 text-xs rounded-full font-semibold ${trip.status === 'Completed' || trip.status === 'Arrived' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{trip.status}</span>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{trip.passengers} passengers</p>
                                        </div>
                                    </div>
                                ))}
                                {!isLoadingHistory && tripHistory.length === 0 && <p className="text-center text-gray-500 py-4">No trip history found.</p>}
                            </div>
                        )}
                        
                        {activeTab === 'documents' && (
                            <div className="space-y-3 animate-fade-in">
                                {documents.map((doc: any, i) => {
                                    const status = getDocumentStatus(doc.expiry);
                                    return (
                                        <div key={i} className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg flex justify-between items-center">
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
        </div>
    );
};

export default DriverProfilePage;