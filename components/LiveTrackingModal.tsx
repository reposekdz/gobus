
import React from 'react';
import { XIcon, BusIcon, MapIcon } from './icons';

interface LiveTrackingModalProps {
  onClose: () => void;
}

const LiveTrackingModal: React.FC<LiveTrackingModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div 
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full h-[70vh] flex flex-col relative"
        onClick={e => e.stopPropagation()}
      >
        <header className="p-4 border-b dark:border-gray-700 flex items-center justify-between flex-shrink-0">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center">
            <MapIcon className="w-6 h-6 mr-3 text-blue-500" />
            Live Bus Tracking
          </h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
            <XIcon className="w-6 h-6 text-gray-500" />
          </button>
        </header>

        <main className="flex-grow bg-gray-200 dark:bg-gray-900 relative">
          {/* This would be a real map component (e.g., Google Maps, Mapbox) */}
          <div className="w-full h-full flex items-center justify-center">
            <p className="text-gray-500 dark:text-gray-400 font-semibold">[Map Placeholder]</p>
          </div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse">
             <BusIcon className="w-10 h-10 text-blue-600 drop-shadow-lg" />
          </div>
        </main>

        <footer className="p-4 bg-gray-50 dark:bg-gray-800/50 border-t dark:border-gray-700 flex-shrink-0">
            <div className="flex justify-between items-center">
                <div>
                    <p className="font-bold">Kigali - Huye</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Status: <span className="text-green-600 font-semibold">On Time</span></p>
                </div>
                <div className="text-right">
                    <p className="font-bold">RAD 123 B</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">ETA: 45 minutes</p>
                </div>
            </div>
        </footer>
      </div>
    </div>
  );
};

export default LiveTrackingModal;
