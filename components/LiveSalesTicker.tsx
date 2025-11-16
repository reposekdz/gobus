
import React, { useState, useEffect } from 'react';
import { TicketIcon } from './icons';

const mockSales = [
    { from: 'Kigali', to: 'Rubavu', company: 'Volcano Express', price: 4500 },
    { from: 'Huye', to: 'Kigali', company: 'RITCO', price: 3000 },
    { from: 'Kigali', to: 'Musanze', company: 'Horizon', price: 3500 },
    { from: 'Gitarama', to: 'Kigali', company: 'Volcano Express', price: 1500 },
];

const LiveSalesTicker = () => {
    const [currentSale, setCurrentSale] = useState(mockSales[0]);
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const interval = setInterval(() => {
            setIsVisible(false); // Start fade out
            setTimeout(() => {
                setCurrentSale(prev => {
                    const currentIndex = mockSales.indexOf(prev);
                    const nextIndex = (currentIndex + 1) % mockSales.length;
                    return mockSales[nextIndex];
                });
                setIsVisible(true); // Start fade in
            }, 500); // Time for fade out
        }, 4000); // Change every 4 seconds

        return () => clearInterval(interval);
    }, []);

    return (
        <div className={`relative bg-white dark:bg-gray-800/50 p-4 rounded-2xl shadow-lg transition-all duration-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}`}>
            <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-full">
                    <TicketIcon className="w-5 h-5 text-green-500"/>
                </div>
                <div>
                    <p className="text-sm font-semibold dark:text-white">New Booking!</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        {currentSale.from} to {currentSale.to} with {currentSale.company}
                    </p>
                </div>
                <div className="ml-auto text-right">
                    <p className="font-bold text-green-600 dark:text-green-400">
                        {new Intl.NumberFormat('fr-RW').format(currentSale.price)} RWF
                    </p>
                </div>
            </div>
             <div className="absolute top-2 right-2 flex items-center space-x-1">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                <span className="text-xs font-bold text-red-500">LIVE</span>
            </div>
        </div>
    );
};

export default LiveSalesTicker;
