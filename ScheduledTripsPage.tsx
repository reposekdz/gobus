import React, { useState } from 'react';
import { ClockIcon, PlusIcon, PencilSquareIcon, TrashIcon, MapPinIcon, CalendarIcon, ArrowRightIcon } from './components/icons';

interface ScheduledTrip {
    id: number;
    from: string;
    to: string;
    departureTime: string;
    days: string[];
    company: string;
}

const initialScheduledTrips: ScheduledTrip[] = [
    { id: 1, from: 'Kigali', to: 'Huye', departureTime: '06:30', days: ['Mon', 'Wed', 'Fri'], company: 'Volcano Express' },
    { id: 2, from: 'Gitarama', to: 'Kigali', departureTime: '07:00', days: ['Tue', 'Thu'], company: 'RITCO' },
];

const dayMap = { 'Mon': 'Mbere', 'Tue': 'Biri', 'Wed': 'Tatu', 'Thu': 'Kane', 'Fri': 'Tanu', 'Sat': 'Gatandatu', 'Sun': 'Cyumweru' };

interface ScheduleFormModalProps {
    trip: ScheduledTrip | null;
    onClose: () => void;
    onSave: (trip: Omit<ScheduledTrip, 'id'>) => void;
}

const ScheduleFormModal: React.FC<ScheduleFormModalProps> = ({ trip, onClose, onSave }) => {
    const [formData, setFormData] = useState(trip || { from: '', to: '', departureTime: '07:00', days: [], company: 'Volcano Express' });

    const handleDayToggle = (day: string) => {
        setFormData(prev => ({
            ...prev,
            days: prev.days.includes(day) ? prev.days.filter(d => d !== day) : [...prev.days, day]
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
         <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-6 max-w-lg w-full">
                <h2 className="text-xl font-bold mb-4 dark:text-white">{trip ? 'Hindura Urugendo Ruteganijwe' : 'Ongeramo Urugendo Ruteganijwe'}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <input type="text" placeholder="Uva" value={formData.from} onChange={e => setFormData({...formData, from: e.target.value})} className="p-2 border rounded-md dark:bg-gray-700" required />
                        <input type="text" placeholder="Ujya" value={formData.to} onChange={e => setFormData({...formData, to: e.target.value})} className="p-2 border rounded-md dark:bg-gray-700" required />
                    </div>
                    <div>
                        <label className="text-sm">Isaha yo guhaguruka</label>
                        <input type="time" value={formData.departureTime} onChange={e => setFormData({...formData, departureTime: e.target.value})} className="w-full p-2 border rounded-md dark:bg-gray-700" required />
                    </div>
                    <div>
                        <label className="text-sm">Icyumweru</label>
                        <div className="flex space-x-1 mt-1">
                            {Object.keys(dayMap).map(day => (
                                <button type="button" key={day} onClick={() => handleDayToggle(day)} className={`w-10 h-10 rounded-md text-xs font-semibold ${formData.days.includes(day) ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>{dayMap[day]}</button>
                            ))}
                        </div>
                    </div>
                     <div className="flex justify-end space-x-4 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg">Bireke</button>
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg">Bika</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

interface ScheduledTripsPageProps {
  onSearch: (from: string, to: string) => void;
}

const ScheduledTripsPage: React.FC<ScheduledTripsPageProps> = ({ onSearch }) => {
    const [trips, setTrips] = useState(initialScheduledTrips);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTrip, setEditingTrip] = useState<ScheduledTrip | null>(null);

    const handleSave = (tripData: Omit<ScheduledTrip, 'id'>) => {
        if (editingTrip) {
            setTrips(trips.map(t => t.id === editingTrip.id ? { ...editingTrip, ...tripData } : t));
        } else {
            setTrips([...trips, { ...tripData, id: Date.now() }]);
        }
        setIsModalOpen(false);
        setEditingTrip(null);
    };

    const handleDelete = (id: number) => {
        if (window.confirm("Urifuza gusiba uru rugendo?")) {
            setTrips(trips.filter(t => t.id !== id));
        }
    };

    return (
        <div className="bg-gray-100/50 dark:bg-gray-900/50 min-h-full py-12">
            <div className="container mx-auto px-6">
                 <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Ingendo ziteganijwe</h1>
                    <button onClick={() => { setEditingTrip(null); setIsModalOpen(true); }} className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition">
                        <PlusIcon className="w-5 h-5 mr-2" /> Ongeramo
                    </button>
                </div>

                <div className="space-y-4">
                    {trips.map(trip => (
                        <div key={trip.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md flex flex-col sm:flex-row justify-between items-start sm:items-center">
                            <div className="flex-grow">
                                <div className="flex items-center space-x-2 text-lg font-bold">
                                    <MapPinIcon className="w-5 h-5 text-gray-400"/>
                                    <span className="dark:text-white">{trip.from}</span>
                                    <ArrowRightIcon className="w-4 h-4 text-gray-400"/>
                                    <span className="dark:text-white">{trip.to}</span>
                                </div>
                                <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400 mt-2">
                                    <div className="flex items-center"><ClockIcon className="w-4 h-4 mr-1"/>{trip.departureTime}</div>
                                    <div className="flex items-center"><CalendarIcon className="w-4 h-4 mr-1"/>{trip.days.map(d => dayMap[d]).join(', ')}</div>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2 mt-4 sm:mt-0">
                                <button onClick={() => onSearch(trip.from, trip.to)} className="px-4 py-2 text-sm bg-yellow-400 text-blue-900 font-semibold rounded-md hover:bg-yellow-500">Kata Itike</button>
                                <button onClick={() => { setEditingTrip(trip); setIsModalOpen(true); }} className="p-2 text-gray-500 hover:text-blue-600"><PencilSquareIcon className="w-5 h-5"/></button>
                                <button onClick={() => handleDelete(trip.id)} className="p-2 text-gray-500 hover:text-red-600"><TrashIcon className="w-5 h-5"/></button>
                            </div>
                        </div>
                    ))}
                </div>
                {trips.length === 0 && (
                    <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-lg">
                        <h2 className="text-xl font-bold">Nta ngendo ziteganijwe</h2>
                        <p className="text-gray-500 mt-2">Kanda "Ongeramo" kugirango utangire.</p>
                    </div>
                )}
            </div>
            {isModalOpen && <ScheduleFormModal trip={editingTrip} onClose={() => setIsModalOpen(false)} onSave={handleSave} />}
        </div>
    );
};

export default ScheduledTripsPage;
