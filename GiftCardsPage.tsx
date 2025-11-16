import React, { useState } from 'react';
import { Page } from './App';
import { CreditCardIcon } from './components/icons';

const GiftCardsPage: React.FC<{ onNavigate: (page: Page) => void }> = ({ onNavigate }) => {
    const [amount, setAmount] = useState('10000');
    const [recipientEmail, setRecipientEmail] = useState('');
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
                        <CreditCardIcon className="w-12 h-12 mx-auto text-yellow-500 mb-4" />
                        <h1 className="text-3xl font-bold dark:text-white">Give the Gift of Travel</h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-2">Purchase a gift card for friends and family.</p>
                    </div>
                    
                    {submitted ? (
                        <div className="text-center p-8">
                            <h2 className="text-xl font-semibold text-green-600">Gift Card Sent!</h2>
                            <p className="text-gray-600 dark:text-gray-300 mt-2">A {new Intl.NumberFormat('fr-RW').format(parseInt(amount))} RWF gift card has been sent to {recipientEmail}.</p>
                             <button onClick={() => onNavigate('services')} className="mt-6 px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700">Back to Services</button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4 mt-8">
                            <div>
                                <label className="block text-sm font-medium">Select Amount</label>
                                <div className="grid grid-cols-3 gap-2 mt-1">
                                    {['5000', '10000', '25000'].map(val => (
                                        <button key={val} type="button" onClick={() => setAmount(val)} className={`p-3 text-center rounded-lg border-2 ${amount === val ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'dark:border-gray-600'}`}>
                                            <p className="font-semibold">{new Intl.NumberFormat('fr-RW').format(parseInt(val))}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div><label className="block text-sm font-medium">Recipient's Email</label><input type="email" value={recipientEmail} onChange={e => setRecipientEmail(e.target.value)} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700" required /></div>
                            <div><label className="block text-sm font-medium">Personal Message (Optional)</label><textarea rows={2} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700" /></div>
                            <div className="flex justify-end pt-4"><button type="submit" className="px-6 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg">Purchase & Send</button></div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GiftCardsPage;
