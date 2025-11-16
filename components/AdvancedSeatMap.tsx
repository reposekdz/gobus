import React, { useState, useMemo } from 'react';
import { UserIcon, CheckCircleIcon, ClockIcon, XCircleIcon } from './icons';

interface Seat {
  id: string;
  status: 'available' | 'booked' | 'checked_in' | 'no_show';
  passengerName?: string;
  passengerPhone?: string;
  bookingId?: number;
  bookingReference?: string;
  checkInTime?: string;
}

interface AdvancedSeatMapProps {
  totalSeats: number;
  bookedSeats: string[];
  seatDetails: Record<string, any[]>;
  onSeatClick?: (seatId: string, seatInfo: any) => void;
  showPassengerInfo?: boolean;
  interactive?: boolean;
}

const AdvancedSeatMap: React.FC<AdvancedSeatMapProps> = ({
  totalSeats,
  bookedSeats,
  seatDetails,
  onSeatClick,
  showPassengerInfo = true,
  interactive = true
}) => {
  const [selectedSeat, setSelectedSeat] = useState<string | null>(null);
  const [hoveredSeat, setHoveredSeat] = useState<string | null>(null);

  // Generate seat grid (4 seats per row: A, B, C, D)
  const seatGrid = useMemo(() => {
    const grid: Seat[][] = [];
    const rows = Math.ceil(totalSeats / 4);
    
    for (let row = 1; row <= rows; row++) {
      const rowSeats: Seat[] = [];
      const seats = ['A', 'B', 'C', 'D'];
      
      for (const seatLetter of seats) {
        const seatId = `${row}${seatLetter}`;
        const seatIndex = (row - 1) * 4 + seats.indexOf(seatLetter);
        
        if (seatIndex >= totalSeats) break;
        
        const isBooked = bookedSeats.includes(seatId);
        const details = seatDetails[seatId] || [];
        const latestDetail = details[0] || {};
        
        let status: Seat['status'] = 'available';
        if (isBooked) {
          if (latestDetail.checkInStatus === 'checked_in') {
            status = 'checked_in';
          } else if (latestDetail.checkInStatus === 'no_show') {
            status = 'no_show';
          } else {
            status = 'booked';
          }
        }
        
        rowSeats.push({
          id: seatId,
          status,
          passengerName: latestDetail.passengerName,
          passengerPhone: latestDetail.passengerPhone,
          bookingId: latestDetail.bookingId,
          bookingReference: latestDetail.bookingReference,
          checkInTime: latestDetail.checkInTime
        });
      }
      
      if (rowSeats.length > 0) {
        grid.push(rowSeats);
      }
    }
    
    return grid;
  }, [totalSeats, bookedSeats, seatDetails]);

  const getSeatColor = (seat: Seat) => {
    switch (seat.status) {
      case 'available':
        return 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-600';
      case 'booked':
        return 'bg-yellow-400 dark:bg-yellow-600 text-yellow-900 dark:text-yellow-100 border-yellow-500 dark:border-yellow-700';
      case 'checked_in':
        return 'bg-green-500 dark:bg-green-600 text-white border-green-600 dark:border-green-700';
      case 'no_show':
        return 'bg-red-400 dark:bg-red-600 text-white border-red-500 dark:border-red-700';
      default:
        return 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400';
    }
  };

  const getSeatIcon = (seat: Seat) => {
    switch (seat.status) {
      case 'checked_in':
        return <CheckCircleIcon className="w-3 h-3" />;
      case 'no_show':
        return <XCircleIcon className="w-3 h-3" />;
      case 'booked':
        return <ClockIcon className="w-3 h-3" />;
      default:
        return null;
    }
  };

  const handleSeatClick = (seat: Seat) => {
    if (!interactive || seat.status === 'available') return;
    
    setSelectedSeat(selectedSeat === seat.id ? null : seat.id);
    if (onSeatClick) {
      onSeatClick(seat.id, seat);
    }
  };

  const stats = useMemo(() => {
    const booked = seatGrid.flat().filter(s => s.status === 'booked').length;
    const checkedIn = seatGrid.flat().filter(s => s.status === 'checked_in').length;
    const noShow = seatGrid.flat().filter(s => s.status === 'no_show').length;
    const available = seatGrid.flat().filter(s => s.status === 'available').length;
    
    return { booked, checkedIn, noShow, available, total: totalSeats };
  }, [seatGrid, totalSeats]);

  return (
    <div className="space-y-4">
      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg text-center">
          <p className="text-2xl font-bold text-gray-600 dark:text-gray-400">{stats.available}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400">Available</p>
        </div>
        <div className="bg-yellow-100 dark:bg-yellow-900/30 p-3 rounded-lg text-center">
          <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">{stats.booked}</p>
          <p className="text-xs text-yellow-700 dark:text-yellow-400">Booked</p>
        </div>
        <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-lg text-center">
          <p className="text-2xl font-bold text-green-700 dark:text-green-400">{stats.checkedIn}</p>
          <p className="text-xs text-green-700 dark:text-green-400">Checked In</p>
        </div>
        <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-lg text-center">
          <p className="text-2xl font-bold text-red-700 dark:text-red-400">{stats.noShow}</p>
          <p className="text-xs text-red-700 dark:text-red-400">No Show</p>
        </div>
        <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg text-center">
          <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">{stats.total}</p>
          <p className="text-xs text-blue-700 dark:text-blue-400">Total</p>
        </div>
      </div>

      {/* Seat Map */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
        {/* Driver/Exit indicator */}
        <div className="mb-6 text-center">
          <div className="inline-block bg-gray-300 dark:bg-gray-700 px-6 py-2 rounded-lg">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">🚌 Driver / Exit</p>
          </div>
        </div>

        {/* Seat Grid */}
        <div className="space-y-2">
          {seatGrid.map((row, rowIndex) => (
            <div key={rowIndex} className="flex justify-center items-center gap-2">
              {/* Row number */}
              <div className="w-8 text-center text-sm font-semibold text-gray-600 dark:text-gray-400">
                {rowIndex + 1}
              </div>
              
              {/* Seats */}
              <div className="flex gap-2">
                {row.map((seat, seatIndex) => {
                  const isSelected = selectedSeat === seat.id;
                  const isHovered = hoveredSeat === seat.id;
                  
                  return (
                    <div key={seat.id} className="relative">
                      <button
                        onClick={() => handleSeatClick(seat)}
                        onMouseEnter={() => setHoveredSeat(seat.id)}
                        onMouseLeave={() => setHoveredSeat(null)}
                        disabled={!interactive || seat.status === 'available'}
                        className={`
                          w-12 h-12 rounded-lg border-2 font-semibold text-xs
                          transition-all duration-200
                          ${getSeatColor(seat)}
                          ${interactive && seat.status !== 'available' ? 'cursor-pointer hover:scale-110 hover:shadow-lg' : 'cursor-default'}
                          ${isSelected ? 'ring-4 ring-blue-500 dark:ring-blue-400 ring-offset-2' : ''}
                          ${isHovered && seat.status !== 'available' ? 'scale-105' : ''}
                          flex flex-col items-center justify-center
                        `}
                        title={seat.status === 'available' ? 'Available' : `${seat.passengerName || 'Booked'} - ${seat.id}`}
                      >
                        {getSeatIcon(seat)}
                        <span className="mt-0.5">{seat.id}</span>
                      </button>
                      
                      {/* Passenger info tooltip */}
                      {showPassengerInfo && isHovered && seat.status !== 'available' && (
                        <div className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg shadow-xl p-3">
                          <div className="font-semibold mb-1">{seat.passengerName || 'Unknown'}</div>
                          {seat.passengerPhone && (
                            <div className="text-gray-300">📞 {seat.passengerPhone}</div>
                          )}
                          {seat.bookingReference && (
                            <div className="text-gray-300">🎫 {seat.bookingReference}</div>
                          )}
                          {seat.checkInTime && (
                            <div className="text-gray-300">✓ Checked in</div>
                          )}
                          <div className="mt-1 pt-1 border-t border-gray-600">
                            <div className="text-gray-400">Seat: {seat.id}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
                
                {/* Aisle */}
                {seatIndex === 1 && (
                  <div className="w-8"></div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-6 flex flex-wrap justify-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <span className="dark:text-gray-300">Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-400 dark:bg-yellow-600 rounded"></div>
            <span className="dark:text-gray-300">Booked</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 dark:bg-green-600 rounded"></div>
            <span className="dark:text-gray-300">Checked In</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-400 dark:bg-red-600 rounded"></div>
            <span className="dark:text-gray-300">No Show</span>
          </div>
        </div>
      </div>

      {/* Selected Seat Details */}
      {selectedSeat && showPassengerInfo && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          {(() => {
            const seat = seatGrid.flat().find(s => s.id === selectedSeat);
            if (!seat || seat.status === 'available') return null;
            
            return (
              <div>
                <h4 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">
                  Seat {seat.id} Details
                </h4>
                <div className="space-y-1 text-sm">
                  <div><strong>Passenger:</strong> {seat.passengerName || 'N/A'}</div>
                  {seat.passengerPhone && (
                    <div><strong>Phone:</strong> {seat.passengerPhone}</div>
                  )}
                  {seat.bookingReference && (
                    <div><strong>Booking:</strong> {seat.bookingReference}</div>
                  )}
                  <div><strong>Status:</strong> 
                    <span className={`ml-2 px-2 py-0.5 rounded text-xs ${
                      seat.status === 'checked_in' ? 'bg-green-200 text-green-800' :
                      seat.status === 'no_show' ? 'bg-red-200 text-red-800' :
                      'bg-yellow-200 text-yellow-800'
                    }`}>
                      {seat.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};

export default AdvancedSeatMap;

