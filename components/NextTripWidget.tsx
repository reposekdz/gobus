import React from 'react';
import { BusIcon, ArrowRightIcon, XIcon, MapIcon } from './icons';

interface NextTripWidgetProps {
    trip: {
        route: string;
        departureTime: string;
        company: string;
    };
    onDismiss: () => void;
    onTrack: () => void;
}

const NextTripWidget: React.FC<NextTripWidgetProps> = ({ trip, onDismiss, onTrack }) => {
    return (
        <div className="fixed bottom-0 left-0 right-0 z-40 p-4 animate-fade-in">
            <div className="container mx-auto">
                <div className="bg-gradient-to-r from-[#0033A0] to-[#0c2461] dark:from-gray-800 dark:to-black text-white rounded-xl shadow-2xl p-4 flex items-center justify-between space-x-4 relative">
                    <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0 bg-yellow-400 p-2 rounded-lg">
                            <BusIcon className="w-6 h-6 text-[#0033A0]" />
                        </div>
                        <div>
                            <p className="text-xs text-yellow-300 font-semibold">URUGENDO RUTAHA</p>
                            <p className="font-bold">{trip.route}</p>
                            <p className="text-sm text-gray-300">{trip.departureTime} - {trip.company}</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <button onClick={onTrack} className="px-4 py-2 text-sm font-semibold bg-white/10 rounded-lg hover:bg-white/20 transition-colors flex items-center">
                            <MapIcon className="w-4 h-4 mr-2" />
                            Kurikirana
                        </button>
                        <button onClick={onDismiss} className="p-2 rounded-full hover:bg-white/10 transition-colors">
                           <XIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NextTripWidget;
