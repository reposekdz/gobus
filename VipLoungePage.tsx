import React, { useState } from 'react';
import { Page } from './App';
import { UserGroupIcon } from './components/icons';

const VipLoungePage: React.FC<{ onNavigate: (page: Page) => void }> = ({ onNavigate }) => {
    const [purchased, setPurchased] = useState(false);

    const handlePurchase = () => {
        setPurchased(true);
    }

    return (
        <div className="text-center">
            <UserGroupIcon className="w-16 h-16 mx-auto text-yellow-500 mb-4"/>
            <h2 className="text-2xl font-bold dark:text-white">Terminal VIP Lounge</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-2 max-w-sm mx-auto">Relax in comfort before your trip. Enjoy complimentary drinks, snacks, and WiFi.</p>
            
            {purchased ? (
                 <div className="mt-6 bg-green-100 dark:bg-green-900/50 p-4 rounded-lg">
                    <p className="font-semibold text-green-800 dark:text-green-200">Access Granted! Show your booking QR code at the lounge entrance.</p>
                </div>
            ) : (
                <div className="mt-6">
                    <p className="text-lg font-bold">Price: <span className="text-green-500">10,000 RWF</span> / person</p>
                    <button onClick={handlePurchase} className="mt-4 px-6 py-2 bg-yellow-500 text-blue-900 font-semibold rounded-lg hover:bg-yellow-600">
                        Purchase Access Pass
                    </button>
                </div>
            )}
        </div>
    );
};

export default VipLoungePage;