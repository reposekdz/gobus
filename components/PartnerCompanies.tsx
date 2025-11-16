import React, { useState, useEffect } from 'react';
import type { Page } from '../App';
// FIX: Changed import to a named import as StarRating is not a default export.
import { StarRating } from './StarRating';
import { ArrowRightIcon } from './icons';
import * as api from '../services/apiService';


interface OurPartnersProps {
    navigate: (page: Page, data?: any) => void;
}

const PartnerCard: React.FC<{ partner: any; onSelect: () => void }> = ({ partner, onSelect }) => (
    <button 
        onClick={onSelect} 
        className="group relative block w-full h-80 rounded-2xl overflow-hidden shadow-2xl perspective"
        style={{ transformStyle: 'preserve-3d' }}
    >
        <div className="absolute inset-0 transform-gpu transition-transform duration-500 ease-out group-hover:scale-110">
            <img src={partner.cover_url} alt={partner.name} className="w-full h-full object-cover" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
        
        <div 
            className="absolute inset-0 p-6 flex flex-col justify-end transform-gpu transition-transform duration-500 ease-out group-hover:[transform:translateZ(40px)]"
            style={{ transformStyle: 'preserve-3d' }}
        >
            <div className="w-16 h-16 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-md border-2 border-white/30 mb-4">
                <img src={partner.logo_url} alt={`${partner.name} logo`} className="w-12 h-12 object-contain"/>
            </div>
            <h4 className="text-2xl font-bold text-white" style={{textShadow: '2px 2px 4px rgba(0,0,0,0.5)'}}>{partner.name}</h4>
            <div className="flex items-center mt-2 space-x-2">
                <StarRating rating={4.5} />
                <span className="text-sm text-gray-300">(100+ reviews)</span>
            </div>
            
            <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <ArrowRightIcon className="w-8 h-8 text-white bg-white/20 p-1.5 rounded-full" />
            </div>
        </div>
    </button>
);


const OurPartners: React.FC<OurPartnersProps> = ({ navigate }) => {
  const [partners, setPartners] = useState([]);

  useEffect(() => {
    const fetchPartners = async () => {
        try {
            const data = await api.getCompanies();
            // Show top 4 partners on the home page
            setPartners(data.slice(0, 4));
        } catch (error) {
            console.error("Failed to fetch partners:", error);
        }
    };
    fetchPartners();
  }, []);

  return (
    <section className="bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight sm:text-4xl">Our Trusted Partners</h2>
           <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-600 dark:text-gray-400">
            Click a company to learn more about their routes and fleet.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {partners.map(partner => (
            <PartnerCard key={partner.id} partner={partner} onSelect={() => navigate('companyProfile', { id: partner.id, name: partner.name, logoText: partner.name.substring(0,4).toUpperCase() })} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default OurPartners;
