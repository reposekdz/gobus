import React, { useState, useRef, useEffect } from 'react';
import type { Page } from './App';
import { GoBusLogo, SunIcon, MoonIcon, MenuIcon, XIcon, UserCircleIcon, TicketIcon, LanguageIcon, ChevronDownIcon, WalletIcon, BusIcon, BellIcon, TagIcon, StarIcon, BellAlertIcon, SparklesIcon, CheckCircleIcon, ArchiveBoxIcon, BriefcaseIcon, MapIcon, ShieldCheckIcon, CreditCardIcon, QuestionMarkCircleIcon, BuildingStorefrontIcon, KeyIcon } from './components/icons';
import { useLanguage } from './contexts/LanguageContext';
import { useAuth } from './contexts/AuthContext';
import { useSocket } from './contexts/SocketContext';

interface HeaderProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  onLogout: () => void;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
}

const NavLink: React.FC<{ page: Page; currentPage: Page; onNavigate: (page: Page) => void; children: React.ReactNode }> = ({ page, currentPage, onNavigate, children }) => (
  <button 
    onClick={() => onNavigate(page)}
    className={`px-4 py-2 text-sm font-semibold transition-colors duration-200 ${currentPage === page ? 'text-yellow-300' : 'text-white hover:text-yellow-200'}`}
  >
    {children}
  </button>
);

const DropdownMenu: React.FC<{isOpen: boolean; children: React.ReactNode; className?: string}> = ({isOpen, children, className}) => (
    <div 
      className={`absolute right-0 mt-3 origin-top-right rounded-xl bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-600 dark:from-sky-600 dark:via-blue-700 dark:to-indigo-800 shadow-2xl ring-1 ring-black ring-opacity-5 focus:outline-none transition-all duration-300 ease-in-out text-white ${className} ${isOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'}`}
    >
      {children}
    </div>
);

const notificationIcons = {
    reminder: TicketIcon,
    promotion: TagIcon,
    delay: BellAlertIcon,
    cancellation: BellAlertIcon,
    boarding: CheckCircleIcon,
    wallet: WalletIcon,
    default: BellIcon,
};

