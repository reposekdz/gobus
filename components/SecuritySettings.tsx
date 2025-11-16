import React, { useState } from 'react';
import { LockClosedIcon } from './icons';
import * as api from '../services/apiService';
import { useLanguage } from '../contexts/LanguageContext';

const SecuritySettings = () => {
    const { t } = useLanguage();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setError(t('security_error_mismatch'));
            return;
        }
        if (newPassword.length < 6) {
            setError(t('security_error_length'));
            return;
        }
        setError('');
        setSuccess('');
        setIsLoading(true);
        try {
            await api.updatePassword({ currentPassword, newPassword });
            setSuccess(t('security_success_updated'));
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err: any) {
            setError(err.message || t('security_error_generic'));
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="bg-white dark:bg-gray-800/50 p-6 rounded-2xl shadow-lg mt-6">
            <h2 className="text-xl font-bold dark:text-white mb-4 flex items-center">
                <LockClosedIcon className="w-6 h-6 mr-3 text-red-500"/> {t('security_title')}
            </h2>
            <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                    <label className="text-xs font-semibold text-gray-500">{t('security_current_password')}</label>
                    <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required className="w-full mt-1 p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"/>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-semibold text-gray-500">{t('security_new_password')}</label>
                        <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required className="w-full mt-1 p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"/>
                    </div>
                     <div>
                        <label className="text-xs font-semibold text-gray-500">{t('security_confirm_password')}</label>
                        <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required className="w-full mt-1 p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"/>
                    </div>
                </div>
                {error && <p className="text-red-500 text-sm font-semibold">{error}</p>}
                {success && <p className="text-green-500 text-sm font-semibold">{success}</p>}
                <div className="text-right">
                    <button type="submit" disabled={isLoading} className="px-5 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition disabled:opacity-50">
                        {isLoading ? t('security_button_loading') : t('security_button_main')}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default SecuritySettings;
