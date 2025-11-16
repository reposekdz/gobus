
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { MapPinIcon, ChevronDownIcon } from './icons';

interface SearchableSelectProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({ options, value, onChange, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);
  
  const filteredOptions = useMemo(() => 
    options.filter(option => 
      option.toLowerCase().includes(searchTerm.toLowerCase())
    ), [options, searchTerm]);

  const handleSelect = (option: string) => {
    onChange(option);
    setIsOpen(false);
    setSearchTerm('');
  };

  const formInputBaseClass = "w-full pl-10 pr-10 py-3 rounded-lg border-2 border-white/10 focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 bg-black/30 backdrop-blur-sm text-white transition appearance-none";

  return (
    <div className="relative" ref={wrapperRef}>
        <MapPinIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />
        <input
            type="text"
            className={formInputBaseClass}
            value={isOpen ? searchTerm : value}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => setIsOpen(true)}
            placeholder={placeholder}
        />
        <ChevronDownIcon className={`absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 z-10 transition-transform ${isOpen ? 'rotate-180' : ''}`} />

        {isOpen && (
            <div className="absolute top-full mt-2 w-full max-h-60 overflow-y-auto bg-gray-900/80 backdrop-blur-md border border-gray-700 rounded-lg shadow-xl z-20 custom-scrollbar">
                {filteredOptions.length > 0 ? (
                    filteredOptions.map(option => (
                        <button
                            type="button"
                            key={option}
                            onClick={() => handleSelect(option)}
                            className={`w-full text-left px-4 py-2 text-white hover:bg-white/10 ${value === option ? 'bg-white/20' : ''}`}
                        >
                            {option}
                        </button>
                    ))
                ) : (
                    <div className="px-4 py-2 text-gray-400">No results found</div>
                )}
            </div>
        )}
    </div>
  );
};

export default SearchableSelect;
