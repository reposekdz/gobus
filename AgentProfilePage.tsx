import React, { useMemo, useState, useRef } from 'react';
import { PhoneIcon, EnvelopeIcon, MapPinIcon, CalendarIcon, CogIcon, SearchIcon, ArrowDownLeftIcon, CameraIcon, LockClosedIcon } from './components/icons';
import * as api from './services/apiService';
import { useLanguage } from './contexts/LanguageContext';
import SecuritySettings from './components/SecuritySettings';
import { useAuth } from './contexts/AuthContext';

const StatCard = ({ title, value, format = 'currency' }) => (
    <div className="bg-gray-100 dark:bg-gray-700/50 p-4 rounded-xl">
        <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
        <p className="text-xl font-bold text-gray-800 dark:text-white mt-1">
            {format === 'currency' ? `${new Intl.NumberFormat('fr-RW').format(value)} RWF` : new Intl.NumberFormat().format(value)}
        </p>
    </div>
);


const AgentProfilePage: React.FC<{agent: any; allTransactions: any[]}> = ({ agent, allTransactions }) => {
    const { user } = useAuth();
    const { t } = useLanguage();
    const [searchTerm, setSearchTerm] = useState('');
    const [profileData, setProfileData] = useState(agent);
    const avatarInputRef = useRef<HTMLInputElement>(null);
    const coverInputRef = useRef<HTMLInputElement>(null);

    const isOwnProfile = user?.id === agent?.id;

    const agentTransactions = useMemo(() => {
        if (!agent) return [];
        // Filter all transactions to find those associated with the current agent
        return allTransactions.filter(tx => tx.agentId === agent.id);
    }, [allTransactions, agent]);
    
    const filteredDisplayTransactions = useMemo(() => {
        if (!searchTerm) return agentTransactions;
         return agentTransactions.filter(tx => 
            tx.passengerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            tx.passengerSerial.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [agentTransactions, searchTerm])

    if (!profileData) {
        return (
            <div className="flex items-center justify-center h-full">
                <p>{t('agent_profile_not_found')}</p>
            </div>
        )
    }
    
    const agentTotalDeposits = agentTransactions.reduce((acc, tx) => acc + tx.amount, 0);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'cover') => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                const url = reader.result as string;
                if (type === 'avatar') {
                    setProfileData(prev => ({...prev, avatar_url: url}));
                } else {
                    setProfileData(prev => ({...prev, coverUrl: url}));
                }
            };
            reader.readAsDataURL(file);
        }
    };


    return (
        <div className="bg-gray-100/50 dark:bg-gray-900/50 min-h-full py-12">
            <div className="container mx-auto px-6 max-w-6xl">
                 <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
                    <div className="h-40 bg-green-600 relative group">
                        <img src={profileData.coverUrl || 'https://images.unsplash.com/photo-1614323992655-037a34c19a31?q=80&w=2070&auto=format&fit=crop'} alt="Cover" className="w-full h-full object-cover"/>
                        <div className="absolute inset-0 bg-black/30"></div>
                         {isOwnProfile && (
                            <button onClick={() => coverInputRef.current?.click()} className="absolute top-2 right-2 flex items-center text-xs bg-black/40 text-white px-2 py-1 rounded-full hover:bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity">
                                <CameraIcon className="w-4 h-4 mr-1"/> {t('profile_edit_cover')}
                            </button>
                         )}
                        <input type="file" ref={coverInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'cover')} />
                    </div>
                     <div className="px-6 pb-6 relative">
                        <div className="flex items-end -mt-16">
                            <div className="relative group">
                                {profileData.avatar_url ? (
                                    <img src={profileData.avatar_url} alt={profileData.name} className="w-32 h-32 rounded-full border-4 border-white dark:border-gray-800 object-cover"/>
                                ) : (
                                     <div className="w-32 h-32 rounded-full border-4 border-white dark:border-gray-800 bg-gray-200 flex items-center justify-center">
                                        <span className="text-5xl font-bold text-gray-500">{profileData.name.charAt(0)}</span>
                                    </div>
                                )}
                                {isOwnProfile && (
                                    <button onClick={() => avatarInputRef.current?.click()} className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                        <CameraIcon className="w-6 h-6"/>
                                    </button>
                                )}
                                <input type="file" ref={avatarInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'avatar')} />
                            </div>
                             <div className="ml-6">
                                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">{profileData.name}</h1>
                                <p className="text-gray-600 dark:text-gray-400">{t('agent_profile_title')}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="p-6 border-t dark:border-gray-700 grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                             <h3 className="font-bold text-lg dark:text-white mb-4">{t('profile_contact_title')}</h3>
                             <div className="space-y-4">
                                <div className="text-gray-700 dark:text-gray-300 space-y-2 text-sm">
                                    <p className="flex items-center"><EnvelopeIcon className="w-4 h-4 mr-2 text-gray-400"/> {profileData.email}</p>
                                    <p className="flex items-center"><PhoneIcon className="w-4 h-4 mr-2 text-gray-400"/> {profileData.phone}</p>
                                    <p className="flex items-center"><MapPinIcon className="w-4 h-4 mr-2 text-gray-400"/> {profileData.location}</p>
                                </div>
                                <div className="border-t dark:border-gray-700 pt-4">
                                    <h4 className="font-semibold dark:text-gray-200 mb-2">{t('profile_performance_title')}</h4>
                                     <div className="grid grid-cols-2 gap-4">
                                        <StatCard title={t('agent_dashboard_deposits')} value={agentTotalDeposits} />
                                        <StatCard title={t('agent_profile_commission_rate')} value={`${profileData.commissionRate * 100}%`} format="string" />
                                    </div>
                                </div>
                             </div>
                        </div>
                        <div>
                             <h3 className="font-bold text-lg dark:text-white mb-4">{t('wallet_history_title')}</h3>
                            <div className="relative mb-4">
                                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder={t('agent_profile_search_placeholder')}
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                                />
                            </div>
                             <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar pr-2">
                                {filteredDisplayTransactions.map((tx) => (
                                    <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                                        <div className="flex items-center space-x-3">
                                            <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-full">
                                                <ArrowDownLeftIcon className="w-4 h-4 text-green-500"/>
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold dark:text-white">{tx.passengerName}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(tx.date).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold text-sm text-green-600 dark:text-green-400">+{new Intl.NumberFormat('fr-RW').format(tx.amount)}</p>
                                            <p className="text-xs text-gray-400">+{new Intl.NumberFormat('fr-RW').format(tx.commission)} {t('agent_profile_commission')}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                 </div>
                 {isOwnProfile && <SecuritySettings />}
            </div>
        </div>
    );
};

export default AgentProfilePage;