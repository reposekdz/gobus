import React, { useState, useEffect } from 'react';
import { Page } from './App';
import { CreditCardIcon, PhoneIcon, LockClosedIcon, ArrowRightIcon, WalletIcon } from './components/icons';
import LoadingSpinner from './components/LoadingSpinner';
import * as api from './services/apiService';
import { useLanguage } from './contexts/LanguageContext';
import { useSocket } from './contexts/SocketContext';
import Modal from './components/Modal';
import { useAuth } from './contexts/AuthContext';
import PinModal from './components/PinModal';


const MomoAwaitingConfirmationModal: React.FC<{amount: number, phone: string, onCancel: () => void}> = ({ amount, phone, onCancel }) => {
    const { t } = useLanguage();
    return (
        <div className="fixed inset-0 bg-black/70 z-[10000] flex flex-col items-center justify-center backdrop-blur-sm text-white p-4">
            <div className="w-16 h-16 border-4 border-yellow-400/50 border-t-yellow-400 rounded-full animate-spin mb-6"></div>
            <h2 className="text-2xl font-bold">{t('payment_momo_modal_title')}</h2>
            <p className="text-lg text-gray-300 mt-2 text-center">
                {t('payment_momo_modal_desc', { amount: new Intl.NumberFormat('fr-RW').format(amount), phone: phone })}
            </p>
             <button onClick={onCancel} className="mt-8 px-6 py-2 border border-gray-500 text-gray-300 rounded-lg hover:bg-gray-700">{t('payment_momo_modal_cancel')}</button>
        </div>
    );
};

