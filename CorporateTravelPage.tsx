import React, { useState } from 'react';
import { Page } from './App';
import { BriefcaseIcon } from './components/icons';

const CorporateTravelPage: React.FC<{ onNavigate: (page: Page) => void }> = ({ onNavigate }) => {
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitted(true);
    };

    return (
        <div className="bg-gray-100/50 dark:bg-gray-900/50 min-h-screen py-12">
            <div className="container mx-auto px-6 max-w-2xl">
                <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl">
                    <div className="text-center">
                        <BriefcaseIcon className="w-12 h-12 mx-auto text-blue-500 mb-4" />
                        <h1 className="text-3xl font-bold dark:text-white">Corporate Travel Solutions</h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-2">Simplify your business travel with a corporate account.</p>
                    </div>
                    
                    {submitted ? (
                        <div className="text-center p-8">
                            <h2 className="text-xl font-semibold text-green-600">Inquiry Sent!</h2>
                            <p className="text-gray-600 dark:text-gray-300 mt-2">Thank you! Our corporate team will get in touch with you within 2 business days.</p>
                             <button onClick={() => onNavigate('services')} className="mt-6 px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700">Back to Services</button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4 mt-8">
                            <p className="text-sm text-gray-600 dark:text-gray-400">Fill out the form below to get started.</p>
                            <div><label className="block text-sm font-medium">Company Name</label><input type="text" className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700" required /></div>
                            <div><label className="block text-sm font-medium">Contact Person</label><input type="text" className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700" required /></div>
                            <div><label className="block text-sm font-medium">Contact Email</label><input type="email" className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700" required /></div>
                            <div className="flex justify-end pt-4"><button type="submit" className="px-6 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg">Submit Inquiry</button></div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CorporateTravelPage;
