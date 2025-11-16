import React, { useState } from 'react';
import { XIcon, WifiIcon, AcIcon, PowerIcon, ChevronRightIcon } from './icons';

interface FleetDetailModalProps {
    bus: any;
    onClose: () => void;
}

const AmenityIcon: React.FC<{ amenity: string }> = ({ amenity }) => {
    const iconClass = "w-5 h-5 text-blue-600 dark:text-blue-400";
    if (amenity === 'WiFi') return <div className="flex items-center space-x-2"><WifiIcon className={iconClass} /> <span>WiFi</span></div>;
    if (amenity === 'AC') return <div className="flex items-center space-x-2"><AcIcon className={iconClass} /> <span>AC</span></div>;
    if (amenity === 'Charging') return <div className="flex items-center space-x-2"><PowerIcon className={iconClass} /> <span>Aho gusharija</span></div>;
    return null;
};

const FleetDetailModal: React.FC<FleetDetailModalProps> = ({ bus, onClose }) => {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const images = [bus.image, ...bus.images360];

    const nextImage = () => {
        setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 max-w-3xl w-full relative max-h-[90vh] overflow-y-auto custom-scrollbar">
                <button onClick={onClose} className="absolute top-4 right-4 p-1 rounded-full text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-600 dark:hover:text-gray-200 transition-colors z-10">
                    <XIcon className="w-6 h-6" />
                </button>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Image Viewer */}
                    <div className="space-y-4">
                        <div className="relative aspect-video bg-gray-200 dark:bg-gray-900 rounded-lg overflow-hidden">
                            <img src={images[currentImageIndex]} alt={bus.name} className="w-full h-full object-cover transition-opacity duration-300" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                            <button onClick={nextImage} className="absolute top-1/2 right-2 transform -translate-y-1/2 bg-white/20 backdrop-blur-sm p-2 rounded-full text-white hover:bg-white/40 transition">
                                <ChevronRightIcon className="w-5 h-5"/>
                            </button>
                             <div className="absolute bottom-2 left-2 px-2 py-1 text-xs bg-black/50 text-white rounded-md">360° Reba</div>
                        </div>
                         <div className="flex space-x-2">
                            {images.map((img: string, index: number) => (
                                <button key={index} onClick={() => setCurrentImageIndex(index)} className={`w-1/4 aspect-video rounded-md overflow-hidden border-2 ${currentImageIndex === index ? 'border-blue-500' : 'border-transparent'}`}>
                                    <img src={img} alt="" className="w-full h-full object-cover"/>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Details */}
                    <div>
                        <h3 className="text-2xl font-bold mb-2 dark:text-white">{bus.name}</h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">Imyanya: {bus.capacity}</p>
                        
                        <div className="border-t dark:border-gray-700 pt-4 mb-4">
                            <h4 className="font-semibold mb-2">Ibyiza by'imbere</h4>
                            <div className="flex flex-wrap gap-4 text-sm text-gray-700 dark:text-gray-300">
                                {bus.amenities.map((amenity: string) => <AmenityIcon key={amenity} amenity={amenity} />)}
                            </div>
                        </div>

                        <div className="border-t dark:border-gray-700 pt-4">
                            <h4 className="font-semibold mb-2">Ibya tekiniki</h4>
                            <ul className="text-sm space-y-1 text-gray-600 dark:text-gray-400">
                                <li><strong>Moteri:</strong> {bus.specs.engine}</li>
                                <li><strong>Imbaraga:</strong> {bus.specs.power}</li>
                                <li><strong>Ibindi:</strong> {bus.specs.features}</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FleetDetailModal;
