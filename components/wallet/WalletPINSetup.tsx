import React, { useState, useRef, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../lib/api';

interface WalletPINSetupProps {
  onComplete: () => void;
  onSkip?: () => void;
  userId: number;
}

const WalletPINSetup: React.FC<WalletPINSetupProps> = ({ onComplete, onSkip, userId }) => {
  const [pin, setPin] = useState(['', '', '', '']);
  const [confirmPin, setConfirmPin] = useState(['', '', '', '']);
  const [step, setStep] = useState<'setup' | 'confirm'>('setup');
  const [loading, setLoading] = useState(false);
  const pinRefs = useRef<(HTMLInputElement | null)[]>([]);
  const confirmPinRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (step === 'setup') {
      pinRefs.current[0]?.focus();
    } else {
      confirmPinRefs.current[0]?.focus();
    }
  }, [step]);

  const handlePinChange = (index: number, value: string, type: 'pin' | 'confirm') => {
    if (value.length > 1) return;
    const numValue = value.replace(/\D/g, '');
    
    if (type === 'pin') {
      const newPin = [...pin];
      newPin[index] = numValue;
      setPin(newPin);
      
      if (numValue && index < 3) {
        pinRefs.current[index + 1]?.focus();
      } else if (index === 3 && numValue && newPin.every(d => d)) {
        // All digits entered, move to confirm
        setTimeout(() => setStep('confirm'), 100);
      }
    } else {
      const newConfirmPin = [...confirmPin];
      newConfirmPin[index] = numValue;
      setConfirmPin(newConfirmPin);
      
      if (numValue && index < 3) {
        confirmPinRefs.current[index + 1]?.focus();
      } else if (index === 3 && numValue && newConfirmPin.every(d => d)) {
        handleSubmit(newConfirmPin.join(''));
      }
    }
  };

  const handlePinKeyDown = (index: number, e: React.KeyboardEvent, type: 'pin' | 'confirm') => {
    if (e.key === 'Backspace' && !(type === 'pin' ? pin[index] : confirmPin[index]) && index > 0) {
      const refs = type === 'pin' ? pinRefs : confirmPinRefs;
      refs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (submittedPin?: string) => {
    const pinValue = submittedPin || pin.join('');
    const confirmPinValue = confirmPin.join('');

    if (pinValue.length !== 4) {
      toast.error('Please enter a 4-digit PIN');
      return;
    }

    if (step === 'setup') {
      setStep('confirm');
      return;
    }

    if (pinValue !== confirmPinValue) {
      toast.error('PINs do not match. Please try again.');
      setConfirmPin(['', '', '', '']);
      confirmPinRefs.current[0]?.focus();
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/wallet/set-pin', {
        pin: pinValue
      });

      if (response.data.success) {
        toast.success('Wallet PIN set successfully!');
        onComplete();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to set PIN');
      setPin(['', '', '', '']);
      setConfirmPin(['', '', '', '']);
      setStep('setup');
      pinRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-md mx-auto">
      <div className="text-center mb-8">
        <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {step === 'setup' ? 'Set Wallet PIN' : 'Confirm Wallet PIN'}
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          {step === 'setup'
            ? 'Create a 4-digit PIN to secure your wallet transactions'
            : 'Enter your PIN again to confirm'}
        </p>
      </div>

      {step === 'setup' ? (
        <div className="space-y-6">
          <div className="flex justify-center gap-3">
            {pin.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (pinRefs.current[index] = el)}
                type="password"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handlePinChange(index, e.target.value, 'pin')}
                onKeyDown={(e) => handlePinKeyDown(index, e, 'pin')}
                className="w-14 h-14 text-center text-2xl font-bold rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-4 focus:ring-blue-200 dark:focus:ring-blue-800 transition-all"
              />
            ))}
          </div>

          <button
            onClick={() => handleSubmit()}
            disabled={loading || !pin.every(d => d)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-center gap-3">
            {confirmPin.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (confirmPinRefs.current[index] = el)}
                type="password"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handlePinChange(index, e.target.value, 'confirm')}
                onKeyDown={(e) => handlePinKeyDown(index, e, 'confirm')}
                className="w-14 h-14 text-center text-2xl font-bold rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-4 focus:ring-blue-200 dark:focus:ring-blue-800 transition-all"
              />
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                setStep('setup');
                setConfirmPin(['', '', '', '']);
              }}
              className="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Back
            </button>
            <button
              onClick={() => handleSubmit()}
              disabled={loading || !confirmPin.every(d => d)}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Setting PIN...
                </>
              ) : (
                'Confirm & Set PIN'
              )}
            </button>
          </div>
        </div>
      )}

      {onSkip && step === 'setup' && (
        <button
          onClick={onSkip}
          className="mt-4 w-full text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-sm font-medium"
        >
          Skip for now
        </button>
      )}

      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <p className="text-xs text-blue-800 dark:text-blue-300">
          <strong>Security Note:</strong> Your PIN is encrypted and stored securely. Keep it confidential and never share it with anyone.
        </p>
      </div>
    </div>
  );
};

export default WalletPINSetup;
