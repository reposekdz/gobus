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
  const [promoCode, setPromoCode] = useState('');
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
      alert('Please fill in all required fields');
      return;
    }

    if (from.toLowerCase() === to.toLowerCase()) {
      alert('Origin and destination cannot be the same');
      return;
    }

    setIsLoading(true);
    
    try {
      const passengers = { adults, children };
      onSearch(from, to, departureDate, passengers);
    } catch (error) {
      console.error('Search failed:', error);
      alert('Search failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];
  const maxDate = new Date();
  maxDate.setMonth(maxDate.getMonth() + 6);
  const maxDateStr = maxDate.toISOString().split('T')[0];

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-6 md:p-8 border border-white/20">
      {/* Trip Type Toggle */}
      <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
        <button
          type="button"
          onClick={() => setTripType('oneWay')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
            tripType === 'oneWay'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          One Way
        </button>
        <button
          type="button"
          onClick={() => setTripType('roundTrip')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
            tripType === 'roundTrip'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Round Trip
        </button>
      </div>

      <form onSubmit={handleSearch} className="space-y-4">
        {/* From and To Cities */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative">
          {/* From City */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <MapPinIcon className="w-4 h-4 inline mr-1" />
              From
            </label>
            <StationSelector
              value={from}
              onChange={setFrom}
              placeholder="Select origin station"
              excludeStation={to}
            />
          </div>

          {/* Swap Button */}
          <div className="hidden md:flex absolute left-1/2 top-8 transform -translate-x-1/2 z-10">
            <button
              type="button"
              onClick={swapCities}
              className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-colors shadow-lg"
            >
              <ArrowsRightLeftIcon className="w-4 h-4" />
            </button>
          </div>

          {/* To City */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <MapPinIcon className="w-4 h-4 inline mr-1" />
              To
            </label>
            <StationSelector
              value={to}
              onChange={setTo}
              placeholder="Select destination station"
              excludeStation={from}
            />
          </div>
        </div>

        {/* Mobile Swap Button */}
        <div className="md:hidden flex justify-center">
          <button
            type="button"
            onClick={swapCities}
            className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-colors"
          >
            <ArrowsRightLeftIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Dates */}
        <div className={`grid grid-cols-1 ${tripType === 'roundTrip' ? 'md:grid-cols-2' : ''} gap-4`}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <CalendarIcon className="w-4 h-4 inline mr-1" />
              Departure Date
            </label>
            <input
              type="date"
              value={departureDate}
              onChange={(e) => setDepartureDate(e.target.value)}
              min={today}
              max={maxDateStr}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              required
            />
          </div>

          {tripType === 'roundTrip' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <CalendarIcon className="w-4 h-4 inline mr-1" />
                Return Date
              </label>
              <input
                type="date"
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                min={departureDate || today}
                max={maxDateStr}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                required={tripType === 'roundTrip'}
              />
            </div>
          )}
        </div>

        {/* Passengers and Promo Code */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Passengers */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <UserGroupIcon className="w-4 h-4 inline mr-1" />
              Passengers
            </label>
            <button
              type="button"
              onClick={() => setShowPassengerDropdown(!showPassengerDropdown)}
              className="w-full p-3 border border-gray-300 rounded-lg text-left focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              {adults} Adult{adults !== 1 ? 's' : ''}{children > 0 && `, ${children} Children`}
            </button>

            {showPassengerDropdown && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Adults</span>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => setAdults(Math.max(1, adults - 1))}
                        className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition-colors"
                      >
                        -
                      </button>
                      <span className="w-8 text-center">{adults}</span>
                      <button
                        type="button"
                        onClick={() => setAdults(Math.min(9, adults + 1))}
                        className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Children</span>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => setChildren(Math.max(0, children - 1))}
                        className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition-colors"
                      >
                        -
                      </button>
                      <span className="w-8 text-center">{children}</span>
                      <button
                        type="button"
                        onClick={() => setChildren(Math.min(9, children + 1))}
                        className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPassengerDropdown(false)}
                  className="w-full mt-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Done
                </button>
              </div>
            )}
          </div>

          {/* Promo Code */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Promo Code
            </label>
            <input
              type="text"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
              placeholder="Enter promo code"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Search Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 px-6 rounded-lg font-semibold text-lg hover:from-blue-700 hover:to-blue-800 focus:ring-4 focus:ring-blue-300 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          {isLoading ? 'Searching...' : 'Search Buses'}
        </button>
      </form>
    </div>
  );
};

export default BookingForm;