

import React from 'react';
import { TagIcon, ArrowRightIcon } from './icons';
import { useLanguage } from '../contexts/LanguageContext';

const SpecialOffers = ({ onSearch }) => {
    const { t } = useLanguage();
    
    const offers = [
        {
            title: t('offer1_title'),
            company: "Volcano Express",
            description: t('offer1_desc'),
            code: "WEEKEND10",
            bgGradient: "from-yellow-400 to-orange-500"
        },
        {
            title: t('offer2_title'),
            company: "RITCO",
            description: t('offer2_desc'),
            code: "STUDENT15",
            bgGradient: "from-blue-400 to-indigo-500"
        },
        {
            title: t('offer3_title'),
            company: "Horizon Express",
            description: t('offer3_desc'),
            code: "EARLYBIRD5",
            bgGradient: "from-green-400 to-teal-500"
        }
    ];

    return (
        <section>
            <div className="container mx-auto px-6">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight sm:text-4xl">{t('offers_title')}</h2>
                    <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-600 dark:text-gray-400">
                        {t('offers_subtitle')}
                    </p>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {offers.map((offer, index) => (
                        <div key={index} className={`relative rounded-2xl shadow-xl overflow-hidden text-white p-8 flex flex-col justify-between h-72 group bg-gradient-to-br ${offer.bgGradient}`}>
                             <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors duration-300"></div>
                             <div className="relative z-10">
                                 <div className="flex items-center space-x-2 mb-2 opacity-80">
                                     <TagIcon className="w-5 h-5"/>
                                     <p className="font-bold">{offer.company}</p>
                                 </div>
                                 <h3 className="text-3xl font-bold leading-tight">{offer.title}</h3>
                             </div>
                             <div className="relative z-10">
                                 <p className="text-sm opacity-90 mb-4">{offer.description}</p>
                                 <button onClick={() => onSearch()} className="w-full flex items-center justify-center px-5 py-3 rounded-lg bg-white/20 backdrop-blur-sm font-bold hover:bg-white/30 transition-colors duration-300 transform group-hover:scale-105">
                                    {t('offers_button')} <ArrowRightIcon className="w-5 h-5 ml-2"/>
                                 </button>
                             </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default SpecialOffers;