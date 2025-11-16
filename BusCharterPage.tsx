import React, { useState, useEffect } from 'react';
import { Page } from './App';
import { ArrowRightIcon, CheckCircleIcon, ChevronRightIcon } from './components/icons';
import * as api from './services/apiService';

const STEPS = ['Select Company', 'Trip Details', 'Contact Info', 'Confirmation'];

const BusCharterPage: React.FC<{ onNavigate: (page: Page) => void }> = ({ onNavigate }) => {
    const [currentStep, setCurrentStep] = useState(1);
    const [companies, setCompanies] = useState<any[]>([]);
    const [charterRequest, setCharterRequest] = useState({
        companyId: '',
        companyName: '',
        from: '',
        to: '',
        departureDate: '',
        returnDate: '',
        passengers: 40,
        tripReason: '',
        name: '',
        phone: '',
        email: ''
    });

    useEffect(() => {
        const fetchCompanies = async () => {
            try {
                const data = await api.getCompanies();
                setCompanies(data);
            } catch (error) {
                console.error("Failed to fetch companies", error);
            }
        };
        fetchCompanies();
    }, []);
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setCharterRequest(prev => ({...prev, [name]: value}));
    };
    
    const handleNext = () => setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
    const handleBack = () => setCurrentStep(prev => Math.max(prev - 1, 1));
    const handleConfirm = () => {
        // Here you would typically send the data to a backend
        console.log('Charter Request Submitted:', charterRequest);
        handleNext();
    }

    const renderStepContent = () => {
        switch (currentStep) {
            case 1:
                return (
                    <div className="space-y-4">
                        <h3 className="font-semibold dark:text-white">Select a bus company for your charter</h3>
                        {companies.map(company => (
                             <button key={company._id} type="button" onClick={() => { setCharterRequest(r => ({...r, companyId: company._id, companyName: company.name})); handleNext(); }} className="w-full p-4 border-2 rounded-lg text-left flex items-center space-x-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors dark:border-gray-600">
                                <img src={company.logoUrl} alt={company.name} className="w-12 h-12 object-contain bg-gray-100 rounded-full p-1"/>
                                <span className="font-bold flex-grow text-lg dark:text-white">{company.name}</span>
                                <ChevronRightIcon className="w-6 h-6 text-gray-400"/>
                            </button>
                        ))}
                    </div>
                );
            case 2:
                return (
                     <div className="space-y-4">
                        <h3 className="font-semibold dark:text-white">Tell us about your trip</h3>
                         <div className="grid grid-cols-2 gap-4">
                            <div><label className="text-sm">From</label><input type="text" name="from" value={charterRequest.from} onChange={handleChange} className="w-full mt-1 p-2 border rounded-md dark:bg-gray-700" required/></div>
                            <div><label className="text-sm">To</label><input type="text" name="to" value={charterRequest.to} onChange={handleChange} className="w-full mt-1 p-2 border rounded-md dark:bg-gray-700" required/></div>
                         </div>
                         <div className="grid grid-cols-2 gap-4">
                            <div><label className="text-sm">Departure Date</label><input type="date" name="departureDate" value={charterRequest.departureDate} onChange={handleChange} className="w-full mt-1 p-2 border rounded-md dark:bg-gray-700" required/></div>
                            <div><label className="text-sm">Return Date</label><input type="date" name="returnDate" value={charterRequest.returnDate} onChange={handleChange} className="w-full mt-1 p-2 border rounded-md dark:bg-gray-700"/></div>
                         </div>
                         <div><label className="text-sm">Number of Passengers</label><input type="number" name="passengers" value={charterRequest.passengers} onChange={handleChange} className="w-full mt-1 p-2 border rounded-md dark:bg-gray-700" required/></div>
                         <div><label className="text-sm">Reason for Trip</label><textarea name="tripReason" value={charterRequest.tripReason} onChange={handleChange} rows={3} className="w-full mt-1 p-2 border rounded-md dark:bg-gray-700" placeholder="e.g., Wedding, Tourism, School Trip..."/></div>
                    </div>
                );
            case 3:
                return (
                     <div className="space-y-4">
                        <h3 className="font-semibold dark:text-white">Your Contact Information</h3>
                        <div><label className="text-sm">Full Name</label><input type="text" name="name" value={charterRequest.name} onChange={handleChange} className="w-full mt-1 p-2 border rounded-md dark:bg-gray-700" required/></div>
                        <div><label className="text-sm">Phone Number</label><input type="tel" name="phone" value={charterRequest.phone} onChange={handleChange} className="w-full mt-1 p-2 border rounded-md dark:bg-gray-700" required/></div>
                        <div><label className="text-sm">Email Address</label><input type="email" name="email" value={charterRequest.email} onChange={handleChange} className="w-full mt-1 p-2 border rounded-md dark:bg-gray-700" required/></div>
                    </div>
                );
            case 4:
                return (
                    <div className="text-center">
                        <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4"/>
                        <h2 className="text-2xl font-bold dark:text-white">Request Sent!</h2>
                        <p className="text-gray-500 dark:text-gray-400 mt-2">Thank you for your request. The company will contact you shortly with a quote and further details.</p>
                        <div className="mt-6 text-left bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                            <p><strong>Company:</strong> {charterRequest.companyName}</p>
                            <p><strong>Route:</strong> {charterRequest.from} to {charterRequest.to}</p>
                            <p><strong>Date:</strong> {charterRequest.departureDate}</p>
                            <p><strong>Passengers:</strong> {charterRequest.passengers}</p>
                        </div>
                    </div>
                );
        }
    }
    
    return (
        <div className="bg-gray-100/50 dark:bg-gray-900/50 min-h-screen py-12">
            <div className="container mx-auto px-6 max-w-2xl">
                <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl">
                    <h1 className="text-3xl font-bold dark:text-white mb-2">Bus Charter Request</h1>
                    {/* Stepper */}
                    <div className="flex items-center mb-8">
                        {STEPS.map((step, index) => (
                            <React.Fragment key={step}>
                                <div className="flex items-center">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${currentStep > index ? 'bg-green-500 text-white' : currentStep === index + 1 ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>
                                        {currentStep > index ? <CheckCircleIcon className="w-5 h-5"/> : index + 1}
                                    </div>
                                    <p className={`ml-2 text-sm font-semibold ${currentStep >= index + 1 ? 'text-gray-800 dark:text-white' : 'text-gray-400'}`}>{step}</p>
                                </div>
                                {index < STEPS.length - 1 && <div className="flex-auto border-t-2 mx-4 dark:border-gray-600"></div>}
                            </React.Fragment>
                        ))}
                    </div>

                    <div className="min-h-[350px]">{renderStepContent()}</div>

                    {/* Navigation */}
                    <div className="flex justify-between items-center mt-8 border-t dark:border-gray-700 pt-6">
                        {currentStep > 1 && currentStep < STEPS.length ? (
                            <button onClick={handleBack} className="px-6 py-2 border rounded-lg font-semibold dark:border-gray-600">Back</button>
                        ) : <div></div>}
                        
                        {currentStep < 3 && <button onClick={handleNext} className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700">Next</button>}
                        {currentStep === 3 && <button onClick={handleConfirm} className="px-6 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700">Submit Request</button>}
                        {currentStep === 4 && <button onClick={() => onNavigate('home')} className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700">Back to Home</button>}
                    </div>
                </div>
            </div>
        </div>
    )
};

export default BusCharterPage;