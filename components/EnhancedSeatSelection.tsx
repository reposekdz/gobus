import React, { useState, useEffect, useMemo } from 'react';
import { UserIcon, UsersIcon, InformationCircleIcon, LockClosedIcon } from './icons';
import * as api from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

interface EnhancedSeatSelectionProps {
  tripId: string;
  onConfirm: (bookingDetails: any) => void;
  onBack: () => void;
  maxSeats?: number;
}

interface SeatInfo {
  id: string;
  status: 'available' | 'occupied' | 'selected' | 'reserved';
  passengerName?: string;
  price?: number;
  features?: string[];
}

const EnhancedSeatSelection: React.FC<EnhancedSeatSelectionProps> = ({
  tripId,
  onConfirm,
  onBack,
  maxSeats = 10
}) => {
  const { user } = useAuth();
  const [trip, setTrip] = useState<any>(null);
  const [seatGrid, setSeatGrid] = useState<SeatInfo[][]>([]);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [hoveredSeat, setHoveredSeat] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [seatClass, setSeatClass] = useState<'standard' | 'premium' | 'all'>('all');
  const [showSeatInfo, setShowSeatInfo] = useState(true);

  useEffect(() => {
    fetchTrip();
  }, [tripId]);

  const fetchTrip = async () => {
    setIsLoading(true);
    try {
      const tripData = await api.getTripDetails(tripId);
      setTrip(tripData);
      
      // Generate enhanced seat grid
      const grid = generateEnhancedSeatGrid(tripData.seatMap || {}, tripData.bus?.capacity || 50);
      setSeatGrid(grid);
    } catch (err: any) {
      setError(err.message || "Failed to load trip details.");
      toast.error(err.message || "Failed to load trip details.");
    } finally {
      setIsLoading(false);
    }
  };

  const generateEnhancedSeatGrid = (seatMap: { [key: string]: string }, capacity: number): SeatInfo[][] => {
    const grid: SeatInfo[][] = [];
    const rows = Math.ceil(capacity / 4);
    
    for (let row = 1; row <= rows; row++) {
      const rowSeats: SeatInfo[] = [];
      const seats = ['A', 'B', 'C', 'D'];
      
      for (const seatLetter of seats) {
        const seatId = `${row}${seatLetter}`;
        const seatIndex = (row - 1) * 4 + seats.indexOf(seatLetter);
        
        if (seatIndex >= capacity) break;
        
        const status = seatMap[seatId] || 'available';
        const isPremium = row <= 3 || (row === Math.ceil(rows / 2) && ['A', 'D'].includes(seatLetter));
        
        rowSeats.push({
          id: seatId,
          status: status as any,
          price: isPremium ? (trip?.route?.basePrice || 0) * 1.2 : (trip?.route?.basePrice || 0),
          features: isPremium ? ['Extra legroom', 'Window view'] : ['Standard']
        });
      }
      
      if (rowSeats.length > 0) {
        grid.push(rowSeats);
      }
    }
    
    return grid;
  };

  const handleSelectSeat = (seatId: string, seatInfo: SeatInfo) => {
    if (seatInfo.status === 'occupied' || seatInfo.status === 'reserved') {
      toast.error('This seat is not available');
      return;
    }

    if (selectedSeats.includes(seatId)) {
      setSelectedSeats(selectedSeats.filter(s => s !== seatId));
    } else {
      if (selectedSeats.length >= maxSeats) {
        toast.error(`You can only select up to ${maxSeats} seats`);
        return;
      }
      setSelectedSeats([...selectedSeats, seatId]);
    }
  };

  const totalPrice = useMemo(() => {
    return selectedSeats.reduce((total, seatId) => {
      const seat = seatGrid.flat().find(s => s.id === seatId);
      return total + (seat?.price || trip?.route?.basePrice || 0);
    }, 0);
  }, [selectedSeats, seatGrid, trip]);

  const handleConfirm = () => {
    if (selectedSeats.length === 0) {
      toast.error('Please select at least one seat');
      return;
    }

    const bookingDetails = {
      tripId: trip.id || trip._id,
      seats: selectedSeats,
      totalPrice,
      from: trip.route?.from || trip.from,
      to: trip.route?.to || trip.to,
      company: trip.route?.company?.name || trip.company?.name,
      departureTime: new Date(trip.departureTime || trip.departure_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      passengerName: user?.name,
      seatDetails: selectedSeats.map(seatId => {
        const seat = seatGrid.flat().find(s => s.id === seatId);
        return {
          seatId,
          price: seat?.price || trip?.route?.basePrice || 0,
          features: seat?.features || []
        };
      })
    };

    onConfirm(bookingDetails);
  };

  const getSeatColor = (seat: SeatInfo) => {
    if (selectedSeats.includes(seat.id)) {
      return 'bg-gradient-to-br from-yellow-400 to-yellow-500 text-blue-900 border-yellow-600 ring-2 ring-yellow-500';
    }
    
    switch (seat.status) {
      case 'available':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-700 hover:bg-blue-200 dark:hover:bg-blue-900/50';
      case 'occupied':
        return 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-500 border-gray-400 dark:border-gray-600 cursor-not-allowed';
      case 'reserved':
        return 'bg-orange-200 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 border-orange-400 dark:border-orange-700';
      default:
        return 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400';
    }
  };

  const filteredSeats = useMemo(() => {
    if (seatClass === 'all') return seatGrid;
    
    return seatGrid.map(row => row.filter(seat => {
      const isPremium = seat.price && seat.price > (trip?.route?.basePrice || 0);
      return seatClass === 'premium' ? isPremium : !isPremium;
    })).filter(row => row.length > 0);
  }, [seatGrid, seatClass, trip]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading seat map...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500 mb-4">{error}</p>
        <button onClick={onBack} className="px-4 py-2 bg-blue-600 text-white rounded-lg">
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gray-100/50 dark:bg-gray-900/50 min-h-full py-12">
      <div className="container mx-auto px-6">
        <button
          onClick={onBack}
          className="flex items-center text-gray-600 dark:text-gray-400 font-semibold mb-6 hover:text-black dark:hover:text-white transition"
        >
          ← Back to results
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Seat Selection Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Controls */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center space-x-4">
                  <select
                    value={seatClass}
                    onChange={(e) => setSeatClass(e.target.value as any)}
                    className="px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="all">All Seats</option>
                    <option value="standard">Standard</option>
                    <option value="premium">Premium</option>
                  </select>
                  
                  <button
                    onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                    className="px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    {viewMode === 'grid' ? 'List View' : 'Grid View'}
                  </button>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Selected: {selectedSeats.length} / {maxSeats}
                  </span>
                </div>
              </div>
            </div>

            {/* Seat Map */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
              <h1 className="text-2xl font-bold dark:text-white mb-6">Select Your Seats</h1>
              
              {showSeatInfo && (
                <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <div className="flex items-start">
                    <InformationCircleIcon className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-3 flex-shrink-0" />
                    <div className="text-sm text-blue-800 dark:text-blue-300">
                      <p className="font-semibold mb-1">Seat Selection Tips</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Premium seats (front rows) offer extra legroom</li>
                        <li>Window seats (A, D) provide better views</li>
                        <li>You can select multiple seats for group bookings</li>
                        <li>Selected seats are highlighted in yellow</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              <div className="border-2 dark:border-gray-700 rounded-2xl p-4">
                <div className="bg-gray-200 dark:bg-gray-700 rounded-t-full h-12 w-3/4 mx-auto flex items-center justify-center font-bold text-gray-600 dark:text-gray-400 mb-4">
                  🚌 Driver / Exit
                </div>
                
                <div className="space-y-3">
                  {filteredSeats.map((row, rowIndex) => (
                    <div key={rowIndex} className="flex justify-around items-center">
                      <div className="w-8 text-center text-sm font-semibold text-gray-600 dark:text-gray-400">
                        {rowIndex + 1}
                      </div>
                      
                      <div className="flex gap-2">
                        {row.map((seat, seatIndex) => {
                          const isHovered = hoveredSeat === seat.id;
                          const isSelected = selectedSeats.includes(seat.id);
                          
                          return (
                            <div key={seat.id} className="relative">
                              <button
                                onClick={() => handleSelectSeat(seat.id, seat)}
                                onMouseEnter={() => setHoveredSeat(seat.id)}
                                onMouseLeave={() => setHoveredSeat(null)}
                                disabled={seat.status === 'occupied' || seat.status === 'reserved'}
                                className={`
                                  w-12 h-12 rounded-lg border-2 font-bold text-xs
                                  transition-all duration-200
                                  ${getSeatColor(seat)}
                                  ${seat.status === 'available' || isSelected ? 'cursor-pointer hover:scale-110 hover:shadow-lg' : 'cursor-not-allowed'}
                                  ${isHovered && seat.status === 'available' ? 'scale-105' : ''}
                                  flex flex-col items-center justify-center
                                `}
                                title={seat.status === 'occupied' ? 'Occupied' : `${seat.id} - ${seat.price} RWF`}
                              >
                                <span>{seat.id}</span>
                                {seat.features?.includes('Extra legroom') && (
                                  <span className="text-[8px]">⭐</span>
                                )}
                              </button>
                              
                              {/* Seat info tooltip */}
                              {isHovered && seat.status !== 'occupied' && (
                                <div className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg shadow-xl p-3">
                                  <div className="font-semibold mb-1">Seat {seat.id}</div>
                                  <div className="text-gray-300">Price: {new Intl.NumberFormat('fr-RW').format(seat.price || 0)} RWF</div>
                                  {seat.features && seat.features.length > 0 && (
                                    <div className="mt-1 pt-1 border-t border-gray-600">
                                      {seat.features.map((feature, idx) => (
                                        <div key={idx} className="text-gray-300">• {feature}</div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                        
                        {/* Aisle */}
                        {row.length > 2 && (
                          <div className="w-8"></div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Legend */}
              <div className="flex flex-wrap justify-center gap-4 mt-6 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-100 dark:bg-blue-900/30 rounded border border-blue-300 dark:border-blue-700"></div>
                  <span className="dark:text-gray-300">Available</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded border border-yellow-600"></div>
                  <span className="dark:text-gray-300">Selected</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-300 dark:bg-gray-700 rounded border border-gray-400 dark:border-gray-600"></div>
                  <span className="dark:text-gray-300">Occupied</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-orange-200 dark:bg-orange-900/30 rounded border border-orange-400 dark:border-orange-700"></div>
                  <span className="dark:text-gray-300">Reserved</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-yellow-500">⭐</span>
                  <span className="dark:text-gray-300">Premium</span>
                </div>
              </div>
            </div>
          </div>

          {/* Booking Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg space-y-6">
              <h2 className="text-xl font-bold dark:text-white">Booking Summary</h2>
              
              <div className="space-y-3 pb-4 border-b dark:border-gray-700">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Route:</span>
                  <span className="font-semibold dark:text-white">
                    {trip?.route?.from || trip?.from} → {trip?.route?.to || trip?.to}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Company:</span>
                  <span className="font-semibold dark:text-white">
                    {trip?.route?.company?.name || trip?.company?.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Departure:</span>
                  <span className="font-semibold dark:text-white">
                    {new Date(trip?.departureTime || trip?.departure_time).toLocaleString()}
                  </span>
                </div>
              </div>

              {selectedSeats.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-semibold dark:text-white">Selected Seats:</h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                    {selectedSeats.map(seatId => {
                      const seat = seatGrid.flat().find(s => s.id === seatId);
                      return (
                        <div key={seatId} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
                          <div>
                            <span className="font-semibold dark:text-white">{seatId}</span>
                            {seat?.features?.includes('Extra legroom') && (
                              <span className="ml-2 text-yellow-500">⭐</span>
                            )}
                          </div>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {new Intl.NumberFormat('fr-RW').format(seat?.price || 0)} RWF
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t dark:border-gray-700">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-lg font-semibold dark:text-white">Total Price:</span>
                  <span className="text-2xl font-extrabold text-green-600 dark:text-green-400">
                    {new Intl.NumberFormat('fr-RW').format(totalPrice)} RWF
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  {selectedSeats.length} seat{selectedSeats.length !== 1 ? 's' : ''} selected
                </p>
              </div>

              <button
                onClick={handleConfirm}
                disabled={selectedSeats.length === 0}
                className="w-full flex items-center justify-center px-6 py-3 rounded-lg bg-gradient-to-r from-yellow-400 to-yellow-500 text-[#0033A0] font-bold hover:from-yellow-500 hover:to-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5"
              >
                <LockClosedIcon className="w-5 h-5 mr-2" />
                Proceed to Payment
              </button>

              {selectedSeats.length === 0 && (
                <p className="text-sm text-center text-gray-500 dark:text-gray-400">
                  Select at least one seat to continue
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedSeatSelection;

