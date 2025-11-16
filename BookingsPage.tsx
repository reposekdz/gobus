import React, { useState, useEffect } from 'react';
import { TicketIcon, QrCodeIcon, ArrowPathIcon, ShareIcon, StarIcon, CheckCircleIcon } from './components/icons';
import Modal from './components/Modal';
// FIX: Changed import to a named import as StarRating is not a default export.
import { StarRating } from './components/StarRating';
import * as api from './services/apiService';
import { useAuth } from './contexts/AuthContext';

const RateTripModal: React.FC<{ booking: any, onClose: () => void, onSubmit: (rating: number, comment: string) => void }> = ({ booking, onClose, onSubmit }) => {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');

    const handleSubmit = () => {
        onSubmit(rating, comment);
    };

    return (
        <Modal isOpen={true} onClose={onClose} title={`Rate Your Trip to ${booking.trip.route.to}`}>
            <div className="space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">How was your journey with {booking.trip.route.company.name}?</p>
                <div className="flex justify-center py-2">
                    <StarRating rating={rating} onRatingChange={setRating} isInteractive={true} size="large" />
                </div>
                <div>
                    <label className="text-sm font-medium">Comments (optional)</label>
                    <textarea value={comment} onChange={e => setComment(e.target.value)} rows={3} className="w-full mt-1 p-2 border rounded-md dark:bg-gray-700" placeholder="Tell us more..."/>
                </div>
                <div className="flex justify-end pt-2">
                    <button onClick={handleSubmit} disabled={rating === 0} className="px-5 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400">
                        Submit Rating
                    </button>
                </div>
            </div>
        </Modal>
    );
};


interface BookingCardProps {
    booking: any;
    onViewTicket: (ticketDetails: any, isActive: boolean) => void;
    onRateTrip: (booking: any) => void;
    onActivate: (ticketId: string) => void;
    isPast: boolean;
    isActivatable: boolean;
    isTicketActive: boolean;
}

