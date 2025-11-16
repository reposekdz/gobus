import React, { useState } from 'react';
import type { Page } from './App';
import { EyeIcon, EyeOffIcon, LockClosedIcon, GoogleIcon, UserCircleIcon, PhoneIcon, EnvelopeIcon } from './components/icons';
import { useAuth } from './contexts/AuthContext';
import { useLanguage } from './contexts/LanguageContext';
import * as api from './services/apiService';
import toast from 'react-hot-toast';

interface RegisterPageProps {
  onNavigate: (page: Page) => void;
}

const RegisterPage: React.FC<RegisterPageProps> = ({ onNavigate }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [otp, setOtp] = useState('');
  const [isRequestingOTP, setIsRequestingOTP] = useState(false);
  const [isVerifyingOTP, setIsVerifyingOTP] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const { register, isLoading } = useAuth();
  const { t } = useLanguage();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRequestOTP = async () => {
    if (!formData.phone) {
      setError('Please enter your phone number first');
      return;
    }
    
    // Validate phone format
    const phoneRegex = /^(\+?250|0)?[7][0-9]{8}$/;
    const normalizedPhone = formData.phone.replace(/\s/g, '');
    if (!phoneRegex.test(normalizedPhone)) {
      setError('Invalid phone number format. Use Rwanda format (e.g., 0781234567)');
      return;
    }

    setIsRequestingOTP(true);
    setError('');
    try {
      const response = await api.post('/auth/otp/request-otp', {
        phoneNumber: normalizedPhone,
        purpose: 'verification'
      });
      
      if (response.success) {
        setOtpSent(true);
        setCountdown(600); // 10 minutes
        toast.success('OTP sent successfully to your phone!');
        
        // Start countdown
        const interval = setInterval(() => {
          setCountdown(prev => {
            if (prev <= 1) {
              clearInterval(interval);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        setError(response.message || 'Failed to send OTP');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setIsRequestingOTP(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    setIsVerifyingOTP(true);
    setError('');
    try {
      const normalizedPhone = formData.phone.replace(/\s/g, '');
      const response = await api.post('/auth/otp/verify-otp', {
        phoneNumber: normalizedPhone,
        otp
      });

      if (response.success) {
        // Proceed with registration
        await handleRegister();
      } else {
        setError(response.message || 'Invalid OTP. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to verify OTP');
    } finally {
      setIsVerifyingOTP(false);
    }
  };

  const handleRegister = async () => {
    if (formData.password !== formData.confirmPassword) {
      setError(t('register_error_password_mismatch'));
      return;
    }
    if (formData.password.length < 8) {
        setError(t('register_error_password_length') || 'Password must be at least 8 characters');
        return;
    }
    try {
        const normalizedPhone = formData.phone.replace(/\s/g, '');
        const result = await register({
          ...formData,
          phone: normalizedPhone,
          otp: step === 'otp' ? otp : undefined
        });
        
        // Check if PIN setup is required
        if (result.data?.requiresPinSetup) {
          // Navigate to PIN setup page
          onNavigate('walletPinSetup');
        } else {
          onNavigate('registrationSuccess');
        }
    } catch(err: any) {
        setError(err.message || t('register_error_generic'));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (step === 'form') {
      // Validate form first
      if (!formData.name || !formData.email || !formData.phone || !formData.password) {
        setError('Please fill in all fields');
        return;
      }
      
      // Move to OTP step
      setStep('otp');
      await handleRequestOTP();
    } else {
      // Verify OTP and register
      await handleVerifyOTP();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
      <div className="relative flex flex-col md:flex-row w-full max-w-4xl bg-white dark:bg-gray-800 shadow-2xl rounded-2xl overflow-hidden">
        <div className="hidden md:block w-1/2 bg-cover bg-center" style={{backgroundImage: "url('https://images.unsplash.com/photo-1605641793224-6512a8g8363b?q=80&w=1974&auto=format&fit=crop')"}}>
        </div>
        <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">{t('register_title')}</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8">{t('register_subtitle')}</p>
          
          <form className="space-y-4" onSubmit={handleSubmit}>
            {step === 'form' ? (
              <>
                <div className="relative">
                  <UserCircleIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input name="name" type="text" required value={formData.name} onChange={handleChange} className="w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500/50 transition" placeholder={t('register_name_placeholder') || 'Full Name'} />
                </div>
                <div className="relative">
                  <EnvelopeIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input name="email" type="email" required value={formData.email} onChange={handleChange} className="w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500/50 transition" placeholder={t('register_email_placeholder') || 'Email'} />
                </div>
                <div className="relative">
                  <PhoneIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input name="phone" type="tel" required value={formData.phone} onChange={handleChange} className="w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500/50 transition" placeholder={t('register_phone_placeholder') || '0781234567'} />
                </div>
                <div className="relative">
                  <LockClosedIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input name="password" type={showPassword ? 'text' : 'password'} required value={formData.password} onChange={handleChange} className="w-full pl-10 pr-10 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500/50 transition" placeholder={t('register_password_placeholder') || 'Password (min 8 chars)'} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 dark:text-gray-400">
                    {showPassword ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                  </button>
                </div>
                <div className="relative">
                  <LockClosedIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input name="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} required value={formData.confirmPassword} onChange={handleChange} className="w-full pl-10 pr-10 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500/50 transition" placeholder={t('register_confirm_password_placeholder') || 'Confirm Password'} />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 dark:text-gray-400">
                    {showConfirmPassword ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                  </button>
                </div>
                {error && <p className="text-red-500 text-sm font-semibold">{error}</p>}
                <div>
                  <button type="submit" disabled={isRequestingOTP} className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-md text-[#0033A0] bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-all duration-300 shadow-lg disabled:opacity-50">
                    {isRequestingOTP ? 'Sending OTP...' : 'Continue to Verify'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="text-center mb-4">
                  <p className="text-gray-600 dark:text-gray-400 mb-2">
                    We've sent a 6-digit OTP to {formData.phone}
                  </p>
                  {countdown > 0 && (
                    <p className="text-sm text-gray-500">
                      OTP expires in {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}
                    </p>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="text"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-4 py-3 text-center text-2xl font-bold tracking-widest border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500/50 transition"
                    placeholder="000000"
                  />
                </div>
                {error && <p className="text-red-500 text-sm font-semibold text-center">{error}</p>}
                <div className="space-y-2">
                  <button
                    type="submit"
                    disabled={isLoading || isVerifyingOTP || !otp || otp.length !== 6}
                    className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-md text-[#0033A0] bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-all duration-300 shadow-lg disabled:opacity-50"
                  >
                    {isLoading || isVerifyingOTP ? 'Verifying & Registering...' : 'Verify & Create Account'}
                  </button>
                  <button
                    type="button"
                    onClick={handleRequestOTP}
                    disabled={countdown > 0}
                    className="w-full py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {countdown > 0 ? `Resend OTP in ${Math.floor(countdown / 60)}:${(countdown % 60).toString().padStart(2, '0')}` : 'Resend OTP'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep('form')}
                    className="w-full py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                  >
                    ← Back to Form
                  </button>
                </div>
              </>
            )}
          </form>

          <p className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
            {t('register_have_account_prompt')}{' '}
            <button onClick={() => onNavigate('login')} className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500">
              {t('register_login_link')}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;