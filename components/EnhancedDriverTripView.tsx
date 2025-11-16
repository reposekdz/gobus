import React, { useState, useEffect } from 'react';
import { QrCodeIcon, CheckCircleIcon, XCircleIcon, ClockIcon, UserIcon, PhoneIcon, TicketIcon, SearchIcon, FilterIcon } from './icons';
import AdvancedSeatMap from './AdvancedSeatMap';
import * as api from '../services/apiService';
import toast from 'react-hot-toast';
import { useSocket } from '../contexts/SocketContext';
import Modal from './Modal';

interface EnhancedDriverTripViewProps {
  trip: any;
  onBack: () => void;
  driverId: number;
}

const EnhancedDriverTripView: React.FC<EnhancedDriverTripViewProps> = ({ trip, onBack, driverId }) => {
  const [seatMap, setSeatMap] = useState<any>(null);
  const [passengers, setPassengers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [ticketId, setTicketId] = useState('');
  const [scanResult, setScanResult] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [selectedPassenger, setSelectedPassenger] = useState<any>(null);
  const [isPassengerModalOpen, setIsPassengerModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'booked' | 'checked_in' | 'no_show'>('all');
  const [tripStatus, setTripStatus] = useState(trip.status);
  const socket = useSocket();

  useEffect(() => {
    fetchTripData();
  }, [trip.id, driverId]);

  useEffect(() => {
    if (socket) {
      socket.emit('joinTripRoom', trip.id);

      const handlePassengerBoarded = ({ bookingId, newStatus }) => {
        setPassengers(prev => prev.map(p => 
          p.booking_id === bookingId ? { ...p, check_in_status: newStatus } : p
        ));
        fetchTripData(); // Refresh seat map
      };

      socket.on('passengerBoarded', handlePassengerBoarded);

      return () => {
        socket.off('passengerBoarded', handlePassengerBoarded);
      };
    }
  }, [socket, trip.id]);

  const fetchTripData = async () => {
    setIsLoading(true);
    try {
      const [seatMapData, passengersData] = await Promise.all([
        api.driverGetTripSeatMap(trip.id),
        api.driverGetTripPassengers(trip.id)
      ]);

      setSeatMap(seatMapData);
      setPassengers(passengersData || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load trip data');
      toast.error(err.message || 'Failed to load trip data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async () => {
    setScanResult(null);
    if (!ticketId) return;
    
    try {
      const result = await api.confirmBoarding(trip.id, ticketId);
      setScanResult({ type: 'success', message: `Welcome ${result.passengerName} (Seat: ${result.seat})` });
      setTicketId('');
      fetchTripData();
    } catch (e: any) {
      setScanResult({ type: 'error', message: e.message || 'Verification failed.' });
    }
  };

  const handleSeatClick = (seatId: string, seatInfo: any) => {
    if (seatInfo.status === 'available') return;
    
    const passenger = passengers.find(p => {
      const seats = JSON.parse(p.seat_numbers || '[]');
      return seats.includes(seatId);
    });
    
    if (passenger) {
      setSelectedPassenger({ ...passenger, seatId });
      setIsPassengerModalOpen(true);
    }
  };

  const handleCheckIn = async (bookingId: number, status: 'checked_in' | 'no_show', notes?: string) => {
    try {
      await api.driverConfirmBoarding(trip.id, bookingId, status, notes);
      toast.success(`Passenger marked as ${status === 'checked_in' ? 'checked in' : 'no show'}`);
      setIsPassengerModalOpen(false);
      setSelectedPassenger(null);
      fetchTripData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update passenger status');
    }
  };

  const handleUpdateTripStatus = async (newStatus: 'Departed' | 'Arrived') => {
    try {
      if (newStatus === 'Departed') {
        await api.departTrip(trip.id);
        setTripStatus('Departed');
        toast.success('Trip departed successfully');
      } else if (newStatus === 'Arrived') {
        await api.arriveTrip(trip.id);
        setTripStatus('Arrived');
        toast.success('Trip arrived successfully');
      }
    } catch (e: any) {
      toast.error(`Failed to update trip status: ${e.message}`);
    }
  };

  const filteredPassengers = passengers.filter(p => {
    const matchesSearch = !searchTerm || 
      p.passenger_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.booking_reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.passenger_phone?.includes(searchTerm);
    
    const matchesFilter = filterStatus === 'all' || 
      (filterStatus === 'checked_in' && p.check_in_status === 'checked_in') ||
      (filterStatus === 'no_show' && p.check_in_status === 'no_show') ||
      (filterStatus === 'booked' && (!p.check_in_status || p.check_in_status === 'pending'));
    
    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: passengers.length,
    booked: passengers.filter(p => !p.check_in_status || p.check_in_status === 'pending').length,
    checkedIn: passengers.filter(p => p.check_in_status === 'checked_in').length,
    noShow: passengers.filter(p => p.check_in_status === 'no_show').length
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading trip data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button onClick={onBack} className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-2 hover:underline">
            &larr; Back to Trip List
          </button>
          <h1 className="text-3xl font-bold dark:text-white">{trip.route || `${trip.from} → ${trip.to}`}</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Departure: {new Date(trip.date || trip.departure_time).toLocaleString()}
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => handleUpdateTripStatus('Departed')}
            disabled={tripStatus !== 'Scheduled' && tripStatus !== 'scheduled'}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:bg-gray-400 hover:bg-blue-700 transition"
          >
            Depart Trip
          </button>
          <button
            onClick={() => handleUpdateTripStatus('Arrived')}
            disabled={tripStatus !== 'Departed' && tripStatus !== 'departed'}
            className="px-4 py-2 bg-green-600 text-white rounded-lg disabled:bg-gray-400 hover:bg-green-700 transition"
          >
            Arrive Trip
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md">
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Passengers</p>
          <p className="text-2xl font-bold dark:text-white">{stats.total}</p>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-xl shadow-md">
          <p className="text-sm text-yellow-700 dark:text-yellow-400">Booked</p>
          <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">{stats.booked}</p>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl shadow-md">
          <p className="text-sm text-green-700 dark:text-green-400">Checked In</p>
          <p className="text-2xl font-bold text-green-700 dark:text-green-400">{stats.checkedIn}</p>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl shadow-md">
          <p className="text-sm text-red-700 dark:text-red-400">No Show</p>
          <p className="text-2xl font-bold text-red-700 dark:text-red-400">{stats.noShow}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Seat Map - Takes 2 columns */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
            <h2 className="text-xl font-bold mb-4 dark:text-white">Seat Map</h2>
            {seatMap ? (
              <AdvancedSeatMap
                totalSeats={seatMap.totalSeats || trip.bus?.capacity || 50}
                bookedSeats={seatMap.bookedSeats || []}
                seatDetails={seatMap.seatDetails || {}}
                onSeatClick={handleSeatClick}
                showPassengerInfo={true}
                interactive={true}
              />
            ) : (
              <p className="text-gray-500 dark:text-gray-400">Loading seat map...</p>
            )}
          </div>
        </div>

        {/* Right Column - Boarding & Passengers */}
        <div className="space-y-4">
          {/* Boarding Verification */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
            <h2 className="text-xl font-bold mb-4 dark:text-white">Boarding Verification</h2>
            <div className="space-y-3">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={ticketId}
                  onChange={e => setTicketId(e.target.value.toUpperCase())}
                  onKeyPress={e => e.key === 'Enter' && handleVerify()}
                  placeholder="Enter Ticket ID or Scan QR"
                  className="flex-grow p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
                <button
                  onClick={handleVerify}
                  className="px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
                >
                  <QrCodeIcon className="w-5 h-5" />
                </button>
              </div>
              {scanResult && (
                <div className={`p-3 rounded-lg text-sm font-semibold ${
                  scanResult.type === 'success'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
                    : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
                }`}>
                  {scanResult.message}
                </div>
              )}
            </div>
          </div>

          {/* Passenger List */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold dark:text-white">Passengers</h2>
              <div className="flex space-x-2">
                <div className="relative">
                  <SearchIcon className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder="Search..."
                    className="pl-8 pr-3 py-1 text-sm border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white w-32"
                  />
                </div>
                <select
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value as any)}
                  className="px-2 py-1 text-sm border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="all">All</option>
                  <option value="booked">Booked</option>
                  <option value="checked_in">Checked In</option>
                  <option value="no_show">No Show</option>
                </select>
              </div>
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
              {filteredPassengers.length === 0 ? (
                <p className="text-center text-gray-500 dark:text-gray-400 py-4">No passengers found</p>
              ) : (
                filteredPassengers.map((passenger) => {
                  const seats = JSON.parse(passenger.seat_numbers || '[]');
                  const isCheckedIn = passenger.check_in_status === 'checked_in';
                  const isNoShow = passenger.check_in_status === 'no_show';
                  
                  return (
                    <div
                      key={passenger.booking_id}
                      onClick={() => {
                        setSelectedPassenger(passenger);
                        setIsPassengerModalOpen(true);
                      }}
                      className={`p-3 rounded-lg border-2 cursor-pointer transition hover:shadow-md ${
                        isCheckedIn
                          ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700'
                          : isNoShow
                          ? 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700'
                          : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-sm dark:text-white">{passenger.passenger_name}</p>
                          <div className="flex items-center space-x-2 mt-1 text-xs text-gray-600 dark:text-gray-400">
                            <span>Seat: {seats.join(', ')}</span>
                            {passenger.passenger_phone && (
                              <>
                                <span>•</span>
                                <span>{passenger.passenger_phone}</span>
                              </>
                            )}
                          </div>
                          {passenger.booking_reference && (
                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                              Ref: {passenger.booking_reference}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          {isCheckedIn && <CheckCircleIcon className="w-5 h-5 text-green-600" />}
                          {isNoShow && <XCircleIcon className="w-5 h-5 text-red-600" />}
                          {!isCheckedIn && !isNoShow && <ClockIcon className="w-5 h-5 text-yellow-600" />}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Passenger Details Modal */}
      {selectedPassenger && (
        <Modal
          isOpen={isPassengerModalOpen}
          onClose={() => {
            setIsPassengerModalOpen(false);
            setSelectedPassenger(null);
          }}
          title="Passenger Details"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Passenger Name
              </label>
              <p className="text-lg font-semibold dark:text-white">{selectedPassenger.passenger_name}</p>
            </div>
            
            {selectedPassenger.passenger_phone && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Phone Number
                </label>
                <p className="text-lg dark:text-white">{selectedPassenger.passenger_phone}</p>
              </div>
            )}

            {selectedPassenger.passenger_email && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email
                </label>
                <p className="text-lg dark:text-white">{selectedPassenger.passenger_email}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Seats
              </label>
              <p className="text-lg dark:text-white">
                {JSON.parse(selectedPassenger.seat_numbers || '[]').join(', ')}
              </p>
            </div>

            {selectedPassenger.booking_reference && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Booking Reference
                </label>
                <p className="text-lg font-mono dark:text-white">{selectedPassenger.booking_reference}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                selectedPassenger.check_in_status === 'checked_in'
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
                  : selectedPassenger.check_in_status === 'no_show'
                  ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
                  : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300'
              }`}>
                {selectedPassenger.check_in_status === 'checked_in' ? 'Checked In' :
                 selectedPassenger.check_in_status === 'no_show' ? 'No Show' : 'Booked'}
              </span>
            </div>

            {selectedPassenger.check_in_time && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Check-in Time
                </label>
                <p className="text-lg dark:text-white">
                  {new Date(selectedPassenger.check_in_time).toLocaleString()}
                </p>
              </div>
            )}

            <div className="flex space-x-3 pt-4 border-t dark:border-gray-700">
              {selectedPassenger.check_in_status !== 'checked_in' && (
                <button
                  onClick={() => handleCheckIn(selectedPassenger.booking_id, 'checked_in')}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition"
                >
                  <CheckCircleIcon className="w-5 h-5 inline mr-2" />
                  Check In
                </button>
              )}
              {selectedPassenger.check_in_status !== 'no_show' && (
                <button
                  onClick={() => handleCheckIn(selectedPassenger.booking_id, 'no_show')}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition"
                >
                  <XCircleIcon className="w-5 h-5 inline mr-2" />
                  Mark No Show
                </button>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default EnhancedDriverTripView;

