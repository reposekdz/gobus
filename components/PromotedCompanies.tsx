import React, { useState, useEffect } from 'react';
import * as api from '../services/apiService';
import { useLanguage } from '../contexts/LanguageContext';
import { ArrowRightIcon } from './icons';

const AdCard: React.FC<{ ad: any }> = ({ ad }) => (
    <a 
        href={ad.link_url} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="group relative block w-full h-80 rounded-2xl overflow-hidden shadow-2xl perspective"
        style={{ transformStyle: 'preserve-3d' }}
    >
        <div className="absolute inset-0 transform-gpu transition-transform duration-500 ease-out group-hover:scale-110">
            <img src={ad.image_data_uri} alt={ad.company_name} className="w-full h-full object-cover" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
        <div 
            className="absolute inset-0 p-6 flex flex-col justify-end transform-gpu transition-transform duration-500 ease-out group-hover:[transform:translateZ(40px)]"
            style={{ transformStyle: 'preserve-3d' }}
        >
            <h4 className="text-2xl font-bold text-white" style={{textShadow: '2px 2px 4px rgba(0,0,0,0.5)'}}>{ad.company_name}</h4>
            <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <ArrowRightIcon className="w-8 h-8 text-white bg-white/20 p-1.5 rounded-full" />
            </div>
        </div>
         <div className="absolute top-4 left-4 bg-yellow-400 text-blue-900 text-xs font-bold px-3 py-1 rounded-full shadow-md">
            Sponsored
        </div>
    </a>
);


const PromotedCompanies: React.FC = () => {
    const [ads, setAds] = useState([]);
    const { t } = useLanguage();

    useEffect(() => {
        const fetchAds = async () => {
            try {
                const { data } = await api.getActiveAds();
                setAds(data);
            } catch (error) {
                console.error("Failed to fetch promoted companies:", error);
            }
        };
        fetchAds();
    }, []);

    if (ads.length === 0) {
        return null; // Don't render the section if there are no active ads
    }

    return (
        <section className="bg-gray-50 dark:bg-gray-900">
            <div className="container mx-auto px-6">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight sm:text-4xl">{t('promoted_companies_title')}</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {ads.map(ad => (
                        <AdCard key={ad.id} ad={ad} />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default PromotedCompanies;