const PaymentPage: React.FC<{ bookingDetails: any, onNavigate: (page: Page, data?: any) => void }> = ({ bookingDetails, onNavigate }) => {
    const [paymentMethod, setPaymentMethod] = useState('momo');
    const [momoPhone, setMomoPhone] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [isAwaitingMomo, setIsAwaitingMomo] = useState(false);
    const [isPinModalOpen, setIsPinModalOpen] = useState(false);
    const [error, setError] = useState('');
    const { t } = useLanguage();
    const socket = useSocket();
    const { user, setUser } = useAuth();

    useEffect(() => {
        if (socket && isAwaitingMomo) {
            const handlePaymentSuccess = (data) => {
                console.log("Momo Payment Success Signal Received:", data);
                // Ensure the signal is for THIS booking
                if (data.bookingDetails.tripId === bookingDetails.tripId) {
                    setIsAwaitingMomo(false);
                    finalizeBooking('momo');
                }
            };
            const handlePaymentFailure = (data) => {
                console.error("Momo Payment Failure Signal Received:", data);
                if (data.bookingDetails.tripId === bookingDetails.tripId) {
                    setError(data.message || 'Payment failed on your phone.');
                    setIsAwaitingMomo(false);
                    setIsProcessing(false);
                }
            };
            socket.on('momoPaymentSuccess', handlePaymentSuccess);
            socket.on('momoPaymentFailed', handlePaymentFailure);

            return () => {
                socket.off('momoPaymentSuccess', handlePaymentSuccess);
                socket.off('momoPaymentFailed', handlePaymentFailure);
            };
        }
    }, [socket, isAwaitingMomo, bookingDetails.tripId]);

    if (!bookingDetails) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p>{t('payment_loading')}</p>
            </div>
        )
    };
    
    const finalizeBooking = async (finalPaymentMethod: string, pin?: string) => {
        setIsProcessing(true);
        setError('');
        try {
             const bookingPayload = {
                tripId: bookingDetails.tripId,
                seats: bookingDetails.seats,
                paymentMethod: finalPaymentMethod,
                totalPrice: bookingDetails.totalPrice,
                pin: pin, // Pass the pin for wallet transactions
            };
            const confirmedBooking = await api.createBooking(bookingPayload);
            
            // If wallet was used, update user context
            if(finalPaymentMethod === 'wallet') {
                setUser(prev => ({...prev, walletBalance: prev.walletBalance - bookingDetails.totalPrice}))
            }
            
            const fullBookingDetails = { ...bookingDetails, ...confirmedBooking };
            onNavigate('bookingConfirmation', fullBookingDetails);

        } catch (err: any) {
             setError(err.message || t('payment_error_finalizing'));
        } finally {
            setIsProcessing(false);
        }
    };

    const handlePayment = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        if (paymentMethod === 'momo') {
            setIsProcessing(true);
            try {
                await api.initiateMomoPayment({ ...bookingDetails, phone: momoPhone });
                setIsAwaitingMomo(true);
            } catch(err: any) {
                setError(err.message || t('payment_error_momo_start'));
                setIsProcessing(false);
            }
        } else if (paymentMethod === 'wallet') {
            if ((user?.walletBalance || 0) < bookingDetails.totalPrice) {
                setError('Insufficient wallet balance.');
                return;
            }
            if (!user?.pin) {
                setError('Please set a wallet PIN in your profile before making a payment.');
                return;
            }
            setIsPinModalOpen(true);
        } else {
            // For Card, we would integrate a payment gateway like Stripe here
            alert('Card payments are not yet implemented.');
        }
    };
    
    const handlePinSuccess = (pin: string) => {
        setIsPinModalOpen(false);
        finalizeBooking('wallet', pin);
    };

    return (
        <>
        {isProcessing && !isAwaitingMomo && <LoadingSpinner />}
        {isAwaitingMomo && <MomoAwaitingConfirmationModal amount={bookingDetails.totalPrice} phone={momoPhone} onCancel={() => { setIsAwaitingMomo(false); setIsProcessing(false); }} />}
        {isPinModalOpen && user?.pin && 
            <PinModal 
                onClose={() => setIsPinModalOpen(false)}
                onSuccess={handlePinSuccess}
                // pinToMatch is not needed as backend will verify
                title="Confirm Wallet Payment"
                description={`Enter your PIN to authorize payment of ${new Intl.NumberFormat('fr-RW').format(bookingDetails.totalPrice)} RWF`}
            />
        }
        
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-12 px-4">
            <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Order Summary */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 order-last lg:order-first">
                    <h2 className="text-2xl font-bold mb-6 dark:text-white">{t('payment_summary_title')}</h2>
                    <div className="space-y-4 text-gray-700 dark:text-gray-300">
                        <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">{t('payment_summary_route')}:</span><span className="font-semibold">{bookingDetails.from} to {bookingDetails.to}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">{t('payment_summary_company')}:</span><span className="font-semibold">{bookingDetails.company}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">{t('payment_summary_seats')}:</span><span className="font-semibold">{bookingDetails.seats.join(', ')}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">{t('payment_summary_departure')}:</span><span className="font-semibold">{bookingDetails.departureTime}</span></div>
                        
                        <div className="border-t dark:border-gray-700 pt-4 mt-4 flex justify-between items-baseline">
                            <span className="text-lg font-bold dark:text-white">{t('payment_summary_total')}:</span>
                            <span className="text-3xl font-extrabold text-green-600">{new Intl.NumberFormat('fr-RW').format(bookingDetails.totalPrice)} RWF</span>
                        </div>
                    </div>
                </div>

                {/* Payment Form */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
                    <h2 className="text-2xl font-bold mb-6 dark:text-white">{t('payment_secure_title')}</h2>
                    <div className="flex border border-gray-200 dark:border-gray-700 rounded-lg p-1 mb-6">
                        <button onClick={() => setPaymentMethod('wallet')} className={`flex-1 py-2 rounded-md font-semibold text-sm transition flex items-center justify-center ${paymentMethod === 'wallet' ? 'bg-blue-600 text-white shadow' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'}`}><WalletIcon className="w-4 h-4 mr-2"/> {t('payment_method_wallet')}</button>
                        <button onClick={() => setPaymentMethod('momo')} className={`flex-1 py-2 rounded-md font-semibold text-sm transition flex items-center justify-center ${paymentMethod === 'momo' ? 'bg-blue-600 text-white shadow' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'}`}><PhoneIcon className="w-4 h-4 mr-2"/> {t('payment_method_momo')}</button>
                        <button onClick={() => setPaymentMethod('card')} className={`flex-1 py-2 rounded-md font-semibold text-sm transition flex items-center justify-center ${paymentMethod === 'card' ? 'bg-blue-600 text-white shadow' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'}`}><CreditCardIcon className="w-4 h-4 mr-2"/> {t('payment_method_card')}</button>
                    </div>

                    <form onSubmit={handlePayment} className="space-y-4">
                        {paymentMethod === 'momo' && (
                             <div>
                                <label htmlFor="momo-phone" className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('payment_momo_phone')}</label>
                                <div className="relative mt-1">
                                    <PhoneIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"/>
                                    <input type="tel" id="momo-phone" value={momoPhone} onChange={e => setMomoPhone(e.target.value)} required className="w-full pl-10 pr-3 py-2 border rounded-md dark:bg-gray-700" placeholder="07..."/>
                                </div>
                             </div>
                        )}
                        {paymentMethod === 'card' && (
                            <p className="text-center text-sm text-gray-500">{t('payment_card_info')}</p>
                        )}
                         {paymentMethod === 'wallet' && (
                            <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                <p className="text-sm text-gray-600 dark:text-gray-300">Your current balance is</p>
                                <p className="font-bold text-lg text-green-600">{new Intl.NumberFormat('fr-RW').format(user?.walletBalance || 0)} RWF</p>
                            </div>
                        )}
                        
                        {error && <p className="text-sm text-red-500 text-center font-semibold mt-4">{error}</p>}
                        <button type="submit" disabled={isProcessing} className="w-full mt-6 py-4 bg-green-600 text-white font-bold rounded-lg text-lg hover:bg-green-700 transition flex items-center justify-center disabled:opacity-60">
                            {t('payment_pay_button')} <ArrowRightIcon className="w-5 h-5 ml-2"/>
                        </button>
                         <p className="text-xs text-gray-500 text-center flex items-center justify-center mt-2"><LockClosedIcon className="w-3 h-3 mr-1"/> {t('payment_secure_info')}</p>
                    </form>
                </div>
            </div>
        </div>
        </>
    );
};

export default PaymentPage;