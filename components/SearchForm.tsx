import React, { useState, useEffect } from 'react';
import { apiService } from '../lib/api-services';
import { useLanguage } from '../contexts/LanguageContext';
import { MapPinIcon, CalendarIcon } from './icons';
import StationSelector from './StationSelector';

interface SearchFormProps {
  onResults: (trips: any[]) => void;
}

export const SearchForm: React.FC<SearchFormProps> = ({ onResults }) => {
  const [formData, setFormData] = useState({
    origin: '',
    destination: '',
    date: ''
  });
  const [loading, setLoading] = useState(false);
  const [destinations, setDestinations] = useState<any[]>([]);
  const { t } = useLanguage();

  useEffect(() => {
    const fetchDestinations = async () => {
      try {
        const response = await apiService.get('/destinations');
        if (response.data && response.data.destinations) {
          setDestinations(response.data.destinations);
        }
      } catch (error) {
        console.error('Failed to fetch destinations:', error);
      }
    };
    fetchDestinations();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.origin || !formData.destination || !formData.date) {
      alert(t('error_validation'));
      return;
    }

    setLoading(true);

    try {
      const response = await apiService.get(
        `/trips/search?origin=${encodeURIComponent(formData.origin)}&destination=${encodeURIComponent(formData.destination)}&date=${formData.date}`
      );
      onResults(response.data.trips || []);
    } catch (error) {
      console.error('Search failed:', error);
      alert(t('error_network'));
      onResults([]);
    } finally {
      setLoading(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <form onSubmit={handleSubmit} className="bg-white/95 backdrop-blur-lg p-8 rounded-3xl shadow-2xl border border-white/30 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-purple-50/30 to-pink-50/50 rounded-3xl"></div>
      <div className="relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <label className="block text-sm font-bold text-gray-800 mb-3">
              <MapPinIcon className="w-5 h-5 inline mr-2 text-blue-600" />
              {t('search_from')}
            </label>
            <StationSelector
              value={formData.origin}
              onChange={(value) => setFormData({...formData, origin: value})}
              placeholder={t('search_from_placeholder')}
              excludeStation={formData.destination}
            />
          </div>
          
          <div>
            <label className="block text-sm font-bold text-gray-800 mb-3">
              <MapPinIcon className="w-5 h-5 inline mr-2 text-blue-600" />
              {t('search_to')}
            </label>
            <StationSelector
              value={formData.destination}
              onChange={(value) => setFormData({...formData, destination: value})}
              placeholder={t('search_to_placeholder')}
              excludeStation={formData.origin}
            />
          </div>
          
          <div>
            <label className="block text-sm font-bold text-gray-800 mb-3">
              <CalendarIcon className="w-5 h-5 inline mr-2 text-blue-600" />
              {t('search_date')}
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({...formData, date: e.target.value})}
              min={today}
              className="w-full p-4 border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-sm hover:shadow-md text-gray-900 font-semibold bg-white"
              style={{ color: '#000000' }}
              required
            />
          </div>
          
          <div className="flex items-end">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white py-4 px-6 rounded-xl hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 disabled:opacity-50 transition-all shadow-xl transform hover:scale-105 font-bold flex items-center justify-center gap-2"
            >
              {loading ? t('search_loading') : t('search_button')}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
};