const Header: React.FC<HeaderProps> = ({ currentPage, onNavigate, onLogout, theme, setTheme }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isServicesOpen, setIsServicesOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  
  const langRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const servicesRef = useRef<HTMLDivElement>(null);

  const { language, setLanguage, t, languages } = useLanguage();
  const { user } = useAuth();
  const socket = useSocket();

  const servicesMenuItems = [
      { page: 'packageDelivery', label: t('service_package_title'), icon: ArchiveBoxIcon },
      { page: 'busCharter', label: t('service_charter_title'), icon: BusIcon },
      { page: 'corporateTravel', label: t('service_corporate_title'), icon: BriefcaseIcon },
      { page: 'tourPackages', label: t('service_tours_title'), icon: MapIcon },
      { page: 'lostAndFound', label: t('service_lost_title'), icon: QuestionMarkCircleIcon },
      { page: 'hotelBooking', label: t('service_hotel_title'), icon: BuildingStorefrontIcon },
      { page: 'eventTickets', label: t('service_events_title'), icon: TicketIcon },
      { page: 'vehicleRentals', label: t('service_rentals_title'), icon: KeyIcon },
      { page: 'vipLounge', label: t('service_vip_title'), icon: SparklesIcon },
      { page: 'travelInsurance', label: t('service_insurance_title'), icon: ShieldCheckIcon },
      { page: 'giftCards', label: t('service_gifts_title'), icon: CreditCardIcon },
  ];

  const unreadCount = notifications.filter(n => !n.read).length;

  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');

  const selectLanguage = (lang: any) => {
    setLanguage(lang.code);
    setIsLangOpen(false);
  };

  const markAsRead = (id: number) => {
      setNotifications(notifications.map(n => n.id === id ? {...n, read: true} : n));
  };
  
  const markAllAsRead = () => {
      setNotifications(notifications.map(n => ({...n, read: true})));
  }

  useEffect(() => {
    if (socket) {
        const addNotification = (notif: Omit<any, 'id' | 'read'>) => {
            setNotifications(prev => [{ ...notif, id: Date.now(), read: false }, ...prev.slice(0, 9)]);
        };

        socket.on('passengerBoarded', (data: { message: string; route: string }) => {
            addNotification({ type: 'boarding', message: data.message });
        });

        socket.on('tripUpdate', (data: { type: 'delay' | 'cancellation', message: string }) => {
            addNotification({ type: data.type, message: data.message });
        });

        socket.on('newPromotion', (data: { message: string }) => {
             addNotification({ type: 'promotion', message: data.message });
        });

        socket.on('walletCredit', (data: { amount: number, senderName: string }) => {
             addNotification({ type: 'wallet', message: `You received ${new Intl.NumberFormat('fr-RW').format(data.amount)} RWF from ${data.senderName}.` });
        });
        
        return () => {
            socket.off('passengerBoarded');
            socket.off('tripUpdate');
            socket.off('newPromotion');
            socket.off('walletCredit');
        }
    }
  }, [socket]); 

  const currentLang = languages.find(l => l.code === language);
  
  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(event.target as Node)) {
        setIsLangOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
      if (servicesRef.current && !servicesRef.current.contains(event.target as Node)) {
          setIsServicesOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-gradient-to-r from-[#0033A0] via-[#00574B] to-[#204F46] text-white shadow-lg backdrop-blur-sm bg-opacity-90 animated-gradient-bg">
      <div className="container mx-auto px-6 h-20 flex justify-between items-center">
        <button onClick={() => onNavigate('home')} className="group flex items-center gap-2 text-2xl font-extrabold tracking-tight transition-transform duration-300 hover:scale-105">
          <GoBusLogo className="w-9 h-9 transition-transform duration-500 group-hover:rotate-[-10deg]" />
          <span>Go<span className="text-yellow-300">Bus</span></span>
        </button>

        <nav className="hidden lg:flex items-center space-x-2">
          <NavLink page="home" currentPage={currentPage} onNavigate={onNavigate}>{t('nav_home')}</NavLink>
          <NavLink page="bookingSearch" currentPage={currentPage} onNavigate={onNavigate}>{t('nav_booking')}</NavLink>
          <NavLink page="companies" currentPage={currentPage} onNavigate={onNavigate}>{t('nav_companies')}</NavLink>
          
           <div className="relative" ref={servicesRef}>
              <button 
                  onClick={() => setIsServicesOpen(!isServicesOpen)}
                  className={`px-4 py-2 text-sm font-semibold transition-colors duration-200 flex items-center ${currentPage.toLowerCase().includes('service') ? 'text-yellow-300' : 'text-white hover:text-yellow-200'}`}
              >
                  {t('nav_services')}
                  <ChevronDownIcon className={`w-4 h-4 ml-1 transition-transform ${isServicesOpen ? 'rotate-180' : ''}`} />
              </button>
              <DropdownMenu isOpen={isServicesOpen} className="w-64">
                  <div className="py-2">
                      {servicesMenuItems.map(item => (
                          <button
                              key={item.page}
                              onClick={() => { onNavigate(item.page as Page); setIsServicesOpen(false); }}
                              className="w-full text-left px-4 py-2 text-sm hover:bg-white/20 flex items-center"
                          >
                              <item.icon className="w-5 h-5 mr-3 opacity-80"/>
                              {item.label}
                          </button>
                      ))}
                  </div>
              </DropdownMenu>
          </div>

          <NavLink page="help" currentPage={currentPage} onNavigate={onNavigate}>{t('nav_help')}</NavLink>
          <NavLink page="contact" currentPage={currentPage} onNavigate={onNavigate}>{t('nav_contact')}</NavLink>
        </nav>

        <div className="flex items-center space-x-2 sm:space-x-4">
           <div className="relative hidden sm:block" ref={langRef}>
            <button onClick={() => setIsLangOpen(!isLangOpen)} className="flex items-center space-x-1 p-2 rounded-full hover:bg-white/10">
              <LanguageIcon className="w-5 h-5" />
              <span className="text-xs font-bold hidden sm:inline">{currentLang?.code}</span>
              <ChevronDownIcon className={`w-4 h-4 transition-transform ${isLangOpen ? 'rotate-180' : ''}`} />
            </button>
             <DropdownMenu isOpen={isLangOpen} className="w-48">
                <div className="py-1">
                    {languages.map(lang => (
                      <button key={lang.code} onClick={() => selectLanguage(lang)} className="flex items-center w-full text-left px-4 py-2 text-sm text-white hover:bg-white/20">
                        <span className="mr-3 text-lg">{lang.flag}</span>
                        {lang.name}
                      </button>
                    ))}
                </div>
              </DropdownMenu>
          </div>

          <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-white/10 hidden sm:block">
            {theme === 'light' ? <MoonIcon className="w-5 h-5" /> : <SunIcon className="w-5 h-5" />}
          </button>

          <div className="relative hidden sm:block" ref={notificationsRef}>
            <button onClick={() => setIsNotificationsOpen(!isNotificationsOpen)} className="p-2 rounded-full hover:bg-white/10 relative">
              <BellIcon className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 block h-4 w-4 text-xs font-bold flex items-center justify-center rounded-full bg-red-500 ring-2 ring-white/20">{unreadCount}</span>
              )}
            </button>
            <DropdownMenu isOpen={isNotificationsOpen} className="w-80">
                <div className="p-3 flex justify-between items-center font-bold border-b border-white/20">
                    <span>{t('notifications_title')}</span>
                    {notifications.length > 0 && <button onClick={markAllAsRead} className="text-xs font-semibold text-blue-300 hover:underline">{t('notifications_mark_all_read')}</button>}
                </div>
                <div className="py-2 max-h-80 overflow-y-auto custom-scrollbar">
                    {notifications.length > 0 ? notifications.map(notif => {
                        const Icon = notificationIcons[notif.type] || notificationIcons.default;
                        return (
                        <div key={notif.id} className={`px-4 py-3 text-sm flex items-start space-x-3 transition-colors ${!notif.read ? 'bg-blue-900/20' : ''}`}>
                            <Icon className="w-5 h-5 text-yellow-300 mt-0.5"/>
                            <div className="flex-1">
                                <p className="font-semibold">{notif.message}</p>
                            </div>
                            {!notif.read && (
                                <button onClick={() => markAsRead(notif.id)} data-tooltip={t('notifications_mark_read')} className="w-3 h-3 mt-1.5 rounded-full bg-blue-400 hover:bg-blue-200"></button>
                            )}
                        </div>
                    )}) : (
                        <p className="text-center text-sm py-4">{t('notifications_empty')}</p>
                    )}
                </div>
            </DropdownMenu>
          </div>

          <div className="block sm:hidden flex items-center space-x-2">
            <div className="relative" ref={langRef}>
                <button onClick={() => setIsLangOpen(!isLangOpen)} className="p-2 rounded-full hover:bg-white/10">
                    <LanguageIcon className="w-5 h-5"/>
                </button>
            </div>
             <div className="relative" ref={notificationsRef}>
                <button onClick={() => setIsNotificationsOpen(!isNotificationsOpen)} className="p-2 rounded-full hover:bg-white/10">
                    <BellIcon className="w-5 h-5"/>
                     {unreadCount > 0 && <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-500"></span>}
                </button>
            </div>
          </div>
          
          <div className="hidden lg:flex items-center">
            {user ? (
              <div className="relative" ref={userMenuRef}>
                <button onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} className="flex items-center space-x-2 p-1 rounded-full hover:bg-white/10">
                  <img src={user.avatar_url} alt="User" className="w-8 h-8 rounded-full" />
                </button>
                <DropdownMenu isOpen={isUserMenuOpen}>
                    <div className="p-4 border-b border-white/20">
                        <p className="font-bold">{user.name}</p>
                        <p className="text-xs opacity-80">{user.email}</p>
                    </div>
                     {user.walletBalance !== undefined && (
                        <button onClick={() => { onNavigate('wallet'); setIsUserMenuOpen(false); }} className="p-4 border-b border-white/20 w-full text-left hover:bg-white/10">
                            <p className="text-xs font-semibold opacity-80">{t('usermenu_wallet_balance')}</p>
                            <p className="font-bold text-xl text-green-300">{new Intl.NumberFormat('fr-RW').format(user.walletBalance)} RWF</p>
                        </button>
                     )}
                    <div className="py-2">
                        <button onClick={() => { onNavigate('profile'); setIsUserMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-white/20 flex items-center"><UserCircleIcon className="w-5 h-5 mr-3"/> {t('usermenu_profile')}</button>
                        <button onClick={() => { onNavigate('bookings'); setIsUserMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-white/20 flex items-center"><TicketIcon className="w-5 h-5 mr-3"/> {t('usermenu_bookings')}</button>
                        <button onClick={() => { onNavigate('wallet'); setIsUserMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-white/20 flex items-center"><WalletIcon className="w-5 h-5 mr-3"/> {t('usermenu_wallet')}</button>
                        <button onClick={() => { onNavigate('loyalty'); setIsUserMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-white/20 flex items-center"><SparklesIcon className="w-5 h-5 mr-3"/> {t('usermenu_gopoints')}</button>
                        <button onClick={() => { onNavigate('priceAlerts'); setIsUserMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-white/20 flex items-center"><BellAlertIcon className="w-5 h-5 mr-3"/> {t('usermenu_alerts')}</button>
                        <button onClick={() => { onNavigate('favorites'); setIsUserMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-white/20 flex items-center"><StarIcon className="w-5 h-5 mr-3"/> {t('usermenu_favorites')}</button>
                    </div>
                     <div className="border-t border-white/20 p-2">
                        <button onClick={onLogout} className="w-full text-left px-3 py-2 text-sm font-semibold text-red-300 rounded-md hover:bg-red-900/20">{t('usermenu_logout')}</button>
                    </div>
                </DropdownMenu>
              </div>
            ) : (
              <button onClick={() => onNavigate('login')} className="px-4 py-2 text-sm font-semibold bg-gradient-to-r from-yellow-400 to-yellow-500 text-[#0033A0] rounded-md hover:saturate-150 transition-all shadow-md transform hover:-translate-y-0.5">{t('login_button')}</button>
            )}
          </div>
          
          <button className="lg:hidden" onClick={() => setIsMobileMenuOpen(true)}>
            <MenuIcon className="w-6 h-6" />
          </button>
        </div>
      </div>
      
       {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-gray-900/80 backdrop-blur-sm lg:hidden">
            <div className="absolute top-0 right-0 w-full max-w-xs bg-gradient-to-b from-[#0033A0] to-[#0c2461] h-full p-6">
                <div className="flex justify-between items-center mb-8">
                    <span className="text-xl font-bold">{t('mobile_menu_title')}</span>
                    <button onClick={() => setIsMobileMenuOpen(false)}><XIcon className="w-6 h-6"/></button>
                </div>
                 <nav className="flex flex-col space-y-4">
                    <button onClick={() => {onNavigate('home'); setIsMobileMenuOpen(false);}}>{t('nav_home')}</button>
                    <button onClick={() => {onNavigate('bookingSearch'); setIsMobileMenuOpen(false);}}>{t('nav_booking')}</button>
                    <button onClick={() => {onNavigate('companies'); setIsMobileMenuOpen(false);}}>{t('nav_companies')}</button>
                    <button onClick={() => {onNavigate('services'); setIsMobileMenuOpen(false);}}>{t('nav_services')}</button>
                    <button onClick={() => {onNavigate('help'); setIsMobileMenuOpen(false);}}>{t('nav_help')}</button>
                    <button onClick={() => {onNavigate('contact'); setIsMobileMenuOpen(false);}}>{t('nav_contact')}</button>

                     <div className="border-t border-white/20 my-4"></div>
                     {user ? (
                         <>
                            <button onClick={() => {onNavigate('profile'); setIsMobileMenuOpen(false);}} className="flex items-center space-x-3">
                                <img src={user.avatar_url} alt="User" className="w-8 h-8 rounded-full" />
                                <span>{user.name}</span>
                            </button>
                            <button onClick={() => {onLogout(); setIsMobileMenuOpen(false);}} className="text-red-400 text-left">{t('usermenu_logout')}</button>
                         </>
                     ) : (
                        <button onClick={() => {onNavigate('login'); setIsMobileMenuOpen(false);}} className="px-4 py-2 text-sm font-semibold bg-yellow-400 text-[#0033A0] rounded-md hover:bg-yellow-500 transition-colors">{t('login_button')}</button>
                     )}
                 </nav>
            </div>
        </div>
      )}
    </header>
  );
};

export default Header;