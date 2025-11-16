import React, { useState, useEffect } from 'react';
import { Page } from './App';
import { BellAlertIcon, TrashIcon, TagIcon, ArrowRightIcon } from './components/icons';
import * as api from './services/apiService';
import ConfirmationModal from './components/ConfirmationModal';

const PriceAlertsPage: React.FC<{ onNavigate: (page: Page, data?: any) => void, user: any }> = ({ onNavigate, user }) => {
    const [alerts, setAlerts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<number | null>(null);

    const loadAlerts = async () => {
        setIsLoading(true);
        try {
            const data = await api.getMyPriceAlerts();
            setAlerts(data);
        } catch (error) {
            console.error("Failed to load price alerts:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadAlerts();
    }, []);

    const handleDeleteClick = (id: number) => {
        setItemToDelete(id);
        setIsConfirmModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (itemToDelete === null) return;
        try {
            await api.deletePriceAlert(itemToDelete);
            setAlerts(alerts.filter(a => a.id !== itemToDelete));
        } catch (error) {
            alert(`Failed to delete alert: ${error.message}`);
        } finally {
            setIsConfirmModalOpen(false);
            setItemToDelete(null);
        }
    };

    return (
        <>
            <div className="bg-gray-100/50 dark:bg-gray-900/50 min-h-screen">
                <header className="bg-white dark:bg-gray-800 shadow-sm pt-12 pb-8">
                    <div className="container mx-auto px-6">
                        <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">My Price Alerts</h1>
                        <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">We'll notify you when prices drop for your saved routes.</p>
                    </div>
                </header>
                <main className="container mx-auto px-6 py-8">
                    <div className="space-y-4">
                        {isLoading ? <p>Loading alerts...</p> : alerts.length > 0 ? (
                            alerts.map((alert, index) => {
                                const hasPriceDrop = alert.status === 'Triggered'; 
                                const newPrice = alert.initial_price ? parseFloat(alert.initial_price) * 0.9 : 0;

                                return (
                                    <div key={alert.id} className={`bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md flex items-center justify-between transition-all duration-300 ${hasPriceDrop ? 'border-2 border-green-400 shadow-green-400/20' : ''}`}>
                                        <div className="flex items-center">
                                            {hasPriceDrop ? <TagIcon className="w-6 h-6 text-green-500 mr-4"/> : <BellAlertIcon className="w-6 h-6 text-gray-400 mr-4"/>}
                                            <div>
                                                <p className="font-bold text-lg dark:text-white">{alert.origin} <ArrowRightIcon className="inline w-4 h-4"/> {alert.destination}</p>
                                                {hasPriceDrop ? (
                                                    <p className="text-sm text-green-600 font-semibold">Price Drop! Now {new Intl.NumberFormat('fr-RW').format(newPrice)} RWF</p>
                                                ) : (
                                                    <p className="text-sm text-gray-500">Monitoring from {new Intl.NumberFormat('fr-RW').format(alert.initial_price)} RWF</p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            {hasPriceDrop && (
                                                <button onClick={() => onNavigate('bookingSearch', { from: alert.origin, to: alert.destination })} className="px-4 py-2 text-sm bg-green-500 text-white font-semibold rounded-md hover:bg-green-600">Book Now</button>
                                            )}
                                            <button onClick={() => handleDeleteClick(alert.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-full">
                                                <TrashIcon className="w-5 h-5"/>
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="text-center py-24 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
                                <BellAlertIcon className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto" />
                                <h3 className="text-xl font-bold text-gray-800 dark:text-white mt-4">No Active Price Alerts</h3>
                                <p className="text-gray-500 dark:text-gray-400 mt-2">Set an alert from your past bookings to start monitoring fares.</p>
                            </div>
                        )}
                    </div>
                </main>
            </div>
            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Delete Price Alert"
                message="Are you sure you want to stop monitoring this route? This action cannot be undone."
            />
        </>
    );
};

export default PriceAlertsPage;
