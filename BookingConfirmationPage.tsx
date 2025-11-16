import React, { useRef, useEffect } from 'react';
import html2canvas from 'html2canvas';
import { toCanvas } from 'qrcode';
import { Page } from './App';
import { CheckCircleIcon, ArrowUpTrayIcon, TicketIcon, ArrowRightIcon, ShareIcon } from './components/icons';

const RealQRCode: React.FC<{ ticketData: any; size: number }> = ({ ticketData, size }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current && ticketData) {
      const qrDataString = JSON.stringify({
        bookingId: ticketData.bookingId,
        passenger: ticketData.passengerName,
        route: `${ticketData.from} to ${ticketData.to}`,
        datetime: `${new Date(ticketData.createdAt).toLocaleDateString()} at ${ticketData.departureTime}`,
        seats: Array.isArray(ticketData.seats) ? ticketData.seats.join(', ') : ticketData.seats,
      });

      toCanvas(canvasRef.current, qrDataString, {
        width: size,
        margin: 1,
        color: {
          dark: '#002B7F',
          light: '#FFFFFFFF',
        },
        errorCorrectionLevel: 'H',
      }, (error) => {
        if (error) console.error('QR Code generation failed:', error);
      });
    }
  }, [ticketData, size]);

  return (
    <div className="p-2 bg-white">
      <canvas ref={canvasRef} style={{ width: size, height: size }} />
    </div>
  );
};


// FIX: Changed to a named export to resolve a circular dependency with App.tsx.
export const BookingConfirmationPage: React.FC<{ bookingDetails: any, onNavigate: (page: Page) => void }> = ({ bookingDetails, onNavigate }) => {
    const ticketRef = useRef<HTMLDivElement>(null);

    const handleDownload = () => {
        if (ticketRef.current) {
            html2canvas(ticketRef.current, { backgroundColor: '#ffffff' }).then(canvas => {
                const link = document.createElement('a');
                link.download = `GoBus-Ticket-${bookingDetails.bookingId}.png`;
                link.href = canvas.toDataURL('image/png');
                link.click();
            });
        }
    };

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: 'My GoBus Ticket',
                text: `I just booked a trip from ${bookingDetails.from} to ${bookingDetails.to} on GoBus! #GoBus #RwandaTravel`,
                url: window.location.href
            }).catch((error) => console.log('Error sharing', error));
        } else {
            alert('Web Share API is not supported in your browser.');
        }
    };
    
    if (!bookingDetails) {
        // This can happen if the page is refreshed.
        return (
            <div className="min-h-screen flex flex-col items-center justify-center text-center p-4">
                 <h1 className="text-2xl font-bold mb-4 dark:text-white">Booking Confirmed!</h1>
                <p className="text-gray-600 dark:text-gray-400 mb-4">Your booking details have been sent to your email.</p>
                <button onClick={() => onNavigate('bookings')} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">View My Bookings</button>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
            <div className="max-w-4xl w-full mx-auto">
                <div className="text-center mb-8">
                    <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4"/>
                    <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white">Booking Confirmed!</h1>
                    <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">Your trip is scheduled. Your e-ticket is ready below.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Ticket */}
                    <div ref={ticketRef} className="md:col-span-2 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
                         <div className="p-8">
                             <div className="flex justify-between items-start border-b-2 border-dashed pb-4">
                                <div>
                                    <p className="text-sm text-gray-500">{bookingDetails.company}</p>
                                    <h2 className="text-3xl font-bold">{bookingDetails.from} <ArrowRightIcon className="inline w-6 h-6"/> {bookingDetails.to}</h2>
                                </div>
                                <div className="text-right">
                                     <p className="text-sm text-gray-500">Booking ID</p>
                                     <p className="font-mono font-bold text-blue-600">{bookingDetails.bookingId}</p>
                                </div>
                            </div>
                            <div className="flex flex-col sm:flex-row mt-6">
                                <div className="flex-grow space-y-4">
                                     <div><p className="text-xs uppercase text-gray-400">Passenger</p><p className="font-semibold text-lg">{bookingDetails.passengerName}</p></div>
                                     <div><p className="text-xs uppercase text-gray-400">Date</p><p className="font-semibold text-lg">{new Date(bookingDetails.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric'})}</p></div>
                                     <div className="flex space-x-8">
                                        <div><p className="text-xs uppercase text-gray-400">Time</p><p className="font-semibold text-lg">{bookingDetails.departureTime}</p></div>
                                        <div><p className="text-xs uppercase text-gray-400">Seats</p><p className="font-semibold text-lg">{Array.isArray(bookingDetails.seats) ? bookingDetails.seats.join(', ') : bookingDetails.seats}</p></div>
                                     </div>
                                </div>
                                <div className="flex-shrink-0 mt-6 sm:mt-0 sm:ml-6">
                                    <RealQRCode ticketData={bookingDetails} size={140} />
                                </div>
                            </div>
                         </div>
                          <div className="bg-gray-100 dark:bg-gray-700/50 p-4 text-right">
                            <p className="text-sm text-gray-500">Total Paid</p>
                            <p className="text-2xl font-bold text-green-600">{new Intl.NumberFormat('fr-RW').format(bookingDetails.totalPrice)} RWF</p>
                        </div>
                    </div>
                    {/* Actions */}
                    <div className="space-y-4">
                         <button onClick={handleDownload} className="w-full flex items-center justify-center p-4 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 transition-colors">
                            <ArrowUpTrayIcon className="w-6 h-6 mr-3"/>
                            Download Ticket
                        </button>
                         <button onClick={handleShare} className="w-full flex items-center justify-center p-4 bg-green-500 text-white font-bold rounded-xl shadow-lg hover:bg-green-600 transition-colors">
                            <ShareIcon className="w-6 h-6 mr-3"/>
                            Share My Trip
                        </button>
                        <button onClick={() => onNavigate('bookings')} className="w-full flex items-center justify-center p-4 bg-white dark:bg-gray-700 text-gray-800 dark:text-white font-bold rounded-xl shadow-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                            <TicketIcon className="w-6 h-6 mr-3"/>
                            View My Bookings
                        </button>
                         <button onClick={() => onNavigate('home')} className="w-full p-4 text-center text-gray-600 dark:text-gray-400 font-semibold hover:underline">
                            Book Another Trip
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};