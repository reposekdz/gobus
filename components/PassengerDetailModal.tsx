import React from 'react';
import { XIcon, TicketIcon, PhoneIcon, EnvelopeIcon } from './icons';
import Modal from './Modal';

const PassengerDetailModal = ({ passenger, onClose }) => {
  return (
    <Modal isOpen={true} onClose={onClose} title="Passenger Details">
        <div>
            <div className="flex items-center space-x-4 mb-4">
                <img src={`https://randomuser.me/api/portraits/men/${passenger.id}.jpg`} alt={passenger.name} className="w-16 h-16 rounded-full"/>
                <div>
                    <h3 className="text-xl font-bold dark:text-white">{passenger.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center"><EnvelopeIcon className="w-4 h-4 mr-2"/>{passenger.email}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center"><PhoneIcon className="w-4 h-4 mr-2"/>{passenger.phone}</p>
                </div>
            </div>
            <h4 className="font-semibold dark:text-gray-200 mb-2">Booking History with Us</h4>
            <div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar pr-2">
                {passenger.history.map(trip => (
                    <div key={trip.id} className="bg-gray-100 dark:bg-gray-700/50 p-3 rounded-lg">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="font-semibold text-sm dark:text-white">{trip.route}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Seat: {trip.seat} | {new Date(trip.date).toLocaleDateString()}</p>
                            </div>
                             <p className="text-xs font-mono text-gray-500 dark:text-gray-400">{trip.ticketId}</p>
                        </div>
                    </div>
                ))}
            </div>
             <div className="mt-6 flex justify-end">
                <button onClick={onClose} className="px-4 py-2 text-sm font-semibold border rounded-lg dark:border-gray-600">Close</button>
            </div>
        </div>
    </Modal>
  );
};

export default PassengerDetailModal;
