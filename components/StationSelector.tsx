import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MapPinIcon, ChevronDownIcon } from './icons';
import * as api from '../services/apiService';

interface Station {
  id?: number;
  station_code?: string;
  name: string;
  district: string;
  province: string;
  address?: string;
  type?: string;
}

interface StationSelectorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  excludeStation?: string;
  province?: string;
  district?: string;
}

const StationSelector: React.FC<StationSelectorProps> = ({ 
  value, 
  onChange, 
  placeholder,
  excludeStation,
  province,
  district
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [stations, setStations] = useState<Station[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchStations = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (province) params.append('province', province);
        if (district) params.append('district', district);
        if (searchTerm) params.append('search', searchTerm);
        
        const response = await api.get(`/stations?${params.toString()}`);
        if (response.success) {
          setStations(response.data || []);
        }
      } catch (error) {
        console.error('Failed to fetch stations:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen || searchTerm.length > 0) {
      fetchStations();
    }
  }, [isOpen, searchTerm, province, district]);

  useEffect(() => {
    // Find selected station by value
    if (value && stations.length > 0) {
      const found = stations.find(
        s => s.name === value || s.station_code === value
      );
      if (found) {
        setSelectedStation(found);
      }
    }
  }, [value, stations]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredStations = useMemo(() => {
    let filtered = stations;
    
    if (excludeStation) {
      filtered = filtered.filter(
        s => s.name.toLowerCase() !== excludeStation.toLowerCase() &&
             s.station_code !== excludeStation
      );
    }
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        s => 
          s.name.toLowerCase().includes(term) ||
          s.district.toLowerCase().includes(term) ||
          s.province.toLowerCase().includes(term)
      );
    }
    
    return filtered.slice(0, 20); // Limit to 20 results
  }, [stations, searchTerm, excludeStation]);

  const handleSelect = (station: Station) => {
    onChange(station.name);
    setSelectedStation(station);
    setIsOpen(false);
    setSearchTerm('');
  };

  const displayValue = selectedStation 
    ? `${selectedStation.name}, ${selectedStation.district}`
    : value || '';

  const inputBaseClass = "w-full pl-10 pr-10 py-3 rounded-lg border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 text-gray-900 dark:text-white transition appearance-none placeholder-gray-400 dark:placeholder-gray-500";

  return (
    <div className="relative" ref={wrapperRef}>
      <MapPinIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 z-10 pointer-events-none" />
      <input
        type="text"
        className={inputBaseClass}
        value={isOpen ? searchTerm : displayValue}
        onChange={(e) => {
          setSearchTerm(e.target.value);
          if (!isOpen) setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        placeholder={placeholder}
        autoComplete="off"
      />
      <ChevronDownIcon 
        className={`absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 z-10 pointer-events-none transition-transform ${isOpen ? 'rotate-180' : ''}`} 
      />

      {isOpen && (
        <div className="absolute top-full mt-2 w-full max-h-80 overflow-y-auto bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-lg shadow-xl z-50 custom-scrollbar">
          {isLoading ? (
            <div className="px-4 py-3 text-gray-500 dark:text-gray-400 text-center">
              Loading stations...
            </div>
          ) : filteredStations.length > 0 ? (
            <div>
              {filteredStations.map((station) => (
                <button
                  type="button"
                  key={station.station_code || station.id || station.name}
                  onClick={() => handleSelect(station)}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                    value === station.name ? 'bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500' : ''
                  }`}
                >
                  <div className="font-medium text-gray-900 dark:text-white">
                    {station.name}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {station.district}, {station.province}
                  </div>
                  {station.type && (
                    <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      {station.type === 'terminal' ? '🚏 Terminal' : '📍 Station'}
                    </div>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="px-4 py-3 text-gray-500 dark:text-gray-400 text-center">
              No stations found
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StationSelector;

