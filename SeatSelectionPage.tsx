import React, { useState, useEffect } from 'react';
import { ArrowLeftIcon, ArrowRightIcon } from './components/icons';
import * as api from './services/apiService';
import { useAuth } from './contexts/AuthContext';
import EnhancedSeatSelection from './components/EnhancedSeatSelection';

type SeatStatus = 'available' | 'occupied' | 'selected';

const Seat: React.FC<{ status: SeatStatus; id: string; onSelect: (id: string) => void; }> = ({ status, id, onSelect }) => {
  const isSelectable = status !== 'occupied';
  
  let seatClass = 'w-10 h-10 rounded-md flex items-center justify-center font-bold text-xs cursor-pointer transition-all duration-200';
  if (status === 'available') {
    seatClass += ' bg-blue-100 text-blue-800 hover:bg-blue-200 border-2 border-blue-200';
  } else if (status === 'occupied') {
    seatClass += ' bg-gray-300 text-gray-500 cursor-not-allowed';
  } else if (status === 'selected') {
    seatClass += ' bg-yellow-400 text-blue-900 ring-2 ring-yellow-500 animate-pop-in';
  }

  return <button onClick={() => isSelectable && onSelect(id)} className={seatClass} disabled={!isSelectable}>{id}</button>;
};

const generateSeatGrid = (seatMap: { [key: string]: string }, capacity: number) => {
    const grid: any[][] = [];
    const seats = Object.keys(seatMap).sort((a,b) => parseInt(a.slice(0, -1)) - parseInt(b.slice(0, -1)) || a.charCodeAt(a.length - 1) - b.charCodeAt(b.length - 1));
    
    let row: any[] = [];
    let currentRowNum = "1";
    seats.forEach(seatId => {
        const rowNum = seatId.slice(0, -1);
        if (rowNum !== currentRowNum) {
            grid.push(row);
            row = [];
            currentRowNum = rowNum;
        }
        
        // Add aisle placeholder
        if(seatId.endsWith('C') && !row.some(s => s.id === 'aisle')) {
            row.push({id: 'aisle'});
        }

        row.push({
            id: seatId,
            status: seatMap[seatId],
        });
    });
    grid.push(row); // push the last row
    return grid;
}

interface SeatSelectionPageProps {
  tripId: string;
  onConfirm: (bookingDetails: any) => void;
  onBack: () => void;
}

const SeatSelectionPage: React.FC<SeatSelectionPageProps> = ({ tripId, onConfirm, onBack }) => {
  // Use enhanced seat selection component
  return (
    <EnhancedSeatSelection
      tripId={tripId}
      onConfirm={onConfirm}
      onBack={onBack}
      maxSeats={10}
    />
  );
};

export default SeatSelectionPage;