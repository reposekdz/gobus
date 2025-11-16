import React from 'react';
import { BusIcon } from './icons';

const LiveBusTrackerMap = () => {
    return (
        <section className="bg-gray-50 dark:bg-gray-900">
            <div className="container mx-auto px-6">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight sm:text-4xl">Real-Time Fleet Tracker</h2>
                    <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-600 dark:text-gray-400">
                        See our network of buses moving across the country right now.
                    </p>
                </div>
                <div className="relative h-[500px] bg-gray-200 dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg border-4 border-white dark:border-gray-700">
                    <img src="https://www.researchgate.net/publication/322968537/figure/fig1/AS:631631525920800@1527604113101/Administrative-map-of-Rwanda-showing-the-four-provinces-and-the-capital-city-Kigali.png" alt="Map of Rwanda" className="w-full h-full object-contain opacity-20 dark:opacity-10"/>
                    <div className="absolute inset-0">
                        {/* Mock Bus 1 */}
                        <div className="absolute text-blue-500 animate-move-bus-1">
                             <BusIcon className="w-7 h-7 transform -rotate-45" />
                        </div>
                         {/* Mock Bus 2 */}
                        <div className="absolute text-green-500 animate-move-bus-2">
                             <BusIcon className="w-6 h-6 transform rotate-90" />
                        </div>
                        {/* Mock Bus 3 */}
                        <div className="absolute text-yellow-500 animate-move-bus-3">
                             <BusIcon className="w-5 h-5 transform rotate-12" />
                        </div>
                    </div>
                </div>
            </div>
             <style>{`
                @keyframes move-bus-1 {
                    0% { top: 20%; left: 60%; }
                    50% { top: 40%; left: 45%; }
                    100% { top: 20%; left: 60%; }
                }
                .animate-move-bus-1 { animation: move-bus-1 25s linear infinite; }

                @keyframes move-bus-2 {
                    0% { top: 70%; left: 30%; }
                    50% { top: 50%; left: 40%; }
                    100% { top: 70%; left: 30%; }
                }
                .animate-move-bus-2 { animation: move-bus-2 20s linear infinite reverse; }

                @keyframes move-bus-3 {
                    0% { top: 80%; left: 55%; }
                    50% { top: 60%; left: 65%; }
                    100% { top: 80%; left: 55%; }
                }
                .animate-move-bus-3 { animation: move-bus-3 30s linear infinite; }
            `}</style>
        </section>
    );
};

export default LiveBusTrackerMap;