

import React, { useState, useEffect } from 'react';
import { ArrowRightIcon } from './icons';
import * as api from '../services/apiService';
import { useLanguage } from '../contexts/LanguageContext';

interface DestinationCardProps {
    dest: any;
    onSearch: (from: string, to: string) => void;
}

const DestinationCard: React.FC<DestinationCardProps> = ({ dest, onSearch }) => {
    const { t } = useLanguage();
    return (
        <div className="group relative rounded-2xl overflow-hidden shadow-lg h-96">
            <img src={dest.image_data_uri} alt={`Image of ${dest.to_location}`} className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"/>
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <h3 className="text-2xl font-bold">{dest.to_location}</h3>
                <p className="text-sm opacity-90">{t('destinations_from')} {dest.from_location}</p>
                <div className="mt-4 flex justify-between items-center">
                    <div>
                        <p className="text-xs">{t('destinations_price_from')}</p>
                        <p className="text-xl font-bold text-yellow-300">{new Intl.NumberFormat('fr-RW').format(dest.price)} RWF</p>
                    </div>
                    <button 
                        onClick={() => onSearch(dest.from_location, dest.to_location)} 
                        className="px-4 py-2 rounded-lg bg-yellow-400 text-blue-900 font-bold text-sm transition-transform transform group-hover:scale-105"
                    >
                        {t('destinations_book_now')}
                    </button>
                </div>
            </div>
        </div>
    )
};

interface FeaturedDestinationsProps {
    onSearch: (from?: string, to?: string) => void;
}

const FeaturedDestinations: React.FC<FeaturedDestinationsProps> = ({ onSearch }) => {
    const [destinations, setDestinations] = useState([]);
    const { t } = useLanguage();

    useEffect(() => {
        const fetchDestinations = async () => {
            try {
                const data = await api.getAllDestinations();
                setDestinations(data);
            } catch (error) {
                console.error("Failed to load featured destinations", error);
            }
        };
        fetchDestinations();
    }, []);

    return (
        <section>
            <div className="container mx-auto px-6">
                 <div className="text-center mb-12">
                    <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight sm:text-4xl">{t('destinations_title')}</h2>
                    <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-600 dark:text-gray-400">
                        {t('destinations_subtitle')}
                    </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {destinations.map(dest => (
                        <DestinationCard key={dest.id} dest={dest} onSearch={onSearch} />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default FeaturedDestinations;