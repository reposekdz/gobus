

import React, { useState, useMemo, useEffect } from 'react';
import { ArrowRightIcon, FilterIcon, StarIcon, WifiIcon, AcIcon, PowerIcon, BuildingOfficeIcon, XIcon, CalendarIcon } from './components/icons';
import SearchResultsPage from './SearchResultsPage';
import { Page } from './App';
import * as api from './services/apiService';
import SearchResultSkeleton from './components/SearchResultSkeleton';
import Modal from './components/Modal';
import StationSelector from './components/StationSelector';
import PassengerSelector from './components/PassengerSelector';

const allAmenities = ['WiFi', 'AC', 'Charging'];

interface BookingSearchPageProps {
  searchParams: { from?: string; to?: string; date?: string; passengers?: { adults: number; children: number; }, companyId?: string };
  onNavigate: (page: Page, data?: any) => void;
}

const FilterSidebarContent = ({ sortOrder, setSortOrder, amenityFilters, setAmenityFilters, timeFilters, setTimeFilters, companyFilters, setCompanyFilters, companies, showFavoritesOnly, setShowFavoritesOnly, handleFilterToggle }) => (
    <div className="space-y-6">
        <div>
            <h4 className="font-semibold mb-2 dark:text-gray-200">Sort by</h4>
            <select value={sortOrder} onChange={e => setSortOrder(e.target.value)} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600">
                <option value="fastest">Fastest</option>
                <option value="cheapest">Cheapest</option>
                <option value="earliest">Earliest Departure</option>
            </select>
        </div>
        
        <div className="border-t dark:border-gray-700 pt-4">
            <h4 className="font-semibold mb-2 dark:text-gray-200">Amenities</h4>
            <div className="space-y-2">
                {allAmenities.map(amenity => (
                    <label key={amenity} className="flex items-center space-x-2 cursor-pointer"><input type="checkbox" checked={amenityFilters.includes(amenity)} onChange={() => handleFilterToggle(amenityFilters, setAmenityFilters, amenity)} className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500"/><span>{amenity}</span></label>
                ))}
            </div>
        </div>

         <div className="border-t dark:border-gray-700 pt-4">
            <h4 className="font-semibold mb-2 dark:text-gray-200">Departure Time</h4>
            <div className="space-y-2">
                {['Morning (5am-12pm)', 'Afternoon (12pm-6pm)', 'Evening (6pm-onwards)'].map(time => (
                    <label key={time} className="flex items-center space-x-2 cursor-pointer"><input type="checkbox" checked={timeFilters.includes(time.split(' ')[0])} onChange={() => handleFilterToggle(timeFilters, setTimeFilters, time.split(' ')[0])} className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500"/><span>{time}</span></label>
                ))}
            </div>
        </div>
        
        <div className="border-t dark:border-gray-700 pt-4">
            <h4 className="font-semibold mb-2 dark:text-gray-200">Bus Companies</h4>
            <div className="space-y-2">
                {companies.map(company => (
                    <label key={company.id} className="flex items-center space-x-2 cursor-pointer"><input type="checkbox" checked={companyFilters.includes(company.name)} onChange={() => handleFilterToggle(companyFilters, setCompanyFilters, company.name)} className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500"/><span>{company.name}</span></label>
                ))}
            </div>
        </div>

        <div className="border-t dark:border-gray-700 pt-4">
            <label className="flex items-center justify-between cursor-pointer">
                <h4 className="font-semibold dark:text-gray-200 flex items-center"><StarIcon className="w-5 h-5 mr-2 text-yellow-400"/> Show Favorites Only</h4>
                 <div className="relative">
                    <input type="checkbox" checked={showFavoritesOnly} onChange={() => setShowFavoritesOnly(!showFavoritesOnly)} className="sr-only" />
                    <div className={`block w-10 h-6 rounded-full transition ${showFavoritesOnly ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                    <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${showFavoritesOnly ? 'transform translate-x-4' : ''}`}></div>
                </div>
            </label>
        </div>
    </div>
);


