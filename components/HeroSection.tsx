import React, { useState, useEffect } from 'react';
import BookingForm from './BookingForm';
import AITripPlanner from './AITripPlanner';
import { SparklesIcon, ArrowRightIcon } from './icons';
import { useLanguage } from '../contexts/LanguageContext';
import * as api from '../services/apiService';

interface HeroSectionProps {
  onSearch: (from?: string, to?: string, date?: string, passengers?: { adults: number; children: number; }) => void;
}

const HeroSection: React.FC<HeroSectionProps> = ({ onSearch }) => {
  const [showAiPlanner, setShowAiPlanner] = useState(false);
  const { t } = useLanguage();
  const [heroImage, setHeroImage] = useState("url('https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?q=80&w=2048&auto=format&fit=crop')");

  useEffect(() => {
    const fetchHeroImage = async () => {
        try {
            const res = await api.getSetting('hero_image');
            if (res.data && res.data.setting_value) {
                setHeroImage(`url('${res.data.setting_value}')`);
            }
        } catch (e) {
            console.error("Failed to load hero image, using default.", e);
        }
    };
    fetchHeroImage();
  }, []);

  return (
    <>
      <section className="relative h-[90vh] min-h-[700px] md:min-h-[600px] flex items-center justify-center text-white">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: heroImage }}></div>
        <div className="absolute inset-0 bg-gradient-to-t from-blue-900/80 to-green-900/40 z-10"></div>
        <div className="relative z-20 container mx-auto px-4 sm:px-6 text-center">
            <div className="bg-gradient-to-br from-white/20 to-white/0 backdrop-blur-xl rounded-2xl shadow-2xl p-6 md:p-8 max-w-4xl mx-auto border border-white/20">
                <h1 className="text-3xl md:text-5xl font-extrabold mb-4 text-shadow-lg tracking-tight">{t('hero_title')}</h1>
                <p className="text-md md:text-lg font-light mb-8 max-w-2xl mx-auto">
                  {t('hero_subtitle')}
                </p>
                <BookingForm onSearch={(from, to, date, passengers) => onSearch(from, to, date, passengers)} />
          </div>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
             <button 
              onClick={() => setShowAiPlanner(true)}
              className="group w-full sm:w-auto flex items-center justify-center px-6 py-3 rounded-full bg-white/10 border-2 border-transparent text-white font-bold text-lg hover:bg-white/20 transform hover:scale-105 transition-all duration-300 shadow-lg backdrop-blur-sm"
            >
              <SparklesIcon className="w-6 h-6 mr-2 text-yellow-300 transition-transform group-hover:rotate-12" />
              {t('hero_ai_button')}
               <ArrowRightIcon className="w-5 h-5 ml-2 transform transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>
      </section>
      {showAiPlanner && <AITripPlanner onClose={() => setShowAiPlanner(false)} onPlanTrip={onSearch} />}
    </>
  );
};

export default HeroSection;