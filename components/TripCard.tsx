import React from 'react';
import { apiService } from '../lib/api-services';

interface TripCardProps {
  trip: {
    id: number;
    departure_time: string;
    arrival_time: string;
    origin: string;
    destination: string;
    base_price: number;
    company_name: string;
    plate_number: string;
    model: string;
    available_seats: number;
  };
}

export const TripCard: React.FC<TripCardProps> = ({ trip }) => {
  const handleBook = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please login to book a trip');
      return;
    }

    const seatNumbers = ['A1']; // Simple seat selection
    
    try {
      await apiService.post('/bookings', {
        trip_id: trip.id,
        seat_numbers: seatNumbers
      });
      
      alert('Booking successful!');
    } catch (error) {
      alert('Booking failed. Please try again.');
    }
  };

  const formatTime = (datetime: string) => {
    return new Date(datetime).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-semibold text-lg">{trip.company_name}</h3>
          <p className="text-gray-600">{trip.model} - {trip.plate_number}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-blue-600">{trip.base_price} RWF</p>
          <p className="text-sm text-gray-500">{trip.available_seats} seats left</p>
        </div>
      </div>
      
      <div className="flex justify-between items-center mb-4">
        <div className="text-center">
          <p className="text-sm text-gray-500">Departure</p>
          <p className="font-semibold">{formatTime(trip.departure_time)}</p>
          <p className="text-sm">{trip.origin}</p>
        </div>
        
        <div className="flex-1 mx-4">
          <div className="border-t-2 border-dashed border-gray-300 relative">
            <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-gray-300 rounded-full w-4 h-4"></div>
          </div>
        </div>
        
        <div className="text-center">
          <p className="text-sm text-gray-500">Arrival</p>
          <p className="font-semibold">{formatTime(trip.arrival_time)}</p>
          <p className="text-sm">{trip.destination}</p>
        </div>
      </div>
      
      <button
        onClick={handleBook}
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition-colors"
      >
        Book Now
      </button>
    </div>
  );
};