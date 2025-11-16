import React, { useState } from 'react';
import { Page } from './App';
import { ArrowRightIcon, CheckCircleIcon, ChevronRightIcon, UserCircleIcon } from './components/icons';
import * as api from './services/apiService';

const STEPS = ['Package Details', 'Select Schedule', 'Recipient Info', 'Confirmation'];

const PackageDeliveryPage: React.FC<{ onNavigate: (page: Page) => void }> = ({ onNavigate }) => {
    const [currentStep, setCurrentStep] = useState(1);
    const [packageDetails, setPackageDetails] = useState({ from: 'Kigali', to: 'Huye', size: 'medium', weight: 5 });
    const [selectedSchedule, setSelectedSchedule] = useState<any>(null);
    const [recipient, setRecipient] = useState({ name: '', phone: '' });
    const [trackingId, setTrackingId] = useState('');

    const packageOptions = {
        small: { label: 'Small Envelope', pricePerKg: 200, base: 500 },
        medium: { label: 'Medium Box', pricePerKg: 300, base: 1000 },
        large: { label: 'Large Box', pricePerKg: 400, base: 2000 },
    };

    const calculatedPrice = packageOptions[packageDetails.size].base + packageDetails.weight * packageOptions[packageDetails.size].pricePerKg;

    // In a real app, this would be fetched based on the route from packageDetails
    const mockSchedules = [
        { id: 1, company: 'Volcano Express', departure: '08:00', arrival: '10:30', price: calculatedPrice, trip_id: 1 },
        { id: 2, company: 'RITCO', departure: '09:30', arrival: '12:00', price: calculatedPrice * 0.95, trip_id: 2 },
    ];
    
    const handleNext = () => setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
    const handleBack = () => setCurrentStep(prev => Math.max(prev - 1, 1));
    
    const handleConfirm = async () => {
        try {
            const payload = {
                ...packageDetails,
                price: selectedSchedule.price,
                recipient_name: recipient.name,
                recipient_phone: recipient.phone,
                trip_id: selectedSchedule.trip_id,
                origin: packageDetails.from,
                destination: packageDetails.to,
                package_size: packageDetails.size,
                weight_kg: packageDetails.weight
            };
            const result = await api.createPackageRequest(payload);
            setTrackingId(result.tracking_id);
            handleNext();
        } catch (error: any) {
            alert(`Failed to create package request: ${error.message}`);
        }
    }

    const renderStepContent = () => {
        switch (currentStep) {
            case 1:
                return (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div><label className="text-sm">From</label><input type="text" value={packageDetails.from} onChange={e => setPackageDetails(p => ({...p, from: e.target.value}))} className="w-full mt-1 p-2 border rounded-md dark:bg-gray-700" /></div>
                            <div><label className="text-sm">To</label><input type="text" value={packageDetails.to} onChange={e => setPackageDetails(p => ({...p, to: e.target.value}))} className="w-full mt-1 p-2 border rounded-md dark:bg-gray-700" /></div>
                        </div>
                        <div>
                            <label className="text-sm">Package Size</label>
                            <div className="grid grid-cols-3 gap-2 mt-1">
                                {Object.entries(packageOptions).map(([key, {label}]) => (
                                    <button key={key} type="button" onClick={() => setPackageDetails(p => ({...p, size: key}))} className={`p-3 text-center rounded-lg border-2 ${packageDetails.size === key ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'dark:border-gray-600'}`}>
                                        <p className="font-semibold text-sm">{label}</p>
                                    </button>
                                ))}
                            </div>
                        </div>
                         <div>
                            <label className="text-sm">Weight (kg)</label>
                            <input type="number" value={packageDetails.weight} onChange={e => setPackageDetails(p => ({...p, weight: Number(e.target.value)}))} className="w-full mt-1 p-2 border rounded-md dark:bg-gray-700" />
                        </div>
                        <div className="text-right font-bold text-xl dark:text-white">Estimated Price: <span className="text-green-600">{new Intl.NumberFormat('fr-RW').format(calculatedPrice)} RWF</span></div>
                    </div>
                );
            case 2:
                return (
                    <div className="space-y-3">
                        <h3 className="font-semibold dark:text-white">Select a bus for your package on {packageDetails.from} to {packageDetails.to}</h3>
                        {mockSchedules.map(schedule => (
                            <button key={schedule.id} onClick={() => setSelectedSchedule(schedule)} className={`w-full p-4 border-2 rounded-lg text-left flex justify-between items-center ${selectedSchedule?.id === schedule.id ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'dark:border-gray-600'}`}>
                                <div>
                                    <p className="font-bold">{schedule.company}</p>
                                    <p className="text-sm text-gray-500">{schedule.departure} - {schedule.arrival}</p>
                                </div>
                                <p className="font-bold text-green-600">{new Intl.NumberFormat('fr-RW').format(schedule.price)} RWF</p>
                            </button>
                        ))}
                    </div>
                );
            case 3:
                return (
                     <div className="space-y-4">
                        <h3 className="font-semibold dark:text-white">Recipient's Information</h3>
                        <div><label className="text-sm">Full Name</label><input type="text" value={recipient.name} onChange={e => setRecipient(r => ({...r, name: e.target.value}))} className="w-full mt-1 p-2 border rounded-md dark:bg-gray-700" /></div>
                        <div><label className="text-sm">Phone Number</label><input type="tel" value={recipient.phone} onChange={e => setRecipient(r => ({...r, phone: e.target.value}))} className="w-full mt-1 p-2 border rounded-md dark:bg-gray-700" /></div>
                    </div>
                );
            case 4:
                return (
                    <div className="text-center">
                        <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4"/>
                        <h2 className="text-2xl font-bold dark:text-white">Booking Confirmed!</h2>
                        <p className="text-gray-500 dark:text-gray-400 mt-2">Your package is ready to be shipped.</p>
                        <div className="mt-6 text-left bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                            <p className="font-bold text-lg text-center mb-4">Tracking ID: <span className="text-blue-600 font-mono">{trackingId}</span></p>
                            <p><strong>Route:</strong> {packageDetails.from} to {packageDetails.to}</p>
                            <p><strong>Carrier:</strong> {selectedSchedule.company} ({selectedSchedule.departure})</p>
                            <p><strong>Recipient:</strong> {recipient.name} ({recipient.phone})</p>
                            <p><strong>Total Paid:</strong> {new Intl.NumberFormat('fr-RW').format(selectedSchedule.price)} RWF</p>
                        </div>
                    </div>
                );
        }
    }
    
    return (
        <div className="bg-gray-100/50 dark:bg-gray-900/50 min-h-screen py-12">
            <div className="container mx-auto px-6 max-w-2xl">
                <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl">
                    <h1 className="text-3xl font-bold dark:text-white mb-2">Package Delivery</h1>
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

export default PackageDeliveryPage;
