import React, { useState, useEffect } from 'react';
import { CalendarIcon, UserGroupIcon, MapPinIcon, ArrowsRightLeftIcon } from './icons';
import { useLanguage } from '../contexts/LanguageContext';
import StationSelector from './StationSelector';
import * as api from '../services/apiService';

interface BookingFormProps {
  onSearch: (from?: string, to?: string, date?: string, passengers?: { adults: number; children: number; }) => void;
}

const BookingForm: React.FC<BookingFormProps> = ({ onSearch }) => {
  const [tripType, setTripType] = useState<'oneWay' | 'roundTrip'>('oneWay');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [showPassengerDropdown, setShowPassengerDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { t } = useLanguage();

  const swapCities = () => {
    const temp = from;
    setFrom(to);
    setTo(temp);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!from || !to || !departureDate) {
      alert(t('error_validation'));
      return;
    }

    if (from.toLowerCase() === to.toLowerCase()) {
      alert('Ahantu utangirira n\'ahageze ntabwo bishobora kuba kimwe');
      return;
    }

    setIsLoading(true);
    
    try {
      const passengers = { adults, children };
      onSearch(from, to, departureDate, passengers);
    } catch (error) {
      console.error('Search failed:', error);
      alert(t('error_network'));
    } finally {
      setIsLoading(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];
  const maxDate = new Date();
  maxDate.setMonth(maxDate.getMonth() + 6);
  const maxDateStr = maxDate.toISOString().split('T')[0];

  return (
    <div className="bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl p-8 md:p-10 border border-white/30 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-purple-50/30 to-pink-50/50 rounded-3xl"></div>
      <div className="relative z-10">
        <div className="flex mb-8 bg-gradient-to-r from-gray-100 to-gray-50 rounded-xl p-1.5 shadow-inner">
          <button
            type="button"
            onClick={() => setTripType('oneWay')}
            className={`flex-1 py-3 px-6 rounded-lg text-sm font-bold transition-all duration-300 ${
              tripType === 'oneWay'
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg transform scale-105'
                : 'text-gray-700 hover:text-gray-900'
            }`}
          >
            {t('trip_one_way')}
          </button>
          <button
            type="button"
            onClick={() => setTripType('roundTrip')}
            className={`flex-1 py-3 px-6 rounded-lg text-sm font-bold transition-all duration-300 ${
              tripType === 'roundTrip'
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg transform scale-105'
                : 'text-gray-700 hover:text-gray-900'
            }`}
          >
            {t('trip_round_trip')}
          </button>
        </div>

        <form onSubmit={handleSearch} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
            <div className="relative">
              <label className="block text-sm font-bold text-gray-800 mb-3">
                <MapPinIcon className="w-5 h-5 inline mr-2 text-blue-600" />
                {t('search_from')}
              </label>
              <StationSelector
                value={from}
                onChange={setFrom}
                placeholder={t('search_from_placeholder')}
                excludeStation={to}
              />
            </div>

            <div className="hidden md:flex absolute left-1/2 top-10 transform -translate-x-1/2 z-20">
              <button
                type="button"
                onClick={swapCities}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-3 rounded-full hover:from-blue-700 hover:to-indigo-700 transition-all shadow-xl transform hover:scale-110 hover:rotate-180 duration-300"
              >
                <ArrowsRightLeftIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="relative">
              <label className="block text-sm font-bold text-gray-800 mb-3">
                <MapPinIcon className="w-5 h-5 inline mr-2 text-blue-600" />
                {t('search_to')}
              </label>
              <StationSelector
                value={to}
                onChange={setTo}
                placeholder={t('search_to_placeholder')}
                excludeStation={from}
              />
            </div>
          </div>

          <div className="md:hidden flex justify-center">
            <button
              type="button"
              onClick={swapCities}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-3 rounded-full hover:from-blue-700 hover:to-indigo-700 transition-all shadow-xl transform hover:scale-110 hover:rotate-180 duration-300"
            >
              <ArrowsRightLeftIcon className="w-5 h-5" />
            </button>
          </div>

          <div className={`grid grid-cols-1 ${tripType === 'roundTrip' ? 'md:grid-cols-2' : ''} gap-6`}>
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-3">
                <CalendarIcon className="w-5 h-5 inline mr-2 text-blue-600" />
                {t('search_date_departure')}
              </label>
              <input
                type="date"
                value={departureDate}
                onChange={(e) => setDepartureDate(e.target.value)}
                min={today}
                max={maxDateStr}
                className="w-full p-4 border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-sm hover:shadow-md text-gray-900 font-semibold bg-white"
                style={{ color: '#000000' }}
                required
              />
            </div>

            {tripType === 'roundTrip' && (
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-3">
                  <CalendarIcon className="w-5 h-5 inline mr-2 text-blue-600" />
                  {t('search_date_return')}
                </label>
                <input
                  type="date"
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  min={departureDate || today}
                  max={maxDateStr}
                  className="w-full p-4 border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-sm hover:shadow-md text-gray-900 font-semibold bg-white"
                  style={{ color: '#000000' }}
                  required={tripType === 'roundTrip'}
                />
              </div>
            )}
          </div>

          <div className="relative">
            <label className="block text-sm font-bold text-gray-800 mb-3">
              <UserGroupIcon className="w-5 h-5 inline mr-2 text-blue-600" />
              {t('search_passengers')}
            </label>
            <button
              type="button"
              onClick={() => setShowPassengerDropdown(!showPassengerDropdown)}
              className="w-full p-4 border-2 border-gray-300 rounded-xl text-left focus:ring-4 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-sm hover:shadow-md text-gray-900 font-semibold bg-white"
              style={{ color: '#000000' }}
            >
              {adults} {t('passenger_adult')}{adults !== 1 ? 's' : ''}{children > 0 && `, ${children} ${t('passenger_children')}`}
            </button>

            {showPassengerDropdown && (
              <div className="absolute z-30 w-full mt-2 bg-white border-2 border-blue-200 rounded-xl shadow-2xl p-6 backdrop-blur-sm">
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-gray-800">{t('passenger_adults')}</span>
                    <div className="flex items-center space-x-3">
                      <button
                        type="button"
                        onClick={() => setAdults(Math.max(1, adults - 1))}
                        className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-100 to-blue-200 flex items-center justify-center hover:from-blue-200 hover:to-blue-300 transition-all shadow-md hover:shadow-lg transform hover:scale-110 text-gray-900 font-bold"
                      >
                        -
                      </button>
                      <span className="w-10 text-center font-bold text-gray-900">{adults}</span>
                      <button
                        type="button"
                        onClick={() => setAdults(Math.min(9, adults + 1))}
                        className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-100 to-blue-200 flex items-center justify-center hover:from-blue-200 hover:to-blue-300 transition-all shadow-md hover:shadow-lg transform hover:scale-110 text-gray-900 font-bold"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-gray-800">{t('passenger_children')}</span>
                    <div className="flex items-center space-x-3">
                      <button
                        type="button"
                        onClick={() => setChildren(Math.max(0, children - 1))}
                        className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-100 to-blue-200 flex items-center justify-center hover:from-blue-200 hover:to-blue-300 transition-all shadow-md hover:shadow-lg transform hover:scale-110 text-gray-900 font-bold"
                      >
                        -
                      </button>
                      <span className="w-10 text-center font-bold text-gray-900">{children}</span>
                      <button
                        type="button"
                        onClick={() => setChildren(Math.min(9, children + 1))}
                        className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-100 to-blue-200 flex items-center justify-center hover:from-blue-200 hover:to-blue-300 transition-all shadow-md hover:shadow-lg transform hover:scale-110 text-gray-900 font-bold"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPassengerDropdown(false)}
                  className="w-full mt-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg font-bold"
                >
                  {t('common_confirm')}
                </button>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white py-5 px-8 rounded-xl font-bold text-lg hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 focus:ring-4 focus:ring-blue-300 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-2xl hover:shadow-3xl relative overflow-hidden"
          >
            <span className="relative z-10">
              {isLoading ? t('search_loading') : t('search_button')}
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full hover:translate-x-full transition-transform duration-1000"></div>
          </button>
        </form>
      </div>
    </div>
  );
};

export default BookingForm;
