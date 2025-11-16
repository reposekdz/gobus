import React, { useState, useRef, useEffect } from 'react';
import { LockClosedIcon, XIcon } from './components/icons';

interface PinModalProps {
  onClose: () => void;
  onSuccess: (pin: string) => void;
  title: string;
  description: string;
}

const PinModal: React.FC<PinModalProps> = ({ onClose, onSuccess, title, description }) => {
  const [pin, setPin] = useState<string[]>(Array(4).fill(''));
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

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
      
      // Auto-submit when all digits are filled
      if (newPin.every(digit => digit !== '') && index === 3) {
        const pinString = newPin.join('');
        onSuccess(pinString);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-sm w-full p-8 text-center" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
            <XIcon className="w-5 h-5 text-gray-500"/>
        </button>
        <LockClosedIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-bold dark:text-white">{title}</h3>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">{description}</p>
        <div className="flex justify-center space-x-3 mb-4">
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
              className={`w-12 h-14 text-center text-2xl font-bold bg-gray-100 dark:bg-gray-700 border-2 rounded-lg focus:outline-none focus:ring-2 transition ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'}`}
            />
          ))}
        </div>
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        {isLoading && <p className="text-blue-500 text-sm mb-4">Verifying...</p>}
      </div>
    </div>
  );
};

export default PinModal;