const BookingCard: React.FC<BookingCardProps> = ({ booking, onViewTicket, onRateTrip, onActivate, isPast, isActivatable, isTicketActive }) => {
    const { trip } = booking;
    const { route } = trip;
    const { user } = useAuth();
    
    const ticketDetails = {
        id: booking.bookingId,
        from: route.from,
        to: route.to,
        company: route.company.name,
        date: new Date(trip.departureTime).toLocaleDateString(),
        time: new Date(trip.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        seats: booking.seats.join(', '),
        price: `${new Intl.NumberFormat('fr-RW').format(booking.totalPrice)} RWF`,
        passenger: user?.name,
        busPlate: 'N/A' // This data isn't in the model yet
    };

    return (
        <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden my-4 transform hover:shadow-xl transition-shadow duration-300 ${isTicketActive ? 'shadow-green-500/30 border-2 border-green-400' : ''}`}>
            <div className="flex flex-col sm:flex-row">
                <div className="p-5 flex-grow">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{route.company.name}</p>
                            <h3 className="text-xl font-bold text-gray-800 dark:text-white">{route.from} to {route.to}</h3>
                        </div>
                        <div className="text-right">
                            <p className="font-bold text-lg text-green-600 dark:text-green-400">{new Intl.NumberFormat('fr-RW').format(booking.totalPrice)} RWF</p>
                            <p className="text-xs text-gray-500">{booking.bookingId}</p>
                        </div>
                    </div>
                    <div className="border-t dark:border-gray-700 mt-3 pt-3 flex space-x-6 text-sm">
                        <div><p className="text-xs text-gray-500">Date</p><p className="font-semibold dark:text-gray-200">{new Date(trip.departureTime).toLocaleDateString()}</p></div>
                        <div><p className="text-xs text-gray-500">Time</p><p className="font-semibold dark:text-gray-200">{new Date(trip.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p></div>
                        <div><p className="text-xs text-gray-500">Seats</p><p className="font-semibold dark:text-gray-200">{booking.seats.join(', ')}</p></div>
                    </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 p-5 flex items-center justify-center sm:w-40">
                    <button onClick={() => onViewTicket(ticketDetails, isTicketActive)} className="flex flex-col items-center text-blue-600 dark:text-blue-400 font-semibold text-sm hover:opacity-80">
                        <QrCodeIcon className="w-8 h-8 mb-1" />
                        <span>View Ticket</span>
                    </button>
                </div>
            </div>
            <div className="bg-gray-100 dark:bg-gray-700/50 px-5 py-2 flex items-center justify-between">
                <div>
                     {isActivatable && !isTicketActive && (
                        <button 
                            onClick={() => onActivate(booking.bookingId)}
                            className="bg-green-500 text-white font-bold py-1 px-3 rounded-full text-xs hover:bg-green-600 interactive-button"
                        >
                            Activate Ticket for Boarding
                        </button>
                    )}
                     {isTicketActive && (
                        <div className="flex items-center text-green-600 font-bold text-xs animate-pulse">
                            <CheckCircleIcon className="w-4 h-4 mr-1.5"/>
                            Ticket is Active for Boarding
                        </div>
                    )}
                </div>
                <div className="flex items-center justify-end space-x-4">
                    {isPast ? (
                        <>
                        <button onClick={() => onRateTrip(booking)} className="flex items-center text-xs font-semibold text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                            <StarIcon className="w-4 h-4 mr-1.5"/>
                            Rate Trip
                        </button>
                        <button onClick={() => alert(`Re-booking trip from ${route.from} to ${route.to}...`)} className="flex items-center text-xs font-semibold text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                            <ArrowPathIcon className="w-4 h-4 mr-1.5"/>
                            Re-book Trip
                        </button>
                        </>
                    ) : (
                        <button onClick={() => alert(`Sharing trip details for ${booking.bookingId}...`)} className="flex items-center text-xs font-semibold text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                            <ShareIcon className="w-4 h-4 mr-1.5"/>
                            Share Trip
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};


interface BookingsPageProps {
    onViewTicket: (ticket: any, isActive: boolean) => void;
}

const BookingsPage: React.FC<BookingsPageProps> = ({ onViewTicket }) => {
  const [activeTab, setActiveTab] = useState('upcoming');
  const [ratingTrip, setRatingTrip] = useState<any | null>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchBookings = async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const data = await api.getMyBookings();
            setBookings(data);
        } catch (err: any) {
            setError(err.message || "Failed to fetch bookings.");
        } finally {
            setIsLoading(false);
        }
    };
    fetchBookings();
  }, [user]);

  const handleRatingSubmit = (rating: number, comment: string) => {
      console.log('Rating submitted:', { bookingId: ratingTrip?.id, rating, comment });
      alert(`Thank you for your ${rating}-star rating!`);
      setRatingTrip(null);
  };
  
  const now = new Date();
  const upcomingBookings = bookings.filter(b => new Date(b.trip.departureTime) >= now);
  const pastBookings = bookings.filter(b => new Date(b.trip.departureTime) < now);

  const renderContent = () => {
      if (isLoading) return <p className="text-center dark:text-white">Loading your bookings...</p>
      if (error) return <p className="text-center text-red-500">{error}</p>

      const bookingsToDisplay = activeTab === 'upcoming' ? upcomingBookings : pastBookings;

      if (bookingsToDisplay.length === 0) {
          return <p className="text-center text-gray-500">No {activeTab} bookings found.</p>
      }

      return (
        <div className="space-y-4">
            {bookingsToDisplay.map(booking => {
                 const departureTime = new Date(booking.trip.departureTime);
                 const hoursUntilDeparture = (departureTime.getTime() - now.getTime()) / (1000 * 60 * 60);
                 const isActivatable = activeTab === 'upcoming' && hoursUntilDeparture > 0 && hoursUntilDeparture <= 24;
                 const isTicketActive = activeTicketId === booking.bookingId;

                 return (
                    <BookingCard 
                        key={booking._id} 
                        booking={booking} 
                        onViewTicket={onViewTicket} 
                        onRateTrip={setRatingTrip} 
                        onActivate={setActiveTicketId}
                        isPast={activeTab === 'past'}
                        isActivatable={isActivatable}
                        isTicketActive={isTicketActive}
                    />
                );
            })}
        </div>
      );
  }

  return (
    <div className="bg-gray-100/50 dark:bg-gray-900/50 min-h-screen">
        <header className="bg-white dark:bg-gray-800 shadow-sm pt-12 pb-8">
            <div className="container mx-auto px-6">
                <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">My Bookings</h1>
                <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">Review your upcoming and past trips.</p>
            </div>
        </header>
        <main className="container mx-auto px-6 py-8">
            <div className="mb-6 border-b border-gray-300 dark:border-gray-700">
                <nav className="flex space-x-6">
                    <button onClick={() => setActiveTab('upcoming')} className={`py-3 px-1 text-sm font-semibold transition-colors ${activeTab === 'upcoming' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
                        Upcoming ({upcomingBookings.length})
                    </button>
                    <button onClick={() => setActiveTab('past')} className={`py-3 px-1 text-sm font-semibold transition-colors ${activeTab === 'past' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
                        Past ({pastBookings.length})
                    </button>
                </nav>
            </div>
            
            <div>
                {renderContent()}
            </div>
        </main>
         {ratingTrip && (
            <RateTripModal 
                booking={ratingTrip} 
                onClose={() => setRatingTrip(null)}
                onSubmit={handleRatingSubmit}
            />
        )}
    </div>
  );
};

export default BookingsPage;