const BookingSearchPage: React.FC<BookingSearchPageProps> = ({ searchParams, onNavigate }) => {
  const [fromLocation, setFromLocation] = useState(searchParams?.from || 'Kigali');
  const [toLocation, setToLocation] = useState(searchParams?.to || 'Rubavu');
  const [journeyDate, setJourneyDate] = useState(searchParams?.date || new Date().toISOString().split('T')[0]);
  const [passengers, setPassengers] = useState(searchParams?.passengers || { adults: 1, children: 0 });

  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [companies, setCompanies] = useState<any[]>([]);
  const [companyName, setCompanyName] = useState('');
  
  const [sortOrder, setSortOrder] = useState('fastest');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [favoriteTripIds, setFavoriteTripIds] = useState<string[]>([]);
  const [amenityFilters, setAmenityFilters] = useState<string[]>([]);
  const [companyFilters, setCompanyFilters] = useState<string[]>([]);
  const [timeFilters, setTimeFilters] = useState<string[]>([]);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  
  const totalPassengers = useMemo(() => passengers.adults + passengers.children, [passengers]);

  const fetchTrips = async () => {
      if (!fromLocation || !toLocation || !journeyDate) return;
      setIsLoading(true);
      setError('');
      try {
          const data = await api.searchTrips(fromLocation, toLocation, journeyDate, searchParams?.companyId);
          setResults(data);
      } catch (err) {
          setError((err as Error).message || 'Failed to fetch trips.');
      } finally {
          setIsLoading(false);
      }
  };
  
  useEffect(() => {
    fetchTrips();
    const fetchCompanies = async () => {
        try {
            const companyData = await api.getCompanies();
            setCompanies(companyData);
        } catch (e) {
            console.error("Failed to fetch companies for filter", e);
        }
    };
    fetchCompanies();
  }, [fromLocation, toLocation, journeyDate, searchParams?.companyId]);

  useEffect(() => {
    if (searchParams?.companyId && companies.length > 0) {
        const company = companies.find(c => c.id.toString() === searchParams.companyId);
        if (company) {
            setCompanyName(company.name);
        }
    } else {
        setCompanyName('');
    }
  }, [searchParams?.companyId, companies]);


  const loadFavorites = () => {
    const storedFavorites = localStorage.getItem('favoriteTrips');
    setFavoriteTripIds(storedFavorites ? JSON.parse(storedFavorites) : []);
  };
  
  useEffect(() => {
    loadFavorites();
    window.addEventListener('favoritesChanged', loadFavorites);
    return () => window.removeEventListener('favoritesChanged', loadFavorites);
  }, []);

  const toggleFavorite = (tripId: string) => {
    const newFavorites = favoriteTripIds.includes(tripId)
      ? favoriteTripIds.filter(id => id !== tripId)
      : [...favoriteTripIds, tripId];
    
    setFavoriteTripIds(newFavorites);
    localStorage.setItem('favoriteTrips', JSON.stringify(newFavorites));
    window.dispatchEvent(new CustomEvent('favoritesChanged'));
  };

  const handleFilterToggle = (filterList, setFilterList, value) => {
    if (filterList.includes(value)) {
      setFilterList(filterList.filter(item => item !== value));
    } else {
      setFilterList([...filterList, value]);
    }
  };

  const filteredAndSortedResults = useMemo(() => {
    let processedResults = results
      .map(trip => ({
          id: trip._id,
          company: trip.route.company.name,
          companyLogo: trip.route.company.logoUrl,
          departureTime: new Date(trip.departureTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
          arrivalTime: new Date(trip.arrivalTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
          durationMinutes: trip.route.estimatedDurationMinutes,
          basePrice: trip.route.basePrice,
          dynamicPrice: trip.route.basePrice, 
          availableSeats: trip.availableSeats,
          amenities: trip.bus.amenities,
          driver: trip.driver,
      }))
      .filter(trip => {
        if (trip.availableSeats < totalPassengers) return false;
        if (showFavoritesOnly && !favoriteTripIds.includes(trip.id)) return false;
        if (amenityFilters.length > 0 && !amenityFilters.every(amenity => trip.amenities.includes(amenity))) return false;
        if (companyFilters.length > 0 && !companyFilters.includes(trip.company)) return false;
        if (timeFilters.length > 0) {
            const hour = parseInt(trip.departureTime.split(':')[0]);
            const isMorning = hour >= 5 && hour < 12;
            const isAfternoon = hour >= 12 && hour < 18;
            const isEvening = hour >= 18;
            
            const timeChecks = [];
            if (timeFilters.includes('Morning')) timeChecks.push(isMorning);
            if (timeFilters.includes('Afternoon')) timeChecks.push(isAfternoon);
            if (timeFilters.includes('Evening')) timeChecks.push(isEvening);

            if(timeChecks.length > 0 && !timeChecks.some(check => check === true)) return false;
        }
        return true;
      });

    processedResults.sort((a, b) => {
      switch (sortOrder) {
        case 'cheapest': return a.dynamicPrice - b.dynamicPrice;
        case 'fastest': return a.durationMinutes - b.durationMinutes;
        case 'earliest': return a.departureTime.localeCompare(b.departureTime);
        default: return 0;
      }
    });

    return processedResults;
  }, [results, sortOrder, showFavoritesOnly, favoriteTripIds, amenityFilters, companyFilters, timeFilters, totalPassengers]);


  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
      <header className="bg-white dark:bg-gray-800/50 shadow-sm pt-12 pb-8">
            <div className="container mx-auto px-6">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl sm:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">{fromLocation} <ArrowRightIcon className="inline w-6 sm:w-8 h-6 sm:h-8 mx-2"/> {toLocation}</h1>
                        {companyName && <p className="text-lg text-gray-500 dark:text-gray-400">Filtered by: <span className="font-bold">{companyName}</span></p>}
                        <p className="mt-2 text-md sm:text-lg text-gray-600 dark:text-gray-400">{new Date(journeyDate).toDateString()}, {totalPassengers} passenger(s) - {isLoading ? '...' : `${filteredAndSortedResults.length} trips found`}</p>
                    </div>
                </div>
                 <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md grid grid-cols-1 md:grid-cols-[1fr_1fr_auto_auto] gap-4 items-center">
                    <StationSelector 
                        value={fromLocation} 
                        onChange={setFromLocation} 
                        placeholder="Select Origin Station" 
                        excludeStation={toLocation}
                    />
                    <StationSelector 
                        value={toLocation} 
                        onChange={setToLocation} 
                        placeholder="Select Destination Station"
                        excludeStation={fromLocation}
                    />
                    <div className="relative">
                        <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />
                        <input 
                            type="date" 
                            value={journeyDate} 
                            onChange={e => setJourneyDate(e.target.value)} 
                            min={new Date().toISOString().split('T')[0]}
                            max={new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                            className="w-full pl-10 pr-4 py-3 rounded-lg border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                    </div>
                    <div className="min-w-[180px]">
                      <PassengerSelector passengers={passengers} onPassengersChange={setPassengers} className="bg-gray-50 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 text-black dark:text-white" />
                    </div>
                 </div>
            </div>
      </header>
       <main className="container mx-auto px-6 py-8">
         <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
           <aside className="hidden md:block md:col-span-1">
             <div className="sticky top-24 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
                <h3 className="text-xl font-bold dark:text-white flex items-center mb-4"><FilterIcon className="w-5 h-5 mr-2"/> Filters</h3>
                <FilterSidebarContent {...{ sortOrder, setSortOrder, amenityFilters, setAmenityFilters, timeFilters, setTimeFilters, companyFilters, setCompanyFilters, companies, showFavoritesOnly, setShowFavoritesOnly, handleFilterToggle }} />
             </div>
           </aside>
           <div className="md:col-span-3">
               <div className="md:hidden mb-4">
                 <button onClick={() => setIsFilterModalOpen(true)} className="w-full flex items-center justify-center p-3 bg-white dark:bg-gray-800 rounded-lg shadow font-semibold">
                    <FilterIcon className="w-5 h-5 mr-2"/>
                    Show Filters & Sort
                 </button>
               </div>
               {isLoading && <SearchResultSkeleton />}
               {error && <p className="text-red-500 text-center bg-red-100 dark:bg-red-900/50 p-4 rounded-lg">{error}</p>}
               {!isLoading && !error && <SearchResultsPage 
                  results={filteredAndSortedResults} 
                  onTripSelect={(trip) => onNavigate('seatSelection', { tripId: trip.id })}
                  favoriteTripIds={favoriteTripIds}
                  onToggleFavorite={toggleFavorite}
                />}
           </div>
         </div>
       </main>
        <Modal isOpen={isFilterModalOpen} onClose={() => setIsFilterModalOpen(false)} title="Filters & Sort">
            <FilterSidebarContent {...{ sortOrder, setSortOrder, amenityFilters, setAmenityFilters, timeFilters, setTimeFilters, companyFilters, setCompanyFilters, companies, showFavoritesOnly, setShowFavoritesOnly, handleFilterToggle }} />
            <div className="mt-6 text-right">
                <button onClick={() => setIsFilterModalOpen(false)} className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg">Apply</button>
            </div>
        </Modal>
    </div>
  );
};

export default BookingSearchPage;