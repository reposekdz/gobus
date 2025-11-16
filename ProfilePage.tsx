import React, { useState, useRef } from 'react';
import { Page } from './App';
import { CameraIcon, TicketIcon, WalletIcon, StarIcon, BellAlertIcon, SparklesIcon, CogIcon, LockClosedIcon } from './components/icons';
import WalletTopUpModal from './components/WalletTopUpModal';
import { useLanguage } from './contexts/LanguageContext';
import { useAuth } from './contexts/AuthContext';
import * as api from './services/apiService';
import SecuritySettings from './components/SecuritySettings';

interface ProfilePageProps {
  onNavigate: (page: Page, data?: any) => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ onNavigate }) => {
  const { t } = useLanguage();
  const { user, setUser } = useAuth();
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const handleTopUpSuccess = async (amount: number) => {
    setIsTopUpOpen(false);
    setIsProcessing(true);
    try {
        const response = await api.topUpWallet(amount);
        setUser(prevUser => ({...prevUser, wallet_balance: response.data.wallet_balance }));
        alert(`Successfully added ${new Intl.NumberFormat('fr-RW').format(amount)} RWF to your wallet!`);
    } catch (error: any) {
        alert(`Top-up failed: ${error.message}`);
    } finally {
        setIsProcessing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'cover') => {
    const file = e.target.files?.[0];
    if (file) {
        setIsProcessing(true);
        const reader = new FileReader();
        reader.onload = async () => {
            const url = reader.result as string;
            try {
                if (type === 'avatar') {
                    const { data } = await api.updateAvatar(url);
                    setUser(prev => ({ ...prev, avatar_url: data.avatarUrl }));
                } else {
                    // Note: Cover photo update is client-side only for this demo
                     setUser(prev => ({...prev, coverUrl: url}));
                }
            } catch (error) {
                 alert(`Failed to update ${type}.`);
            } finally {
                setIsProcessing(false);
            }
        };
        reader.readAsDataURL(file);
    }
  };


  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
        <h1 className="text-2xl font-bold mb-4 dark:text-white">You are not logged in.</h1>
        <button onClick={() => onNavigate('login')} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Go to Login</button>
      </div>
    );
  }

  const profileOptions: { label: string, icon: React.FC<React.SVGProps<SVGSVGElement>>, page: Page }[] = [
    { label: 'My Bookings', icon: TicketIcon, page: 'bookings' },
    { label: 'My Wallet', icon: WalletIcon, page: 'wallet' },
    { label: 'My GoPoints', icon: SparklesIcon, page: 'loyalty' },
    { label: 'My Favorites', icon: StarIcon, page: 'favorites' },
    { label: 'Price Alerts', icon: BellAlertIcon, page: 'priceAlerts' },
    { label: 'Settings', icon: CogIcon, page: 'profile' }, // Stays on profile, would be a separate settings page
  ];

  return (
    <>
        <div className="bg-gray-100/50 dark:bg-gray-900/50 min-h-full">
            <div className="container mx-auto px-6 max-w-4xl py-12">
                 <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
                    <div className="h-40 bg-blue-600 relative group">
                        <img src={user.coverUrl || 'https://images.unsplash.com/photo-1619534103142-93b3f276c120?q=80&w=2070&auto=format&fit=crop'} alt="Cover" className="w-full h-full object-cover"/>
                        <div className="absolute inset-0 bg-black/30"></div>
                         <button onClick={() => coverInputRef.current?.click()} className="absolute top-2 right-2 flex items-center text-xs bg-black/40 text-white px-2 py-1 rounded-full hover:bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity">
                            <CameraIcon className="w-4 h-4 mr-1"/> Edit Cover
                        </button>
                        <input type="file" ref={coverInputRef} onChange={(e) => handleFileChange(e, 'cover')} className="hidden" accept="image/*" />
                    </div>
                    <div className="px-6 pb-6">
                        <div className="flex flex-col sm:flex-row items-center -mt-16">
                            <div className="relative group">
                                {user.avatar_url ? (
                                    <img src={user.avatar_url} alt={user.name} className="w-32 h-32 rounded-full border-4 border-white dark:border-gray-800 object-cover"/>
                                ) : (
                                    <div className="w-32 h-32 rounded-full border-4 border-white dark:border-gray-800 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                        <span className="text-4xl font-bold text-gray-500">{user.name.charAt(0)}</span>
                                    </div>
                                )}
                                <button onClick={() => avatarInputRef.current?.click()} className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                    <CameraIcon className="w-6 h-6"/>
                                </button>
                                <input type="file" ref={avatarInputRef} onChange={(e) => handleFileChange(e, 'avatar')} className="hidden" accept="image/*" />
                            </div>
                            <div className="sm:ml-6 mt-4 sm:mt-16 text-center sm:text-left">
                                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">{user.name}</h1>
                                <p className="text-gray-600 dark:text-gray-400">{user.email}</p>
                            </div>
                        </div>
                        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-4 rounded-xl shadow-lg">
                                <p className="text-sm font-semibold opacity-80">Wallet Balance</p>
                                <p className="text-3xl font-bold">{new Intl.NumberFormat('fr-RW').format(user.wallet_balance)} RWF</p>
                                <button onClick={() => setIsTopUpOpen(true)} className="mt-2 text-xs font-bold bg-white/20 px-3 py-1 rounded-full hover:bg-white/30">Add Funds</button>
                            </div>
                            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white p-4 rounded-xl shadow-lg">
                                <p className="text-sm font-semibold opacity-80">Loyalty Points</p>
                                <p className="text-3xl font-bold">{new Intl.NumberFormat().format(user.loyalty_points)}</p>
                                <button onClick={() => onNavigate('loyalty')} className="mt-2 text-xs font-bold bg-white/20 px-3 py-1 rounded-full hover:bg-white/30">View Rewards</button>
                            </div>
                        </div>
                         <div className="mt-6">
                             <h3 className="font-bold text-lg dark:text-white mb-2">My Account</h3>
                             <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {profileOptions.map(opt => (
                                     <button key={opt.page} onClick={() => onNavigate(opt.page)} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg flex flex-col items-center text-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                        <opt.icon className="w-6 h-6 text-blue-500 mb-2"/>
                                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">{opt.label}</span>
                                    </button>
                                ))}
                             </div>
                         </div>
                    </div>
                </div>
                {user.role === 'passenger' && <SecuritySettings />}
            </div>
        </div>
        {isTopUpOpen && (
            <WalletTopUpModal 
                onClose={() => setIsTopUpOpen(false)}
                onSuccess={handleTopUpSuccess}
                userPin={user.pin || '1234'}
            />
        )}
    </>
  );
};

export default ProfilePage;