import React, { useRef, useEffect } from 'react';
import { toCanvas } from 'qrcode';
import { XIcon, BusIcon } from './components/icons';
import { useLanguage } from './contexts/LanguageContext';

const RealQRCode: React.FC<{ ticketData: any; size: number }> = ({ ticketData, size }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current && ticketData) {
      const qrDataString = JSON.stringify({
        bookingId: ticketData.id,
        passenger: ticketData.passenger,
        route: `${ticketData.from} to ${ticketData.to}`,
        datetime: `${ticketData.date} at ${ticketData.time}`,
        seats: ticketData.seats,
        busPlate: ticketData.busPlate,
      });

      toCanvas(canvasRef.current, qrDataString, {
        width: size,
        margin: 1,
        color: {
          dark: '#002B7F', // GoBus dark blue
          light: '#FFFFFFFF',
        },
        errorCorrectionLevel: 'H', // High error correction
      }, (error) => {
        if (error) console.error('QR Code generation failed:', error);
      });
    }
  }, [ticketData, size]);

  return <canvas ref={canvasRef} style={{ width: size, height: size }} />;
};


const InfoRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <div className="py-3 border-b border-dashed border-gray-300 dark:border-gray-600">
        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">{label}</p>
        <p className="font-bold text-gray-800 dark:text-white text-lg">{value}</p>
    </div>
);

const TicketModal: React.FC<{ ticket: any; onClose: () => void, isActive?: boolean }> = ({ ticket, onClose, isActive = false }) => {
  const { t } = useLanguage();
  if (!ticket) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 animate-fade-in backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-gray-50 dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm transform transition-transform duration-300 scale-95 animate-scale-in"
        onClick={e => e.stopPropagation()}
      >
        <header className="bg-gradient-to-r from-blue-600 to-green-500 p-6 rounded-t-2xl text-white relative animated-gradient-bg">
            <button onClick={onClose} className="absolute top-3 right-3 p-1 rounded-full bg-white/20 hover:bg-white/40 transition-colors">
                <XIcon className="w-5 h-5"/>
            </button>
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                     <BusIcon className="w-8 h-8"/>
                     <h2 className="text-2xl font-bold">{t('ticket_modal_title')}</h2>
                </div>
                {isActive && (
                    <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>
                        <span className="text-xs font-bold tracking-wider">LIVE</span>
                    </div>
                )}
            </div>
            <p className="text-sm opacity-80 mt-1">{ticket.company}</p>
        </header>

        <main className="p-6">
            <div className="flex items-center justify-center mb-4">
                <div className={`p-2 bg-white rounded-lg transition-shadow duration-300 ${isActive ? 'activated-ticket-glow' : 'shadow-md'}`}>
                    <RealQRCode ticketData={ticket} size={164} />
                </div>
            </div>
             {isActive ? (
                <p className="text-center font-bold text-lg text-green-500 animate-pulse">{t('ticket_modal_activated')}</p>
            ) : (
                <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-6">{t('ticket_modal_scan_prompt')}</p>
            )}
            
            <div className="space-y-2">
                <InfoRow label={t('ticket_modal_passenger')} value={ticket.passenger} />
                <InfoRow label={t('ticket_modal_route')} value={`${ticket.from} to ${ticket.to}`} />
                <InfoRow label={t('ticket_modal_datetime')} value={`${ticket.date} at ${ticket.time}`} />
                <div className="flex pt-3">
                    <div className="w-1/2 pr-2">
                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">{t('ticket_modal_seats')}</p>
                        <p className="font-bold text-gray-800 dark:text-white text-lg">{ticket.seats}</p>
                    </div>
                     <div className="w-1/2 pl-2">
                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">{t('ticket_modal_plate')}</p>
                        <p className="font-bold text-gray-800 dark:text-white text-lg">{ticket.busPlate}</p>
                    </div>
                </div>
            </div>
        </main>
        
        <footer className="p-4 bg-gray-100 dark:bg-gray-900 rounded-b-2xl">
            <p className="text-xs text-center text-gray-500 dark:text-gray-400">{t('ticket_modal_id')}: {ticket.id}</p>
        </footer>
      </div>
      <style>{`
        @keyframes scaleIn {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-scale-in {
          animation: scaleIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default TicketModal;