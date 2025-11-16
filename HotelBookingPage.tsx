import React, { useState } from 'react';
import { Page } from './App';
import { BuildingStorefrontIcon, StarIcon } from './components/icons';

const mockHotels = {
    'Rubavu': [
        { name: 'Lake Kivu Serena Hotel', price: 150000, rating: 4.8, image: 'https://cf.bstatic.com/xdata/images/hotel/max1024x768/486241909.jpg?k=b4e930432c690184a7a85d38a1689a77382d7cf7d470087794017983652a65b0&o=&hp=1' },
        { name: 'Gorillas Lake Kivu Hotel', price: 80000, rating: 4.5, image: 'https://media-cdn.tripadvisor.com/media/photo-s/18/0b/4b/32/gorillas-lake-kivu-hotel.jpg' }
    ],
    'Musanze': [
        { name: 'Singita Kwitonda Lodge', price: 1200000, rating: 5.0, image: 'https://singita.com/wp-content/uploads/2019/11/Singita-Kwitonda-Lodge-Rwanda-Accommodation-Main-Lodge-Exterior-View-2021-1600x900.jpg' },
        { name: 'The Bishop\'s House', price: 250000, rating: 4.9, image: 'https://thebishopshouserwanda.com/wp-content/uploads/2018/07/IMG_9925-1030x687.jpg' }
    ]
}

const HotelBookingPage: React.FC<{ onNavigate: (page: Page) => void }> = ({ onNavigate }) => {
    const [destination, setDestination] = useState('');
    const [results, setResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setTimeout(() => {
            setResults(mockHotels[destination] || []);
            setIsLoading(false);
        }, 1000);
    };

    return (
        <div className="space-y-4">
            <form onSubmit={handleSearch} className="flex space-x-2">
                <input type="text" value={destination} onChange={e => setDestination(e.target.value)} placeholder="Enter destination city..." className="flex-grow p-2 border rounded-md dark:bg-gray-700" required />
                <button type="submit" className="px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg">Search Hotels</button>
            </form>
            <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar pr-2">
                {isLoading && <p>Searching...</p>}
                {results.map(hotel => (
                    <div key={hotel.name} className="flex items-center space-x-3 bg-gray-100 dark:bg-gray-700/50 p-2 rounded-lg">
                        <img src={hotel.image} alt={hotel.name} className="w-20 h-20 object-cover rounded-md"/>
                        <div className="flex-grow">
                            <p className="font-bold">{hotel.name}</p>
                            <div className="flex items-center text-sm"><StarIcon className="w-4 h-4 text-yellow-400 mr-1"/> {hotel.rating}</div>
                            <p className="font-semibold text-green-600">{new Intl.NumberFormat('fr-RW').format(hotel.price)} RWF / night</p>
                        </div>
                        <button className="px-3 py-1 bg-green-500 text-white text-xs rounded-md">Book</button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default HotelBookingPage;