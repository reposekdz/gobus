import React, { useState, useRef, useEffect } from 'react';
import { Page } from './App';
import { useAuth } from './contexts/AuthContext';
import { useLanguage } from './contexts/LanguageContext';
import * as api from './services/apiService';
import { CheckCircleIcon, KeyIcon, LockClosedIcon } from './components/icons';
import LoadingSpinner from './components/LoadingSpinner';

const RegistrationSuccessPage: React.FC<{ onNavigate: (page: Page) => void }> = ({ onNavigate }) => {
    const { user } = useAuth();
    const { t } = useLanguage();
    const [pin, setPin] = useState<string[]>(Array(4).fill(''));
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        inputsRef.current[0]?.focus();
    }, []);

    if (!user) {
        return <LoadingSpinner/>;
    }

    const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
        const { value } = e.target;
        if (/^[0-9]$/.test(value) || value === '') {
          setError('');
          const newPin = [...pin];
          newPin[index] = value;
          setPin(newPin);
    
          if (value && index < 3) {
            inputsRef.current[index + 1]?.focus();
          }
        }
    };
    
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
        if (e.key === 'Backspace' && !pin[index] && index > 0) {
          inputsRef.current[index - 1]?.focus();
        }
    };

    const handleSetPin = async () => {
        const pinString = pin.join('');
        if (pinString.length !== 4) {
            setError('PIN must be 4 digits.');
            return;
        }
        setIsLoading(true);
        setError('');
        try {
            await api.setWalletPin(pinString);
            alert('PIN set successfully! You can now use your wallet.');
            onNavigate('home');
        } catch (err: any) {
            setError(err.message || 'Failed to set PIN.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
            <div className="w-full max-w-md bg-white dark:bg-gray-800 shadow-2xl rounded-2xl p-8 text-center">
                <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4"/>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('reg_success_title')}</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">{t('reg_success_subtitle')}</p>

                <div className="my-6 bg-gray-100 dark:bg-gray-700/50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-semibold">{t('reg_success_serial_label')}</p>
                    <p className="text-3xl font-bold font-mono text-blue-600 dark:text-blue-400 tracking-widest">{user.serial_code}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('reg_success_serial_desc')}</p>
                </div>

                <div className="border-t dark:border-gray-700 pt-6">
                    <h2 className="text-xl font-semibold dark:text-white flex items-center justify-center">
                        <LockClosedIcon className="w-5 h-5 mr-2"/>
                        {t('reg_success_pin_title')}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{t('reg_success_pin_desc')}</p>
                     <div className="flex justify-center space-x-3 my-4">
                        {pin.map((digit, index) => (
                            <input
                            key={index}
                            ref={el => { inputsRef.current[index] = el; }}
                            type="password"
                            inputMode="numeric"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handlePinChange(e, index)}
                            onKeyDown={(e) => handleKeyDown(e, index)}
                            disabled={isLoading}
                            className={`w-12 h-14 text-center text-2xl font-bold bg-gray-100 dark:bg-gray-700 border-2 rounded-lg focus:outline-none focus:ring-2 transition ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-yellow-500'}`}
                            />
                        ))}
                    </div>
                    {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
                    <button onClick={handleSetPin} disabled={isLoading || pin.join('').length < 4} className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50">
                        {isLoading ? t('reg_success_pin_button_loading') : t('reg_success_pin_button')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RegistrationSuccessPage;