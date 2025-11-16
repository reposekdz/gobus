import React, { useState, useMemo, useEffect } from 'react';
import { ClockIcon, MapPinIcon, ChevronRightIcon, BusIcon, WifiIcon, AcIcon, PowerIcon, StarIcon, UsersIcon, MapIcon, BriefcaseIcon, TvIcon, ShieldCheckIcon, ArrowRightIcon, CameraIcon, EnvelopeIcon, XIcon, PaperAirplaneIcon, TagIcon, ArchiveBoxIcon, PhoneIcon } from './components/icons';
import FleetDetailModal from './components/FleetDetailModal';
// FIX: Changed import to a named import as StarRating is not a default export.
import { StarRating } from './components/StarRating';
import * as api from './services/apiService';
import LoadingSpinner from './components/LoadingSpinner';

const AmenityIcon: React.FC<{ amenity: string; withText?: boolean }> = ({ amenity, withText = false }) => {
    const iconClass = withText ? "w-6 h-6 text-blue-600 dark:text-blue-400" : "w-4 h-4 text-gray-500 dark:text-gray-400";
    const containerClass = withText ? "flex flex-col items-center text-center p-4 rounded-lg bg-gray-100 dark:bg-gray-800" : "";
    
    let IconComponent;
    let text = amenity;

    switch (amenity) {
        case 'WiFi':
            IconComponent = WifiIcon;
            break;
        case 'AC':
        case 'Air Conditioning':
            IconComponent = AcIcon;
            text = 'Air Conditioning';
            break;
        case 'Charging':
        case 'Charging Ports':
            IconComponent = PowerIcon;
            text = 'Charging Ports';
            break;
        case 'On-board Restroom':
            IconComponent = UsersIcon;
            break;
        case 'Luggage Allowance':
            IconComponent = BriefcaseIcon;
            break;
        case 'On-board Entertainment':
        case 'TV':
            IconComponent = TvIcon;
            break;
        case 'Safety Briefing':
            IconComponent = ShieldCheckIcon;
            break;
        default:
            return null;
    }
    
    if (withText) {
        return (
            <div className={containerClass}>
                <IconComponent className={iconClass} />
                <span className="text-sm mt-2 text-gray-700 dark:text-gray-300">{text}</span>
            </div>
        );
    }
    return <IconComponent className={iconClass} />;
};


interface CompanyProfilePageProps {
  company: { id: string; name: string; logoText: string };
  onSelectTrip: (from?: string, to?: string, date?: string, passengers?: any, companyId?: string) => void;
}

