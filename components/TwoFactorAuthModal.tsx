
import React, { useState } from 'react';
import Modal from './Modal';
import { LockClosedIcon } from './icons';

interface TwoFactorAuthModalProps {
    onClose: () => void;
    onSuccess: (code: string) => void;
}

const TwoFactorAuthModal: React.FC<TwoFactorAuthModalProps> = ({ onClose, onSuccess }) => {
    const [code, setCode] = useState('');

    const handleSubmit = () => {
        if (code.length === 6) {
            // In a real app, verify the code
            onSuccess(code);
        }
    };

    return (
        <Modal isOpen={true} onClose={onClose} title="Two-Factor Authentication">
            <div className="text-center">
                <LockClosedIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Enter the 6-digit code from your authenticator app.
                </p>
                <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    maxLength={6}
                    className="w-48 p-2 text-center text-2xl tracking-[.5em] font-mono bg-gray-100 dark:bg-gray-700 border rounded-md"
                />
                <div className="mt-6 flex justify-end space-x-3">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-semibold border rounded-lg">
                        Cancel
                    </button>
                    <button type="button" onClick={handleSubmit} className="px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg">
                        Verify
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default TwoFactorAuthModal;
