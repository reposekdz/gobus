import React, { useState } from 'react';
import { Page } from './App';
import { ShieldCheckIcon } from './components/icons';

const TravelInsurancePage: React.FC<{ onNavigate: (page: Page) => void }> = ({ onNavigate }) => {
    const [quote, setQuote] = useState<number | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Mock quote calculation
        setQuote(5000);
    };

    return (
        <div className="bg-gray-100/50 dark:bg-gray-900/50 min-h-screen py-12">
            <div className="container mx-auto px-6 max-w-2xl">
                <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl">
                    <div className="text-center">
                        <ShieldCheckIcon className="w-12 h-12 mx-auto text-green-500 mb-4" />
                        <h1 className="text-3xl font-bold dark:text-white">Travel with Peace of Mind</h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-2">Get an instant quote for your travel insurance.</p>
                    </div>
                    
                    {quote !== null ? (
                        <div className="text-center p-8">
                            <p className="text-gray-600 dark:text-gray-300">Your insurance quote is:</p>
                            <p className="text-4xl font-bold text-green-600 my-2">{new Intl.NumberFormat('fr-RW').format(quote)} RWF</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">This covers one person for the duration of the trip.</p>
                             <button onClick={() => alert('Proceeding to payment...')} className="mt-6 px-6 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700">Accept & Pay</button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4 mt-8">
                            <div><label className="block text-sm font-medium">Number of Travelers</label><input type="number" defaultValue="1" className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700" required /></div>
                            <div><label className="block text-sm font-medium">Trip Start Date</label><input type="date" className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700" required /></div>
                            <div><label className="block text-sm font-medium">Trip End Date</label><input type="date" className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700" required /></div>
                            <div className="flex justify-end pt-4"><button type="submit" className="px-6 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg">Get Quote</button></div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TravelInsurancePage;
