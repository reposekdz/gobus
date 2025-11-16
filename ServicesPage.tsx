import React, { useState, FormEvent } from 'react';
import { Page } from './App';
import { ArchiveBoxIcon, BusIcon, BriefcaseIcon, MapIcon, ShieldCheckIcon, CreditCardIcon, ChevronRightIcon, TruckIcon, QuestionMarkCircleIcon } from './components/icons';
import PackageTrackingModal from './PackageTrackingModal';
import { useLanguage } from './contexts/LanguageContext';
import Modal from './components/Modal';

// --- Internal Components for Service Modals ---

const CorporateTravelForm = ({ onSave, t }) => (
    <form onSubmit={(e) => { e.preventDefault(); onSave(); }} className="space-y-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">{t('corporate_modal_desc')}</p>
        <div><label className="block text-sm font-medium">{t('corporate_modal_company')}</label><input type="text" className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700" required /></div>
        <div><label className="block text-sm font-medium">{t('corporate_modal_contact_name')}</label><input type="text" className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700" required /></div>
        <div><label className="block text-sm font-medium">{t('corporate_modal_contact_email')}</label><input type="email" className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700" required /></div>
        <div className="flex justify-end pt-4"><button type="submit" className="px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg">{t('corporate_modal_submit')}</button></div>
    </form>
);

const TourPackagesView = ({ t }) => (
    <div className="space-y-4 max-h-96 overflow-y-auto custom-scrollbar pr-2">
        <div className="p-4 rounded-lg bg-gray-100 dark:bg-gray-700/50">
            <h4 className="font-bold text-lg">{t('tours_modal_goriila_title')}</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">{t('tours_modal_goriila_desc')}</p>
            <button className="text-sm font-semibold text-blue-600 mt-2">{t('tours_modal_inquire')}</button>
        </div>
        <div className="p-4 rounded-lg bg-gray-100 dark:bg-gray-700/50">
            <h4 className="font-bold text-lg">{t('tours_modal_safari_title')}</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">{t('tours_modal_safari_desc')}</p>
            <button className="text-sm font-semibold text-blue-600 mt-2">{t('tours_modal_inquire')}</button>
        </div>
    </div>
);

const TravelInsuranceForm = ({ onSave, t }) => (
    <form onSubmit={(e) => { e.preventDefault(); onSave(); }} className="space-y-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">{t('insurance_modal_desc')}</p>
        <div><label className="block text-sm font-medium">{t('insurance_modal_travelers')}</label><input type="number" defaultValue="1" className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700" required /></div>
        <div><label className="block text-sm font-medium">{t('insurance_modal_start_date')}</label><input type="date" className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700" required /></div>
        <div className="flex justify-end pt-4"><button type="submit" className="px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg">{t('insurance_modal_submit')}</button></div>
    </form>
);

const GiftCardForm = ({ onSave, t }) => (
    <form onSubmit={(e) => { e.preventDefault(); onSave(); }} className="space-y-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">{t('gifts_modal_desc')}</p>
        <div><label className="block text-sm font-medium">{t('gifts_modal_amount')}</label><select className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700"><option>5,000</option><option>10,000</option><option>25,000</option></select></div>
        <div><label className="block text-sm font-medium">{t('gifts_modal_recipient_email')}</label><input type="email" className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700" required /></div>
        <div className="flex justify-end pt-4"><button type="submit" className="px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg">{t('gifts_modal_submit')}</button></div>
    </form>
);


interface ServicesPageProps {
    onNavigate: (page: Page, data?: any) => void;
}

