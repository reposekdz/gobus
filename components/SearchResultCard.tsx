import React from 'react';
import { ArrowRightIcon, WifiIcon, AcIcon, PowerIcon, StarIcon, TagIcon } from './icons';

const AmenityIcon: React.FC<{ amenity: string }> = ({ amenity }) => {
    const iconClass = "w-4 h-4 text-gray-500 dark:text-gray-400";
    if (amenity === 'WiFi') return <WifiIcon className={iconClass} />;
    if (amenity === 'AC') return <AcIcon className={iconClass} />;
    if (amenity === 'Charging') return <PowerIcon className={iconClass} />;
    return null;
};

const SearchResultCard: React.FC<{ result: any, onSelect: () => void, isFavorite: boolean, onToggleFavorite: () => void, style?: React.CSSProperties, className?: string }> = ({ result, onSelect, isFavorite, onToggleFavorite, style, className }) => {
    const isSurge = result.dynamicPrice > result.basePrice;
    const isSellingFast = result.availableSeats < 10;

    return (
        <div style={style} className={`${className} bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0 sm:space-x-6 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 relative group`}>
            {/* Animated Glow Border */}
            <div className="absolute inset-0 rounded-xl border-2 border-transparent group-hover:border-yellow-400/50 transition-all duration-300 pointer-events-none"></div>

            {isSellingFast && (
                <div className="absolute top-0 right-6 transform translate-y-[-50%] bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md z-10">
                    Selling Fast!
                </div>
            )}
             {isSurge && (
                <div className="absolute top-6 right-6 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full z-10 flex items-center">
                   <TagIcon className="w-3 h-3 mr-1"/> Surge Price
                </div>
            )}

            <div className="flex-shrink-0 w-full sm:w-auto text-center sm:text-left">
                 <div className="flex items-center space-x-4 justify-center sm:justify-start">
                    {result.companyLogo ? (
                        <img src={result.companyLogo} alt={`${result.company} logo`} className="w-12 h-12 object-contain bg-white dark:bg-gray-900 rounded-full p-1 shadow-md"/>
                    ) : (
                        <div className="w-12 h-12 flex items-center justify-center bg-gray-200 dark:bg-gray-700 rounded-full shadow-md">
                            <span className="font-bold text-gray-500">{result.company.charAt(0)}</span>
                        </div>
                    )}
                    <div>
                        <p className="font-bold text-gray-700 dark:text-gray-200 text-lg">{result.company}</p>
                        <div className="flex items-center space-x-3 mt-1">
                            {result.amenities.map((amenity: string) => <AmenityIcon key={amenity} amenity={amenity} />)}
                        </div>
                    </div>
                </div>
                {result.driver && (
                    <div className="flex items-center space-x-2 mt-3 pt-2 border-t dark:border-gray-700 justify-center sm:justify-start">
                        {result.driver.avatar_url ? (
                            <img src={result.driver.avatar_url} alt={result.driver.name} className="w-7 h-7 rounded-full object-cover"/>
                        ) : (
                            <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                <span className="text-xs font-bold text-gray-500">{result.driver.name.charAt(0)}</span>
                            </div>
                        )}
                        <p className="text-xs text-gray-500 dark:text-gray-400">Driver: <span className="font-semibold text-gray-700 dark:text-gray-200">{result.driver.name}</span></p>
                    </div>
                )}
            </div>
            <div className="flex items-center space-x-4">
                <div className="text-center">
                    <p className="font-bold text-xl text-gray-800 dark:text-white">{result.departureTime}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Kigali</p>
                </div>
                <div className="text-center text-gray-400">
                    <p className="text-xs">{Math.floor(result.durationMinutes / 60)}h {result.durationMinutes % 60}m</p>
                    <div className="w-20 h-0.5 bg-gray-300 dark:bg-gray-600 my-1"></div>
                    <p className="text-xs">Direct</p>
                </div>
                <div className="text-center">
                    <p className="font-bold text-xl text-gray-800 dark:text-white">{result.arrivalTime}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Rubavu</p>
                </div>
            </div>
            <div className="text-center flex-shrink-0">
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{new Intl.NumberFormat('fr-RW').format(result.dynamicPrice)} RWF</p>
                {isSurge && <p className="text-xs text-gray-400 line-through">{new Intl.NumberFormat('fr-RW').format(result.basePrice)} RWF</p>}
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{result.availableSeats} seats left</p>
            </div>
            <div className="flex items-center space-x-2">
                <button 
                    onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
                    className="p-3 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                >
                    <StarIcon className={`w-6 h-6 transition-all duration-200 ${isFavorite ? 'text-yellow-400 scale-110' : 'text-gray-300 dark:text-gray-600'}`} />
                </button>
                <button onClick={onSelect} className="w-full sm:w-auto flex items-center justify-center px-6 py-3 rounded-lg bg-gradient-to-r from-yellow-400 to-yellow-500 text-[#0033A0] font-bold hover:saturate-150 transition-all duration-300 shadow-md transform hover:-translate-y-0.5 interactive-button">
                    Select Seats <ArrowRightIcon className="w-5 h-5 ml-2" />
                </button>
            </div>
        </div>
    );
};

export default SearchResultCard;