const PhotoViewerModal: React.FC<{ images: string[], startIndex: number, onClose: () => void }> = ({ images, startIndex, onClose }) => {
    const [currentIndex, setCurrentIndex] = useState(startIndex);

    const nextImage = () => setCurrentIndex(prev => (prev + 1) % images.length);
    const prevImage = () => setCurrentIndex(prev => (prev - 1 + images.length) % images.length);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight') nextImage();
            if (e.key === 'ArrowLeft') prevImage();
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [images]);

    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/30 transition-colors z-20">
                <XIcon className="w-6 h-6" />
            </button>
            <div className="relative w-full max-w-4xl h-full flex flex-col items-center justify-center" onClick={e => e.stopPropagation()}>
                <img src={images[currentIndex]} alt="Company gallery" className="max-h-[80vh] max-w-[90vw] w-auto h-auto rounded-lg shadow-2xl mb-4" />
                {images.length > 1 && (
                    <div className="w-full max-w-xl overflow-x-auto custom-scrollbar">
                        <div className="flex space-x-2 p-2 justify-center">
                            {images.map((img, index) => (
                                <button key={index} onClick={() => setCurrentIndex(index)} className={`flex-shrink-0 w-20 h-20 rounded-md overflow-hidden border-2 transition-colors ${currentIndex === index ? 'border-white' : 'border-transparent hover:border-white/50'}`}>
                                    <img src={img} alt={`thumbnail ${index + 1}`} className="w-full h-full object-cover"/>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
                {images.length > 1 && (
                    <>
                        <button onClick={prevImage} className="absolute left-0 top-1/2 -translate-y-1/2 p-3 bg-white/10 text-white rounded-full hover:bg-white/30 transition-colors ml-2 md:ml-[-50px]">
                            <ChevronRightIcon className="w-6 h-6 transform rotate-180" />
                        </button>
                        <button onClick={nextImage} className="absolute right-0 top-1/2 -translate-y-1/2 p-3 bg-white/10 text-white rounded-full hover:bg-white/30 transition-colors mr-2 md:mr-[-50px]">
                            <ChevronRightIcon className="w-6 h-6" />
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

const CompanyProfilePage: React.FC<CompanyProfilePageProps> = ({ company: initialCompanyData, onSelectTrip }) => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedBus, setSelectedBus] = useState(null);
  const [activeTab, setActiveTab] = useState('about');
  const [fromLocation, setFromLocation] = useState('');
  const [toLocation, setToLocation] = useState('');
  const [viewingPhotoIndex, setViewingPhotoIndex] = useState<number | null>(null);
  const [galleryFilter, setGalleryFilter] = useState('all');

  useEffect(() => {
    const fetchCompanyDetails = async () => {
        if (!initialCompanyData?.id) {
            setError('Company ID is missing.');
            setIsLoading(false);
            return;
        }
        try {
            setIsLoading(true);
            const companyDetails = await api.getCompanyProfileDetails(initialCompanyData.id);
            setData(companyDetails);
        } catch (err: any) {
            setError(err.message || 'Failed to load company details.');
        } finally {
            setIsLoading(false);
        }
    };
    fetchCompanyDetails();
  }, [initialCompanyData?.id]);
  
  const company = data || {};
  const averageRating = company.reviews?.length > 0 ? company.reviews.reduce((acc: number, r: any) => acc + r.rating, 0) / company.reviews.length : 0;
  
  const uniqueFromLocations = useMemo(() => [...new Set((company.routes || []).map((r: any) => r.from))], [company.routes]);
  const availableToLocations = useMemo(() => {
    if (!fromLocation) return [];
    return (company.routes || []).filter((r: any) => r.from === fromLocation).map((r: any) => r.to);
  }, [fromLocation, company.routes]);
  
  const scheduleForRoute = company.schedule?.[`${fromLocation}-${toLocation}`] || [];

  const filteredGallery = useMemo(() => {
    if (!company.gallery) return [];
    if (galleryFilter === 'all') return company.gallery;
    return company.gallery.filter((img: any) => img.category === galleryFilter);
  }, [galleryFilter, company.gallery]);

  const galleryCategories = useMemo(() => {
    if (!company.gallery) return [];
    const categories = new Set(company.gallery.map(img => img.category));
    return ['all', ...Array.from(categories)];
  }, [company.gallery]);

  const TabButton: React.FC<{tabName: string; label: string}> = ({ tabName, label }) => (
    <button
        onClick={() => setActiveTab(tabName)}
        className={`px-4 py-3 text-sm font-semibold transition-colors duration-300 whitespace-nowrap ${activeTab === tabName ? 'border-b-2 border-yellow-400 text-blue-600 dark:text-yellow-300' : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-300'}`}
    >
        {label}
    </button>
  );
  
  if (isLoading) return <LoadingSpinner />;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
  if (!data) return <div className="p-8 text-center">Company not found.</div>;

  return (
    <div className="bg-white dark:bg-gray-900">
      {/* Hero Section */}
      <div className="relative h-72 bg-gray-300 dark:bg-gray-700">
        {company.cover_url ? (
            <img src={company.cover_url} alt={`${company.name} cover`} className="w-full h-full object-cover" />
        ) : (
            <div className="w-full h-full bg-gradient-to-r from-gray-400 to-gray-600"></div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
        <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 md:left-12 md:translate-x-0 w-full md:w-auto">
            <div className="container mx-auto px-6 flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6">
                <div className="w-32 h-32 flex items-center justify-center rounded-full bg-white dark:bg-gray-800 shadow-xl border-4 border-white dark:border-gray-700 p-2">
                    {company.logo_url ? (
                        <img src={company.logo_url} alt={`${company.name} logo`} className="w-full h-full object-contain"/>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-200 rounded-full">
                            <span className="text-4xl font-bold text-gray-500">{company.name ? company.name.charAt(0) : '?'}</span>
                        </div>
                    )}
                </div>
                <div className="text-center md:text-left pt-4 md:pt-16">
                    <h2 className="text-4xl font-bold text-gray-800 dark:text-white drop-shadow-lg">{company.name}</h2>
                    <div className="flex items-center justify-center md:justify-start space-x-2 mt-1">
                        <StarRating rating={averageRating} />
                        <span className="text-gray-600 dark:text-gray-400 text-sm">({(company.reviews || []).length} reviews)</span>
                    </div>
                </div>
            </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12 pt-24">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="border-b border-gray-200 dark:border-gray-700 mb-8 overflow-x-auto custom-scrollbar">
                <nav className="flex space-x-4">
                    <TabButton tabName="about" label="About" />
                    <TabButton tabName="schedule" label="Schedule" />
                    <TabButton tabName="services" label="Services" />
                    <TabButton tabName="promotions" label="Promotions" />
                    <TabButton tabName="reviews" label="Reviews" />
                    <TabButton tabName="gallery" label="Gallery" />
                    <TabButton tabName="fleet" label="Fleet" />
                    <TabButton tabName="contact" label="Contact" />
                </nav>
            </div>
            <div className="animate-fade-in">
              {activeTab === 'about' && (
                <div className="space-y-12">
                    <div className="bg-white dark:bg-gray-800/30 p-6 rounded-lg shadow-sm border dark:border-gray-700/50">
                        <h3 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">About Us</h3>
                        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{company.description}</p>
                    </div>
                </div>
              )}
               {activeTab === 'reviews' && (
                 <div>
                    <h3 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">Customer Reviews</h3>
                    {(company.reviews || []).length > 0 ? (
                        <div className="space-y-6">
                            {company.reviews.map((review: any, index: number) => (
                                <div key={index} className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border dark:border-gray-700/50">
                                   <div className="flex items-center mb-2">
                                       <StarRating rating={review.rating} size="small" />
                                       <p className="ml-3 font-bold text-sm text-gray-800 dark:text-gray-200">{review.author}</p>
                                   </div>
                                   <p className="text-gray-600 dark:text-gray-400 text-sm italic">"{review.comment}"</p>
                                </div>
                            ))}
                        </div>
                    ) : <p className="text-gray-500 dark:text-gray-400">No reviews have been submitted for this company yet.</p>}
                </div>
              )}
              {activeTab === 'schedule' && (
                 <div>
                     <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-lg shadow-sm border dark:border-gray-700/50">
                        <h3 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">Find Trip Schedule</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            <select value={fromLocation} onChange={e => { setFromLocation(e.target.value); setToLocation(''); }} className="w-full p-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-400/50 focus:outline-none">
                                <option value="">-- Select Origin --</option>
                                {uniqueFromLocations.map((loc: string) => <option key={loc} value={loc}>{loc}</option>)}
                            </select>
                            <select value={toLocation} onChange={e => setToLocation(e.target.value)} disabled={!fromLocation} className="w-full p-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-400/50 focus:outline-none disabled:opacity-50">
                                <option value="">-- Select Destination --</option>
                                {availableToLocations.map((loc: string) => <option key={loc} value={loc}>{loc}</option>)}
                            </select>
                        </div>
                        <div className="space-y-4">
                            {fromLocation && toLocation && scheduleForRoute.length > 0 ? (
                                scheduleForRoute.map((trip: any, index: number) => (
                                    <div key={index} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0">
                                        <div className="flex items-center space-x-4">
                                            <ClockIcon className="w-6 h-6 text-blue-500" />
                                            <div>
                                                <p className="font-bold text-lg dark:text-white">{trip.time} <ArrowRightIcon className="w-4 h-4 inline mx-1"/> {trip.arrival}</p>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">{trip.bus}</p>
                                            </div>
                                        </div>
                                        <div className="text-lg font-bold text-green-600 dark:text-green-400">{trip.price}</div>
                                        <button onClick={() => onSelectTrip(fromLocation, toLocation, new Date().toISOString().split('T')[0], undefined, company.id)} className="px-4 py-2 text-sm font-semibold rounded-md bg-gradient-to-r from-yellow-400 to-yellow-500 text-[#0033A0] hover:from-yellow-500 hover:to-yellow-600 transition-all">Book Ticket</button>
                                    </div>
                                ))
                            ) : (
                                <p className="text-center text-gray-500 dark:text-gray-400 py-4">Please select a route to view available times.</p>
                            )}
                        </div>
                     </div>
                </div>
              )}
              {activeTab === 'fleet' && (
                <div>
                  <h3 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">Our Fleet</h3>
                  {(company.fleet || []).length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {(company.fleet || []).map((bus: any) => (
                            <button key={bus.id} onClick={() => setSelectedBus(bus)} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden transform hover:scale-[1.02] transition-transform duration-300 text-left group border dark:border-gray-700/50 hover:shadow-yellow-400/20">
                                <div className="relative h-40">
                                    <img src={bus.image} alt={bus.model} className="w-full h-full object-cover" />
                                </div>
                                <div className="p-4">
                                    <h4 className="font-bold text-lg">{bus.model}</h4>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Capacity: {bus.capacity}</p>
                                    <div className="flex flex-wrap gap-x-4 gap-y-2 mt-2">
                                        {(bus.amenities || '').split(',').map((amenity: string) => (
                                            <AmenityIcon key={amenity} amenity={amenity} />
                                        ))}
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                  ) : <p className="text-gray-500 dark:text-gray-400">Fleet information is not available.</p>}
                </div>
              )}
              {activeTab === 'gallery' && (
                  <div>
                      <h3 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">Gallery</h3>
                      {company.gallery?.length > 0 ? (
                          <>
                              <div className="flex flex-wrap gap-2 mb-6">
                                  {galleryCategories.map((cat: string) => (
                                      <button key={cat} onClick={() => setGalleryFilter(cat)} className={`px-4 py-2 text-sm font-semibold capitalize transition-all rounded-full ${galleryFilter === cat ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>
                                          {cat}
                                      </button>
                                  ))}
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                  {filteredGallery.map((img, index) => (
                                      <button key={img.id || index} onClick={() => setViewingPhotoIndex(index)} className="aspect-square bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden group">
                                          <img src={img.src} alt={`${company.name} gallery image`} className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-300"/>
                                      </button>
                                  ))}
                              </div>
                          </>
                      ) : (
                          <p className="text-gray-500 dark:text-gray-400">This company has not uploaded any photos yet.</p>
                      )}
                  </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <aside>
            <div className="sticky top-24 space-y-6">
                 <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-6 shadow-lg border dark:border-gray-700/50">
                    <h4 className="text-xl font-bold mb-4 dark:text-white">Company Info</h4>
                    <ul className="space-y-3 text-sm">
                        <li className="flex items-start">
                            <MapPinIcon className="w-5 h-5 mr-3 mt-1 flex-shrink-0 text-gray-400" /> 
                            <span className="text-gray-700 dark:text-gray-300">{company.address || 'N/A'}</span>
                        </li>
                    </ul>
                </div>
            </div>
          </aside>
        </div>
      </div>
      {selectedBus && <FleetDetailModal bus={selectedBus} onClose={() => setSelectedBus(null)} />}
      {viewingPhotoIndex !== null && <PhotoViewerModal images={filteredGallery.map(g => g.src)} startIndex={viewingPhotoIndex} onClose={() => setViewingPhotoIndex(null)} />}
    </div>
  );
};

export default CompanyProfilePage;