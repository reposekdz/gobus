import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import HeroSection from './components/HeroSection';
import HowItWorks from './components/HowItWorks';
import OurPartners from './components/PartnerCompanies';
import Footer from './components/Footer';
import LoginPage from './LoginPage';
import RegisterPage from './RegisterPage';
import RegistrationSuccessPage from './RegistrationSuccessPage';
import SearchResultsPage from './SearchResultsPage';
import SeatSelectionPage from './SeatSelectionPage';
import BookingsPage from './BookingsPage';
import ProfilePage from './ProfilePage';
import CompaniesPage from './CompaniesPage';
import CompanyProfilePage from './CompanyProfilePage';
import HelpPage from './HelpPage';
import ContactPage from './ContactPage';
import ScheduledTripsPage from './ScheduledTripsPage';
import AdminLayout from './admin/AdminLayout';
import CompanyLayout from './company/CompanyLayout';
import DriverDashboard from './DriverDashboard';
import AgentDashboard from './AgentDashboard';
import ServicesPage from './ServicesPage';
import PackageDeliveryPage from './PackageDeliveryPage';
import BusCharterPage from './BusCharterPage';
import BookingSearchPage from './BookingSearchPage';
import BottomNavigation from './components/BottomNavigation';
// FIX: Changed import to be a named import to resolve module loading issue.
import { TicketModal } from './components/TicketModal';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import DriverProfilePage from './DriverProfilePage';
import AgentProfilePage from './AgentProfilePage';
import PassengerProfilePage from './PassengerProfilePage';
import LostAndFoundPage from './LostAndFoundPage';
import CorporateTravelPage from './CorporateTravelPage';
import TourPackagesPage from './TourPackagesPage';
import GiftCardsPage from './GiftCardsPage';
import TravelInsurancePage from './TravelInsurancePage';
import FeaturedDestinations from './components/FeaturedDestinations';
import Testimonials from './components/Testimonials';
import HotelBookingPage from './HotelBookingPage';
import EventTicketsPage from './EventTicketsPage';
import VehicleRentalsPage from './VehicleRentalsPage';
import VipLoungePage from './VipLoungePage';
import WhyChooseUs from './components/WhyChooseUs';
import SpecialOffers from './components/SpecialOffers';
// FIX: Changed import for BookingConfirmationPage to be a named import to resolve a circular dependency.
import { BookingConfirmationPage } from './BookingConfirmationPage';
import FavoritesPage from './FavoritesPage';
import PriceAlertsPage from './PriceAlertsPage';
import LoyaltyPage from './LoyaltyPage';
import PaymentPage from './PaymentPage';
import WalletPage from './WalletPage';
import { useAuth, AuthProvider } from './contexts/AuthContext';
import LoadingSpinner from './components/LoadingSpinner';
import NotificationHandler from './components/NotificationHandler';
import DriverSettingsPage from './DriverSettingsPage';
import PromotedCompanies from './components/PromotedCompanies';
import WalletPINSetupPage from './WalletPINSetupPage';


export type Page = 
  | 'home' | 'login' | 'register' | 'bookings' | 'scheduled' | 'search' 
  | 'seatSelection' | 'payment' | 'profile' | 'companies' 
  | 'companyProfile' | 'help' | 'contact' | 'services' | 'packageDelivery' 
  | 'busCharter' | 'lostAndFound' | 'adminDashboard' | 'companyDashboard' | 'driverDashboard' 
  | 'agentDashboard' | 'adminCompanies' | 'adminDrivers' | 'adminAgents' 
  | 'adminUsers' | 'adminFinancials' | 'adminAds' 
  | 'adminPromotions' | 'companyBuses' | 'companyDrivers' | 'companyRoutes' 
  | 'companyPassengers' | 'companyFinancials' | 'companySettings' 
  | 'fleetMonitoring' | 'driverProfile' | 'agentProfile' | 'bookingSearch' | 'passengerProfile'
  | 'corporateTravel' | 'tourPackages' | 'travelInsurance' | 'giftCards' | 'adminAnnouncements'
  | 'hotelBooking' | 'eventTickets' | 'vehicleRentals' | 'vipLounge' | 'companyRouteAnalytics'
  | 'bookingConfirmation' | 'favorites' | 'priceAlerts' | 'loyalty' | 'wallet' | 'companyDriverProfile'
  | 'adminMessages' | 'adminSettings' | 'adminDestinations' | 'registrationSuccess' | 'driverSettings'
  | 'walletPinSetup';


