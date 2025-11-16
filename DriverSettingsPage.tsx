import React, { useState, useRef } from 'react';
import { CameraIcon, CogIcon } from './components/icons';
import { useLanguage } from './contexts/LanguageContext';
import SecuritySettings from './components/SecuritySettings';
import { Page } from './App';
import { useAuth } from './contexts/AuthContext';
import * as api from './services/apiService';

interface DriverSettingsPageProps {
    onNavigate: (page: Page) => void;
}

const DriverSettingsPage: React.FC<DriverSettingsPageProps> = ({ onNavigate }) => {
    const { user, setUser } = useAuth();
    const { t } = useLanguage();
    const [driverInfo, setDriverInfo] = useState({
        name: user?.name || '',
        phone_number: user?.phone_number || '',
        bio: user?.bio || '',
        avatar_url: user?.avatar_url || 'https://via.placeholder.com/80',
    });
    const avatarInputRef = useRef<HTMLInputElement>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleInfoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setDriverInfo(prev => ({...prev, [e.target.name]: e.target.value}));
    };
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                setDriverInfo(prev => ({...prev, avatar_url: reader.result as string}));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async () => {
        setIsLoading(true);
        try {
            const { data: updatedUser } = await api.updateMyProfile({
                name: driverInfo.name,
                phone: driverInfo.phone_number,
                bio: driverInfo.bio
            });
            // Also update avatar if it's a new base64 string
            if (driverInfo.avatar_url.startsWith('data:image')) {
                const { data: avatarRes } = await api.updateAvatar(driverInfo.avatar_url);
                updatedUser.avatar_url = avatarRes.avatarUrl;
            }
            setUser(prev => ({...prev, ...updatedUser}));
            alert('Profile information saved!');
        } catch (error) {
            alert(`Failed to save: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="animate-fade-in container mx-auto px-6 py-8">
             <button onClick={() => onNavigate('driverDashboard')} className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-4">&larr; {t('driver_settings_back')}</button>
            <h1 className="text-3xl font-bold dark:text-gray-200 mb-6">{t('driver_settings_title')}</h1>
            <div className="max-w-2xl mx-auto space-y-8">
                {/* Profile Editing */}
                <div className="bg-white dark:bg-gray-800/50 p-6 rounded-2xl shadow-lg">
                    <h2 className="text-xl font-bold dark:text-white mb-4 flex items-center"><CogIcon className="w-6 h-6 mr-3 text-blue-500"/> {t('profile_edit_title')}</h2>
                    <div className="flex items-center space-x-4 mb-6">
                         <div className="relative group">
                            <img src={driverInfo.avatar_url} alt="Avatar" className="w-20 h-20 rounded-full object-cover"/>
                            <button onClick={() => avatarInputRef.current?.click()} className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                <CameraIcon className="w-6 h-6"/>
                            </button>
                            <input type="file" ref={avatarInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                        </div>
                        <div className="flex-grow grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-semibold text-gray-500">{t('profile_edit_name')}</label>
                                <input type="text" name="name" value={driverInfo.name} onChange={handleInfoChange} className="w-full p-2 border-b-2 dark:bg-transparent dark:border-gray-600 focus:outline-none focus:border-blue-500"/>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-500">{t('profile_edit_phone')}</label>
                                <input type="text" name="phone_number" value={driverInfo.phone_number || ''} onChange={handleInfoChange} className="w-full p-2 border-b-2 dark:bg-transparent dark:border-gray-600 focus:outline-none focus:border-blue-500"/>
                            </div>
                        </div>
                    </div>
                    <div>
                         <label className="text-xs font-semibold text-gray-500">{t('profile_edit_bio')}</label>
                         <textarea name="bio" value={driverInfo.bio || ''} onChange={handleInfoChange} rows={3} className="w-full mt-1 p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div className="text-right mt-4">
                        <button onClick={handleSave} disabled={isLoading} className="px-5 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition disabled:opacity-50">
                            {isLoading ? t('saving') : t('profile_edit_save')}
                        </button>
                    </div>
                </div>

                {/* Security Settings */}
                <SecuritySettings />
            </div>
        </div>
    )
}

export default DriverSettingsPage;