import React, { useState, useRef } from 'react';
import { CogIcon, BuildingOfficeIcon, LockClosedIcon, CameraIcon } from '../components/icons';
import * as api from '../services/apiService';
import { useLanguage } from '../contexts/LanguageContext';
import SecuritySettings from '../components/SecuritySettings';

interface CompanySettingsProps {
    companyData: any;
}

const CompanySettings: React.FC<CompanySettingsProps> = ({ companyData }) => {
    const { t } = useLanguage();
    const [formData, setFormData] = useState({
        name: companyData.name || '',
        email: companyData.email || '',
        description: companyData.description || 'Volcano Express is one of the most popular transport companies...',
        logoUrl: companyData.logoUrl || 'https://pbs.twimg.com/profile_images/1237839357116452865/p-28c8o-_400x400.jpg',
        coverUrl: companyData.coverUrl || 'https://images.unsplash.com/photo-1533104816-588941750c11?q=80&w=1974&auto=format&fit=crop',
    });
    
    const logoInputRef = useRef<HTMLInputElement>(null);
    const coverInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'logoUrl' | 'coverUrl') => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                const url = reader.result as string;
                setFormData(prev => ({...prev, [type]: url}));
            };
            reader.readAsDataURL(file);
        }
    };


    const handleSave = () => {
        // In a real app, this would be an API call
        alert(t('alert_company_settings_saved'));
    };

    return (
        <div>
            <h1 className="text-3xl font-bold dark:text-gray-200 mb-6">{t('company_settings_title')}</h1>
            <div className="max-w-2xl mx-auto">
                <div className="bg-white dark:bg-gray-800/50 p-8 rounded-2xl shadow-lg">
                    <h2 className="text-xl font-bold dark:text-white mb-6 flex items-center"><BuildingOfficeIcon className="w-6 h-6 mr-3 text-blue-500"/> {t('company_profile_title')}</h2>
                    
                    <div className="space-y-6">
                        {/* Image uploads */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium">{t('company_settings_logo')}</label>
                                <div className="mt-1 flex items-center space-x-4">
                                    <img src={formData.logoUrl} alt="logo" className="w-20 h-20 rounded-full object-contain bg-gray-100 p-1"/>
                                    <button type="button" onClick={() => logoInputRef.current?.click()} className="text-sm font-semibold text-blue-600 hover:underline">{t('profile_edit_change')}</button>
                                    <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'logoUrl')} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium">{t('company_settings_cover')}</label>
                                <div className="mt-1 relative group w-full h-32 bg-gray-200 rounded-lg overflow-hidden">
                                     <img src={formData.coverUrl} alt="cover" className="w-full h-full object-cover"/>
                                     <button onClick={() => coverInputRef.current?.click()} className="absolute inset-0 bg-black/50 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                        <CameraIcon className="w-6 h-6"/>
                                    </button>
                                    <input type="file" ref={coverInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'coverUrl')} />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('company_settings_name')}</label>
                            <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
                        </div>
                         <div>
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('company_settings_email')}</label>
                            <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
                        </div>
                         <div>
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('company_settings_desc')}</label>
                            <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows={4} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
                        </div>
                    </div>
                    <div className="text-right mt-6">
                        <button onClick={handleSave} className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700">
                            {t('profile_edit_save')}
                        </button>
                    </div>
                </div>

                <SecuritySettings />
            </div>
        </div>
    );
};

export default CompanySettings;