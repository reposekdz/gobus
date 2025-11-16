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
    <div className="bg-white/80 backdrop-blur-2xl rounded-3xl shadow-[0_20px_80px_rgba(0,0,0,0.25)] p-4 sm:p-6 md:p-8 lg:p-10 border border-white/40 relative overflow-hidden transform transition-all duration-500 hover:shadow-[0_25px_100px_rgba(0,0,0,0.35)]">
      {/* Advanced Multi-layer Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-purple-600/15 to-pink-500/20 rounded-3xl opacity-80"></div>
      <div className="absolute inset-0 bg-gradient-to-tr from-cyan-400/10 via-indigo-500/15 to-fuchsia-600/10 rounded-3xl animate-pulse"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.15),transparent_50%)]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.15),transparent_50%)]"></div>
      
      {/* Animated Gradient Border */}
      <div className="absolute inset-[-2px] bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-3xl opacity-20 blur-sm animate-pulse"></div>
      
      <div className="relative z-10">
        {/* Trip Type Selector - Ultra Responsive */}
        <div className="flex flex-col sm:flex-row mb-6 sm:mb-8 bg-gradient-to-r from-gray-100/90 via-blue-50/50 to-purple-50/50 rounded-2xl p-1.5 shadow-inner backdrop-blur-sm">
          <button
            type="button"
            onClick={() => setTripType('oneWay')}
            className={`flex-1 py-3 sm:py-3.5 px-4 sm:px-6 rounded-xl text-xs sm:text-sm font-bold transition-all duration-500 transform ${
              tripType === 'oneWay'
                ? 'bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white shadow-2xl scale-105 hover:scale-110'
                : 'text-gray-700 hover:text-gray-900 hover:bg-white/60'
            } mb-1.5 sm:mb-0 sm:mr-1.5 relative overflow-hidden group`}
          >
            <span className="relative z-10">{t('trip_one_way')}</span>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
          </button>
          <button
            type="button"
            onClick={() => setTripType('roundTrip')}
            className={`flex-1 py-3 sm:py-3.5 px-4 sm:px-6 rounded-xl text-xs sm:text-sm font-bold transition-all duration-500 transform ${
              tripType === 'roundTrip'
                ? 'bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white shadow-2xl scale-105 hover:scale-110'
                : 'text-gray-700 hover:text-gray-900 hover:bg-white/60'
            } relative overflow-hidden group`}
          >
            <span className="relative z-10">{t('trip_round_trip')}</span>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
          </button>
        </div>

        <form onSubmit={handleSearch} className="space-y-4 sm:space-y-5 md:space-y-6">
          {/* From/To Section - Ultra Responsive Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 md:gap-6 relative">
            <div className="relative group">
              <label className="block text-xs sm:text-sm font-bold text-gray-900 mb-2 sm:mb-3 flex items-center">
                <div className="p-1.5 sm:p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg mr-2 shadow-md group-hover:shadow-lg transition-all">
                  <MapPinIcon className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                </div>
                <span className="bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">{t('search_from')}</span>
              </label>
              <StationSelector
                value={from}
                onChange={setFrom}
                placeholder={t('search_from_placeholder')}
                excludeStation={to}
              />
            </div>

            {/* Desktop Swap Button - Enhanced */}
            <div className="hidden md:flex absolute left-1/2 top-12 transform -translate-x-1/2 z-20">
              <button
                type="button"
                onClick={swapCities}
                className="relative bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white p-3.5 rounded-full hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 transition-all shadow-2xl transform hover:scale-125 hover:rotate-180 duration-500 group ring-4 ring-white/50"
              >
                <ArrowsRightLeftIcon className="w-5 h-5" />
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/40 to-white/0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm"></div>
              </button>
            </div>

            <div className="relative group">
              <label className="block text-xs sm:text-sm font-bold text-gray-900 mb-2 sm:mb-3 flex items-center">
                <div className="p-1.5 sm:p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg mr-2 shadow-md group-hover:shadow-lg transition-all">
                  <MapPinIcon className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                </div>
                <span className="bg-gradient-to-r from-purple-700 to-pink-700 bg-clip-text text-transparent">{t('search_to')}</span>
              </label>
              <StationSelector
                value={to}
                onChange={setTo}
                placeholder={t('search_to_placeholder')}
                excludeStation={from}
              />
            </div>
          </div>

          {/* Mobile Swap Button - Enhanced */}
          <div className="md:hidden flex justify-center my-2">
            <button
              type="button"
              onClick={swapCities}
              className="relative bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white p-4 rounded-full hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 transition-all shadow-2xl transform active:scale-95 hover:rotate-180 duration-500 group ring-4 ring-white/50"
            >
              <ArrowsRightLeftIcon className="w-6 h-6" />
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/40 to-white/0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm"></div>
            </button>
          </div>

          {/* Date Section - Ultra Responsive */}
          <div className={`grid grid-cols-1 ${tripType === 'roundTrip' ? 'sm:grid-cols-2' : ''} gap-4 sm:gap-5 md:gap-6`}>
            <div className="group">
              <label className="block text-xs sm:text-sm font-bold text-gray-900 mb-2 sm:mb-3 flex items-center">
                <div className="p-1.5 sm:p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg mr-2 shadow-md group-hover:shadow-lg transition-all">
                  <CalendarIcon className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                </div>
                <span className="bg-gradient-to-r from-green-700 to-emerald-700 bg-clip-text text-transparent">{t('search_date_departure')}</span>
              </label>
              <input
                type="date"
                value={departureDate}
                onChange={(e) => setDepartureDate(e.target.value)}
                min={today}
                max={maxDateStr}
                className="w-full p-3 sm:p-4 border-2 border-gray-300/50 rounded-xl focus:ring-4 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-lg hover:shadow-xl bg-white/90 backdrop-blur-sm hover:bg-white text-sm sm:text-base font-bold"
                style={{ color: '#000000' }}
                required
              />
            </div>

            {tripType === 'roundTrip' && (
              <div className="group animate-fadeIn">
                <label className="block text-xs sm:text-sm font-bold text-gray-900 mb-2 sm:mb-3 flex items-center">
                  <div className="p-1.5 sm:p-2 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg mr-2 shadow-md group-hover:shadow-lg transition-all">
                    <CalendarIcon className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                  </div>
                  <span className="bg-gradient-to-r from-orange-700 to-red-700 bg-clip-text text-transparent">{t('search_date_return')}</span>
                </label>
                <input
                  type="date"
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  min={departureDate || today}
                  max={maxDateStr}
                  className="w-full p-3 sm:p-4 border-2 border-gray-300/50 rounded-xl focus:ring-4 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-lg hover:shadow-xl bg-white/90 backdrop-blur-sm hover:bg-white text-sm sm:text-base font-bold"
                  style={{ color: '#000000' }}
                  required={tripType === 'roundTrip'}
                />
              </div>
            )}
          </div>

          {/* Passengers Section - Enhanced */}
          <div className="relative group">
            <label className="block text-xs sm:text-sm font-bold text-gray-900 mb-2 sm:mb-3 flex items-center">
              <div className="p-1.5 sm:p-2 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg mr-2 shadow-md group-hover:shadow-lg transition-all">
                <UserGroupIcon className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
              </div>
              <span className="bg-gradient-to-r from-cyan-700 to-blue-700 bg-clip-text text-transparent">{t('search_passengers')}</span>
            </label>
            <button
              type="button"
              onClick={() => setShowPassengerDropdown(!showPassengerDropdown)}
              className="w-full p-3 sm:p-4 border-2 border-gray-300/50 rounded-xl text-left focus:ring-4 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-lg hover:shadow-xl bg-white/90 backdrop-blur-sm hover:bg-white text-sm sm:text-base font-bold relative group"
              style={{ color: '#000000' }}
            >
              <span className="flex items-center justify-between">
                <span>{adults} {t('passenger_adult')}{adults !== 1 ? 's' : ''}{children > 0 && `, ${children} ${t('passenger_children')}`}</span>
                <svg className={`w-5 h-5 transform transition-transform ${showPassengerDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </span>
            </button>

            {showPassengerDropdown && (
              <div className="absolute z-30 w-full mt-2 bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 border-2 border-blue-300/50 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] p-5 sm:p-6 backdrop-blur-xl animate-slideDown">
                <div className="space-y-5">
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-100/50 to-indigo-100/50 rounded-xl">
                    <div className="flex items-center">
                      <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg mr-3">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                        </svg>
                      </div>
                      <span className="text-xs sm:text-sm font-bold text-gray-900">{t('passenger_adults')}</span>
                    </div>
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <button
                        type="button"
                        onClick={() => setAdults(Math.max(1, adults - 1))}
                        className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-110 active:scale-95 text-white font-bold text-lg"
                      >
                        -
                      </button>
                      <span className="w-8 sm:w-10 text-center font-bold text-gray-900 text-lg">{adults}</span>
                      <button
                        type="button"
                        onClick={() => setAdults(Math.min(9, adults + 1))}
                        className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-110 active:scale-95 text-white font-bold text-lg"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-100/50 to-pink-100/50 rounded-xl">
                    <div className="flex items-center">
                      <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg mr-3">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-xs sm:text-sm font-bold text-gray-900">{t('passenger_children')}</span>
                    </div>
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <button
                        type="button"
                        onClick={() => setChildren(Math.max(0, children - 1))}
                        className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center hover:from-purple-600 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-110 active:scale-95 text-white font-bold text-lg"
                      >
                        -
                      </button>
                      <span className="w-8 sm:w-10 text-center font-bold text-gray-900 text-lg">{children}</span>
                      <button
                        type="button"
                        onClick={() => setChildren(Math.min(9, children + 1))}
                        className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center hover:from-purple-600 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-110 active:scale-95 text-white font-bold text-lg"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPassengerDropdown(false)}
                  className="w-full mt-5 py-3 sm:py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 transition-all shadow-xl font-bold text-sm sm:text-base transform hover:scale-[1.02] active:scale-95"
                >
                  {t('common_confirm')}
                </button>
              </div>
            )}
          </div>

          {/* Ultra Advanced Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white py-4 sm:py-5 md:py-6 px-6 sm:px-8 rounded-2xl font-extrabold text-base sm:text-lg md:text-xl hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 focus:ring-4 focus:ring-blue-400/50 transition-all transform hover:scale-[1.03] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-[0_20px_60px_rgba(59,130,246,0.5)] hover:shadow-[0_25px_80px_rgba(99,102,241,0.7)] relative overflow-hidden group"
          >
            {/* Animated Background Layers */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-30 transition-opacity duration-500"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            
            {/* Button Content */}
            <span className="relative z-10 flex items-center justify-center space-x-2 sm:space-x-3">
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>{t('search_loading')}</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 group-hover:animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <span>{t('search_button')}</span>
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </>
              )}
            </span>
            
            {/* Pulse Effect */}
            <div className="absolute inset-0 rounded-2xl bg-white opacity-0 group-hover:opacity-20 animate-pulse"></div>
          </button>
        </form>
      </div>
    </div>
  );
};

export default BookingForm;
