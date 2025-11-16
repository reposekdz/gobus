import React from 'react';
import { Page } from './App';
import { TicketIcon } from './components/icons';

const mockEvents = [
    { name: 'Kigali Jazz Junction', date: 'Nov 5, 2024', location: 'Kigali', price: 25000, image: 'https://pbs.twimg.com/media/F2_1i5gWMAAS2Ab.jpg' },
    { name: 'Kwita Izina Gorilla Naming', date: 'Sep 2, 2024', location: 'Musanze', price: 0, image: 'https://www.rdb.rw/wp-content/uploads/2023/06/Rwanda-Development-Board-announces-the-return-of-the-19th-Kwita-Izina-Gorilla-Naming-Ceremony-scaled.jpg' },
    { name: 'Kivu Belt Fest', date: 'Dec 15, 2024', location: 'Rubavu', price: 15000, image: 'https://www.newtimes.co.rw/uploads/imported_images/files/main/articles/2023/12/11/1702283038_kivu-belt-music-festival.jpg' }
];

const EventTicketsPage: React.FC<{ onNavigate: (page: Page) => void }> = ({ onNavigate }) => {

    return (
        <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar pr-2">
            {mockEvents.map(event => (
                <div key={event.name} className="flex items-center space-x-3 bg-gray-100 dark:bg-gray-700/50 p-2 rounded-lg">
                    <img src={event.image} alt={event.name} className="w-24 h-16 object-cover rounded-md"/>
                    <div className="flex-grow">
                        <p className="font-bold">{event.name}</p>
                        <p className="text-xs text-gray-500">{event.location} - {event.date}</p>
                        <p className="font-semibold text-green-600">{event.price > 0 ? `${new Intl.NumberFormat('fr-RW').format(event.price)} RWF` : 'Free'}</p>
                    </div>
                    <button className="px-3 py-1 bg-blue-500 text-white text-xs rounded-md">Get Ticket</button>
                </div>
            ))}
        </div>
    );
};

export default EventTicketsPage;