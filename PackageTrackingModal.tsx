
import React, { useState, useEffect } from 'react';
import { XIcon, ArchiveBoxIcon, TruckIcon, CheckCircleIcon } from './components/icons';

interface PackageTrackingModalProps {
  trackingId: string;
  onClose: () => void;
}

const statuses = [
    { status: 'Request Received', icon: ArchiveBoxIcon, description: 'Your package shipment request has been received and is being processed.' },
    { status: 'At Origin Station', icon: ArchiveBoxIcon, description: 'Your package has been dropped off and is waiting for departure.' },
    { status: 'In Transit', icon: TruckIcon, description: 'The bus carrying your package is on its way to the destination.' },
    { status: 'At Destination Station', icon: ArchiveBoxIcon, description: 'Your package has arrived and is ready for pickup.' },
    { status: 'Delivered', icon: CheckCircleIcon, description: 'The package has been successfully picked up by the recipient.' },
];

const PackageTrackingModal: React.FC<PackageTrackingModalProps> = ({ trackingId, onClose }) => {
    const [currentStatusIndex, setCurrentStatusIndex] = useState(-1);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Simulate fetching data and status progression
        setIsLoading(true);
        setCurrentStatusIndex(-1);
        setTimeout(() => {
            const pseudoHash = trackingId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
            const finalStatus = (pseudoHash % 5); // Index from 0 to 4
            setCurrentStatusIndex(finalStatus);
            setIsLoading(false);
        }, 1200);
    }, [trackingId]);

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 max-w-md w-full relative" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 p-1 rounded-full text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                    <XIcon className="w-6 h-6" />
                </button>
                <h3 className="text-xl font-bold dark:text-white">Package Status</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Tracking ID: <span className="font-mono text-blue-600 dark:text-blue-400">{trackingId}</span></p>

                {isLoading ? (
                    <div className="flex items-center justify-center h-48">
                        <div className="w-8 h-8 border-4 border-t-blue-500 border-l-blue-500 border-b-transparent border-r-transparent rounded-full animate-spin"></div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {statuses.map((statusInfo, index) => {
                            const isCompleted = index <= currentStatusIndex;
                            const isCurrent = index === currentStatusIndex;
                            return (
                                <div key={statusInfo.status} className="flex space-x-4">
                                    <div className="flex flex-col items-center">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isCompleted ? 'bg-green-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'}`}>
                                            <statusInfo.icon className="w-5 h-5" />
                                        </div>
                                        {index < statuses.length - 1 && <div className={`flex-grow w-0.5 mt-2 ${isCompleted ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-600'}`}></div>}
                                    </div>
                                    <div>
                                        <p className={`font-semibold ${isCompleted ? 'text-gray-800 dark:text-white' : 'text-gray-400 dark:text-gray-500'}`}>{statusInfo.status}</p>
                                        {isCurrent && <p className="text-xs text-blue-600 dark:text-blue-400 animate-pulse">{statusInfo.description}</p>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PackageTrackingModal;
