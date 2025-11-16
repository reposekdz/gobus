import React, { useState } from 'react';
import { PhoneIcon, EnvelopeIcon, MapPinIcon, CalendarIcon, WalletIcon, TicketIcon, CameraIcon } from './components/icons';

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

const PassengerProfilePage: React.FC<{ passenger: any }> = ({ passenger }) => {
    const [status, setStatus] = useState(passenger?.status || 'Active');

    if (!passenger) {
        return <div className="p-8 text-center dark:text-white">Passenger data not found.</div>;
    }
    
    const memberSince = new Date(passenger.joinDate).toLocaleString('default', { month: 'long', year: 'numeric' });

    return (
        <div className="bg-gray-100/50 dark:bg-gray-900/50 min-h-full py-12">
            <div className="container mx-auto px-6 max-w-4xl">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
                    <div className="h-40 bg-green-600 relative group">
                        <img src={passenger.coverUrl || 'https://images.unsplash.com/photo-1619534103142-93b3f276c120?q=80&w=2070&auto=format&fit=crop'} alt="Cover" className="w-full h-full object-cover"/>
                        <div className="absolute inset-0 bg-black/30"></div>
                         <button className="absolute top-2 right-2 flex items-center text-xs bg-black/40 text-white px-2 py-1 rounded-full hover:bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity">
                            <CameraIcon className="w-4 h-4 mr-1"/> Edit Cover
                        </button>
                    </div>
                    <div className="px-6 pb-6">
                        <div className="flex flex-col sm:flex-row items-center -mt-16">
                            <div className="relative group">
                                <img src={passenger.avatarUrl} alt={passenger.name} className="w-32 h-32 rounded-full border-4 border-white dark:border-gray-800 object-cover"/>
                                <button className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                    <CameraIcon className="w-6 h-6"/>
                                </button>
                            </div>
                            <div className="sm:ml-6 mt-4 sm:mt-16 text-center sm:text-left flex-grow">
                                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">{passenger.name}</h1>
                                <div className="mt-2 flex justify-center sm:justify-start flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500 dark:text-gray-400">
                                    <span className="flex items-center"><EnvelopeIcon className="w-4 h-4 mr-1.5"/>{passenger.email}</span>
                                    <span className="flex items-center"><CalendarIcon className="w-4 h-4 mr-1.5"/>Joined {memberSince}</span>
                                </div>
                            </div>
                             <div className="mt-4 sm:mt-12">
                                <p className="text-xs text-gray-500">Account Status</p>
                                <div className="flex items-center space-x-2 bg-gray-200 dark:bg-gray-700 p-1 rounded-full">
                                    <button onClick={() => setStatus('Active')} className={`px-3 py-1 text-sm rounded-full ${status === 'Active' ? 'bg-white dark:bg-gray-900 shadow' : ''}`}>Active</button>
                                    <button onClick={() => setStatus('Suspended')} className={`px-3 py-1 text-sm rounded-full ${status === 'Suspended' ? 'bg-white dark:bg-gray-900 shadow' : ''}`}>Suspended</button>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="px-6 py-4 grid grid-cols-1 md:grid-cols-2 gap-4 border-y dark:border-gray-700">
                        <StatCard label="Wallet Balance" value={`${new Intl.NumberFormat('fr-RW').format(passenger.walletBalance)} RWF`} icon={<WalletIcon />} />
                        <StatCard label="Total Bookings" value={passenger.bookingHistory.length} icon={<TicketIcon />} />
                    </div>

                    <div className="p-6">
                         <h3 className="font-bold text-lg dark:text-white mb-4">Booking History</h3>
                         <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar pr-2">
                            {passenger.bookingHistory.length > 0 ? passenger.bookingHistory.map((booking) => (
                                <div key={booking.id} className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg flex justify-between items-center">
                                    <div>
                                        <p className="font-semibold text-sm dark:text-white">{booking.from} to {booking.to}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{booking.company} on {new Date(booking.date).toLocaleDateString()}</p>
                                    </div>
                                    <p className="font-semibold text-sm text-green-600 dark:text-green-400">{booking.price}</p>
                                </div>
                            )) : (
                                <p className="text-sm text-gray-500 dark:text-gray-400">No booking history found.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PassengerProfilePage;