const AppContent: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [pageData, setPageData] = useState<any>(null);
  const { user, logout, isLoading } = useAuth();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [viewingTicket, setViewingTicket] = useState<{ ticket: any; isActive: boolean } | null>(null);
  const [favoriteTripIds, setFavoriteTripIds] = useState<string[]>([]);
  const { t } = useLanguage();

  useEffect(() => {
    const storedFavorites = localStorage.getItem('favoriteTrips');
    if (storedFavorites) {
        setFavoriteTripIds(JSON.parse(storedFavorites));
    }
    
    const handleFavoritesChange = () => {
        const updatedFavorites = localStorage.getItem('favoriteTrips');
        setFavoriteTripIds(updatedFavorites ? JSON.parse(updatedFavorites) : []);
    };

    window.addEventListener('favoritesChanged', handleFavoritesChange);
    return () => {
        window.removeEventListener('favoritesChanged', handleFavoritesChange);
    };
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentPage]);


  const navigate = (page: Page, data?: any) => {
    setCurrentPage(page);
    setPageData(data);
  };

  const handleLogout = () => {
    logout();
    navigate('home');
  };
  
  const handleToggleFavorite = (tripId: string) => {
      const newFavorites = favoriteTripIds.includes(tripId)
          ? favoriteTripIds.filter(id => id !== tripId)
          : [...favoriteTripIds, tripId];
      
      setFavoriteTripIds(newFavorites);
      localStorage.setItem('favoriteTrips', JSON.stringify(newFavorites));
      window.dispatchEvent(new CustomEvent('favoritesChanged'));
  };

  const handleSearch = (from?: string, to?: string, date?: string, passengers?: { adults: number; children: number; }) => {
      navigate('bookingSearch', { from, to, date, passengers });
  }

  if (isLoading) {
      return <LoadingSpinner />;
  }

  const renderPage = () => {
    // If user has a role, redirect to their dashboard on first load or login
    if (currentPage === 'home' && user) {
        if (user.role === 'admin') return <AdminLayout currentPage={'adminDashboard'} navigate={navigate} theme={theme} setTheme={setTheme} onLogout={handleLogout}/>;
        if (user.role === 'company') return <CompanyLayout currentPage={'companyDashboard'} navigate={navigate} pageData={pageData} companyData={user} theme={theme} setTheme={setTheme} onLogout={handleLogout}/>;
        if (user.role === 'driver') return <DriverDashboard driverData={user} navigate={navigate} onLogout={handleLogout} theme={theme} setTheme={setTheme} />;
        if (user.role === 'agent') return <AgentDashboard agentData={user} navigate={navigate} onLogout={handleLogout} theme={theme} setTheme={setTheme} />;
    }

    // If not logged in, force login page for protected routes
    const protectedPages: Page[] = ['bookings', 'profile', 'favorites', 'priceAlerts', 'loyalty', 'wallet'];
    if (!user && protectedPages.includes(currentPage)) {
        return <LoginPage />;
    }

    switch (currentPage) {
      case 'login': return <LoginPage />;
      case 'register': return <RegisterPage onNavigate={navigate} />;
      case 'registrationSuccess': return <RegistrationSuccessPage onNavigate={navigate} />;
      case 'walletPinSetup': return <WalletPINSetupPage onNavigate={navigate} />;
      case 'search': return <SearchResultsPage results={pageData} onTripSelect={(tripId) => navigate('seatSelection', { tripId })} favoriteTripIds={favoriteTripIds} onToggleFavorite={handleToggleFavorite} />;
      case 'seatSelection': return <SeatSelectionPage tripId={pageData.tripId} onConfirm={(bookingDetails) => navigate('payment', bookingDetails)} onBack={() => navigate('bookingSearch')} />;
      case 'payment': return <PaymentPage bookingDetails={pageData} onNavigate={navigate} />;
      case 'bookingConfirmation': return <BookingConfirmationPage bookingDetails={pageData} onNavigate={navigate} />;
      case 'bookings': return <BookingsPage onViewTicket={(ticket, isActive) => setViewingTicket({ ticket, isActive })} />;
      case 'profile': return <ProfilePage onNavigate={navigate} />;
      case 'scheduled': return <ScheduledTripsPage onSearch={handleSearch}/>;
      case 'companies': return <CompaniesPage onNavigate={navigate} />;
      case 'companyProfile': return <CompanyProfilePage company={pageData} onSelectTrip={handleSearch} />;
      case 'help': return <HelpPage />;
      case 'contact': return <ContactPage />;
      case 'services': return <ServicesPage onNavigate={navigate} />;
      case 'packageDelivery': return <PackageDeliveryPage onNavigate={navigate} />;
      case 'busCharter': return <BusCharterPage onNavigate={navigate} />;
      case 'lostAndFound': return <LostAndFoundPage onNavigate={navigate} />;
      case 'bookingSearch': return <BookingSearchPage searchParams={pageData} onNavigate={navigate} />;
      case 'corporateTravel': return <CorporateTravelPage onNavigate={navigate} />;
      case 'tourPackages': return <TourPackagesPage onNavigate={navigate} />;
      case 'travelInsurance': return <TravelInsurancePage onNavigate={navigate} />;
      case 'giftCards': return <GiftCardsPage onNavigate={navigate} />;
      case 'hotelBooking': return <HotelBookingPage onNavigate={navigate} />;
      case 'eventTickets': return <EventTicketsPage onNavigate={navigate} />;
      case 'vehicleRentals': return <VehicleRentalsPage onNavigate={navigate} />;
      case 'vipLounge': return <VipLoungePage onNavigate={navigate} />;
      case 'favorites': return <FavoritesPage onNavigate={navigate} />;
      case 'priceAlerts': return <PriceAlertsPage onNavigate={navigate} user={user} />;
      case 'loyalty': return <LoyaltyPage user={user} onNavigate={navigate} />;
      case 'wallet': return <WalletPage onNavigate={navigate} />;
      
      case 'adminDashboard': case 'adminCompanies': case 'adminDrivers': case 'adminAgents': case 'adminUsers': case 'adminFinancials': case 'adminAds': case 'adminPromotions': case 'adminAnnouncements': case 'adminMessages': case 'adminSettings': case 'adminDestinations':
        return user?.role === 'admin' ? <AdminLayout currentPage={currentPage} navigate={navigate} theme={theme} setTheme={setTheme} onLogout={handleLogout}/> : <p>{t('access_denied')}</p>;
        
      case 'companyDashboard': case 'companyBuses': case 'companyDrivers': case 'companyRoutes': case 'companyPassengers': case 'companyFinancials': case 'companySettings': case 'fleetMonitoring': case 'companyRouteAnalytics': case 'companyDriverProfile':
        return user?.role === 'company' ? <CompanyLayout currentPage={currentPage} navigate={navigate} pageData={pageData} companyData={user} theme={theme} setTheme={setTheme} onLogout={handleLogout}/> : <p>{t('access_denied')}</p>;
        
      case 'driverDashboard':
        return user?.role === 'driver' ? <DriverDashboard driverData={user} navigate={navigate} onLogout={handleLogout} theme={theme} setTheme={setTheme} /> : <p>{t('access_denied')}</p>;
      
      case 'driverSettings':
        return user?.role === 'driver' ? <DriverSettingsPage onNavigate={navigate} /> : <p>{t('access_denied')}</p>;

      case 'agentDashboard':
        return user?.role === 'agent' ? <AgentDashboard agentData={user} navigate={navigate} onLogout={handleLogout} theme={theme} setTheme={setTheme} /> : <p>{t('access_denied')}</p>;
        
      case 'driverProfile': return <DriverProfilePage driver={pageData} />;
      case 'agentProfile': return <AgentProfilePage agent={pageData || user} allTransactions={[]} />;
      case 'passengerProfile': return <PassengerProfilePage passenger={pageData} />;

      default:
        return (
          <>
            <HeroSection onSearch={handleSearch} />
            <div className="bg-gray-50 dark:bg-gray-900">
              <div className="space-y-16 md:space-y-24 py-16 md:py-24">
                  <FeaturedDestinations onSearch={handleSearch} />
                  <WhyChooseUs />
                  <PromotedCompanies />
                  <SpecialOffers onSearch={handleSearch} />
                  <HowItWorks />
                  <Testimonials />
                  <OurPartners navigate={navigate} />
              </div>
            </div>
          </>
        );
    }
  };
  
  const isDashboard = ['adminDashboard', 'companyDashboard', 'driverDashboard', 'agentDashboard', 'adminCompanies', 'adminDrivers', 'adminAgents', 'adminUsers', 'adminFinancials', 'adminAds', 'adminPromotions', 'adminAnnouncements', 'adminMessages', 'adminSettings', 'adminDestinations', 'companyBuses', 'companyDrivers', 'companyRoutes', 'companyPassengers', 'companyFinancials', 'companySettings', 'fleetMonitoring', 'agentProfile', 'driverProfile', 'passengerProfile', 'companyRouteAnalytics', 'companyDriverProfile', 'driverSettings'].includes(currentPage);
  const isFullScreenPage = ['bookingConfirmation', 'registrationSuccess'].includes(currentPage);
  const showHeader = !isDashboard && !isFullScreenPage;
  const showFooter = !isDashboard && !isFullScreenPage;
  const mainPadding = showHeader ? 'pt-20' : '';
  const showBottomNav = !isDashboard && !isFullScreenPage && ['home', 'bookingSearch', 'companies', 'profile', 'services'].includes(currentPage);

  return (
    <div className={`font-sans bg-white dark:bg-gray-900`}>
        <NotificationHandler />
        {showHeader && (
             <Header 
                currentPage={currentPage} 
                onNavigate={navigate}
                onLogout={handleLogout}
                theme={theme}
                setTheme={setTheme}
             />
        )}
        <main className={mainPadding}>
            <div key={currentPage} className="animate-fade-in">
                {renderPage()}
            </div>
        </main>
        {showFooter && <Footer />}
        
        {viewingTicket && <TicketModal ticket={viewingTicket.ticket} isActive={viewingTicket.isActive} onClose={() => setViewingTicket(null)} />}

        {showBottomNav && (
            <>
                <div className="lg:hidden h-20" /> 
                <BottomNavigation navigate={navigate} currentPage={currentPage} />
            </>
        )}
    </div>
  );
};

const App: React.FC = () => {
    return <AppContent />;
}

export default App;