const ServicesPage: React.FC<ServicesPageProps> = ({ onNavigate }) => {
    const { t } = useLanguage();
    const [trackingId, setTrackingId] = useState('');
    const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);
    const [activeService, setActiveService] = useState<any>(null);
    
    const allServices = [
        { id: 'packageDelivery', title: t('service_package_title'), description: t('service_package_desc'), icon: ArchiveBoxIcon, page: 'packageDelivery', isFeatured: true, category: 'logistics' },
        { id: 'busCharter', title: t('service_charter_title'), description: t('service_charter_desc'), icon: BusIcon, page: 'busCharter', isFeatured: true, category: 'transport' },
        { id: 'lostAndFound', title: t('service_lost_title'), description: t('service_lost_desc'), icon: QuestionMarkCircleIcon, page: 'lostAndFound', isFeatured: false, category: 'support' },
        { id: 'corporateTravel', title: t('service_corporate_title'), description: t('service_corporate_desc'), icon: BriefcaseIcon, page: 'corporateTravel', category: 'business' },
        { id: 'tourPackages', title: t('service_tours_title'), description: t('service_tours_desc'), icon: MapIcon, page: 'tourPackages', category: 'tourism' },
        { id: 'travelInsurance', title: t('service_insurance_title'), description: t('service_insurance_desc'), icon: ShieldCheckIcon, page: 'travelInsurance', category: 'insurance' },
        { id: 'giftCards', title: t('service_gifts_title'), description: t('service_gifts_desc'), icon: CreditCardIcon, page: 'giftCards', category: 'payment' },
        { id: 'hotelBooking', title: t('service_hotel_title'), description: t('service_hotel_desc'), icon: BriefcaseIcon, page: 'hotelBooking', category: 'accommodation' },
        { id: 'eventTickets', title: t('service_events_title'), description: t('service_events_desc'), icon: ArchiveBoxIcon, page: 'eventTickets', category: 'entertainment' },
        { id: 'vehicleRentals', title: t('service_rentals_title'), description: t('service_rentals_desc'), icon: TruckIcon, page: 'vehicleRentals', category: 'transport' },
        { id: 'vipLounge', title: t('service_vip_title'), description: t('service_vip_desc'), icon: ShieldCheckIcon, page: 'vipLounge', category: 'premium' }
    ];

    const handleTrackPackage = (e: FormEvent) => {
        e.preventDefault();
        if (trackingId) {
            setIsTrackingModalOpen(true);
        }
    };
    
    const handleServiceClick = (service: typeof allServices[0]) => {
        if (['packageDelivery', 'busCharter', 'lostAndFound'].includes(service.id)) {
            onNavigate(service.page as Page);
        } else {
            setActiveService(service);
        }
    };
    
    const renderServiceModalContent = () => {
        if (!activeService) return null;
        switch (activeService.id) {
            case 'corporateTravel': return <CorporateTravelForm t={t} onSave={() => { alert(t('alert_inquiry_sent')); setActiveService(null); }} />;
            case 'tourPackages': return <TourPackagesView t={t} />;
            case 'travelInsurance': return <TravelInsuranceForm t={t} onSave={() => { alert(t('alert_quote_ready', {amount: '5,000 RWF'})); setActiveService(null); }} />;
            case 'giftCards': return <GiftCardForm t={t} onSave={() => { alert(t('alert_gift_sent')); setActiveService(null); }} />;
            default: return null;
        }
    };

    return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
        <header className="bg-gradient-to-br from-blue-600 via-blue-700 to-green-600 text-white pt-20 pb-16">
            <div className="container mx-auto px-4 sm:px-6 text-center">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight mb-4">{t('services_title')}</h1>
                <p className="mt-4 max-w-3xl mx-auto text-lg sm:text-xl text-blue-100">
                    {t('services_subtitle')}
                </p>
                <div className="mt-8 flex flex-wrap justify-center gap-4">
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
                        <span className="text-2xl font-bold">{allServices.length}</span>
                        <p className="text-sm text-blue-100">{t('services_total_count')}</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
                        <span className="text-2xl font-bold">24/7</span>
                        <p className="text-sm text-blue-100">{t('services_support')}</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
                        <span className="text-2xl font-bold">100%</span>
                        <p className="text-sm text-blue-100">{t('services_reliable')}</p>
                    </div>
                </div>
            </div>
        </header>
        <main className="container mx-auto px-4 sm:px-6 py-12">
             <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-2xl shadow-xl mb-12 max-w-4xl mx-auto border border-gray-200 dark:border-gray-700">
                <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900/50 rounded-full mb-4">
                        <TruckIcon className="w-8 h-8 text-blue-600" />
                    </div>
                    <h2 className="text-2xl font-bold dark:text-white mb-2">{t('services_track_title')}</h2>
                    <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">{t('services_track_desc')}</p>
                </div>
                <form onSubmit={handleTrackPackage} className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                    <input 
                        type="text" 
                        value={trackingId} 
                        onChange={e => setTrackingId(e.target.value.toUpperCase())} 
                        placeholder={t('services_track_placeholder')} 
                        className="flex-grow p-4 border-2 border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-center sm:text-left font-mono" 
                    />
                    <button 
                        type="submit" 
                        className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 focus:ring-4 focus:ring-blue-300 transition-all transform hover:scale-105 shadow-lg"
                    >
                        {t('services_track_button')}
                    </button>
                </form>
            </div>
            
            {/* Featured Services */}
            <div className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{t('services_featured_title')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {allServices.filter(service => service.isFeatured).map(service => (
                        <button key={service.id} onClick={() => handleServiceClick(service)} className="w-full p-6 rounded-xl text-left flex items-start space-x-4 group transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 border-2 border-blue-200 dark:border-blue-700">
                            <div className="flex-shrink-0 p-3 rounded-lg bg-blue-100 dark:bg-blue-900/50">
                                <service.icon className="w-8 h-8 text-blue-600" />
                            </div>
                            <div className="flex-grow">
                                <p className="font-bold text-lg text-gray-800 dark:text-white">{service.title}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{service.description}</p>
                                <span className="inline-block mt-2 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">{t('services_featured_badge')}</span>
                            </div>
                            <ChevronRightIcon className="w-5 h-5 text-gray-400 flex-shrink-0 transform transition-transform group-hover:translate-x-1 mt-1" />
                        </button>
                    ))}
                </div>
            </div>

            {/* All Services */}
            <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{t('services_all_title')}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {allServices.map(service => (
                        <button key={service.id} onClick={() => handleServiceClick(service)} className="w-full p-4 rounded-xl text-left flex flex-col items-center space-y-3 group transition-all duration-300 hover:shadow-lg hover:-translate-y-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600">
                            <div className="flex-shrink-0 p-3 rounded-lg bg-gray-100 dark:bg-gray-700 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 transition-colors">
                                <service.icon className="w-6 h-6 text-gray-600 dark:text-gray-300 group-hover:text-blue-600 transition-colors" />
                            </div>
                            <div className="text-center">
                                <p className="font-semibold text-sm text-gray-800 dark:text-white mb-1">{service.title}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{service.description}</p>
                            </div>
                            {service.isFeatured && (
                                <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">{t('services_popular_badge')}</span>
                            )}
                        </button>
                    ))}
                </div>
            </div>
        </main>
        {isTrackingModalOpen && <PackageTrackingModal trackingId={trackingId} onClose={() => setIsTrackingModalOpen(false)} />}
        {activeService && (
            <Modal isOpen={!!activeService} onClose={() => setActiveService(null)} title={activeService.title}>
                {renderServiceModalContent()}
            </Modal>
        )}
    </div>
  );
};

export default ServicesPage;