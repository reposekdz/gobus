import React, { useState, useRef, useEffect } from 'react';
import { UserCircleIcon } from './icons';
import { useLanguage } from '../contexts/LanguageContext';

interface PassengerSelectorProps {
  passengers: { adults: number; children: number };
  onPassengersChange: (passengers: { adults: number; children: number }) => void;
  className?: string;
}

const PassengerSelector: React.FC<PassengerSelectorProps> = ({ passengers, onPassengersChange, className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);
  
  const handleChange = (type: 'adults' | 'children', operation: 'inc' | 'dec') => {
      onPassengersChange({
          ...passengers,
          [type]: operation === 'inc' ? passengers[type] + 1 : Math.max(type === 'adults' ? 1 : 0, passengers[type] - 1)
      });
  };

  const baseClass = "w-full pl-10 pr-4 py-3 rounded-lg text-left";

  return (
    <div className="relative" ref={wrapperRef}>
      <button type="button" onClick={() => setIsOpen(!isOpen)} className={`${className} ${baseClass}`}>
        <UserCircleIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        {passengers.adults} {t('form_adults')}, {passengers.children} {t('form_children')}
      </button>
      {isOpen && (
        <div className="absolute top-full mt-2 w-full bg-gray-900/80 backdrop-blur-md border border-gray-700 rounded-lg shadow-xl p-4 z-20 text-white">
          <div className="flex justify-between items-center">
            <p>{t('form_adults_label')}</p>
            <div className="flex items-center space-x-3">
              <button type="button" onClick={() => handleChange('adults', 'dec')} className="w-7 h-7 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30">-</button>
              <span className="w-4 text-center">{passengers.adults}</span>
              <button type="button" onClick={() => handleChange('adults', 'inc')} className="w-7 h-7 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30">+</button>
            </div>
          </div>
          <div className="flex justify-between items-center mt-2">
            <p>{t('form_children_label')}</p>
            <div className="flex items-center space-x-3">
              <button type="button" onClick={() => handleChange('children', 'dec')} className="w-7 h-7 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30">-</button>
              <span className="w-4 text-center">{passengers.children}</span>
              <button type="button" onClick={() => handleChange('children', 'inc')} className="w-7 h-7 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30">+</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PassengerSelector;
