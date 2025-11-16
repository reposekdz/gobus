import React from 'react';
import { Page } from './App';
import { MapIcon } from './components/icons';

const mockTours = [
    { title: "Gorilla Trekking Express", description: "A round trip from Kigali to Musanze, including park entry coordination.", image: 'https://www.andbeyond.com/wp-content/uploads/sites/5/one-of-the-reasons-to-visit-rwanda-gorilla.jpg' },
    { title: "Akagera Safari Shuttle", description: "Travel comfortably to Akagera National Park for a day trip to see the Big Five.", image: 'https://akageranationalpark.org/wp-content/uploads/2021/04/Lions-in-Akagera-National-Park.jpg' },
    { title: "Kivu Lakeside Weekender", description: "Enjoy a relaxing weekend by the beautiful shores of Lake Kivu in Rubavu.", image: 'https://images.unsplash.com/photo-1590632313655-e9c5220c4273?q=80&w=2070&auto=format&fit=crop' }
];

const TourPackagesPage: React.FC<{ onNavigate: (page: Page) => void }> = ({ onNavigate }) => {
    return (
        <div className="bg-gray-100/50 dark:bg-gray-900/50 min-h-screen py-12">
            <div className="container mx-auto px-6">
                <div className="text-center mb-12">
                    <MapIcon className="w-12 h-12 mx-auto text-blue-500 mb-4" />
                    <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white">Discover Rwanda with Us</h1>
                    <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-600 dark:text-gray-400">
                        Explore curated tour packages with reliable transportation included.
                    </p>
                </div>

                <div className="space-y-8">
                    {mockTours.map(tour => (
                        <div key={tour.title} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden flex flex-col md:flex-row">
                            <img src={tour.image} alt={tour.title} className="w-full md:w-1/3 h-48 md:h-auto object-cover" />
                            <div className="p-6 flex flex-col justify-between">
                                <div>
                                    <h3 className="text-2xl font-bold dark:text-white">{tour.title}</h3>
                                    <p className="text-gray-600 dark:text-gray-400 mt-2">{tour.description}</p>
                                </div>
                                <button onClick={() => alert('Inquiry form would open here.')} className="mt-4 px-5 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 self-start">
                                    Inquire Now
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default TourPackagesPage;
