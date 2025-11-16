import { io } from '../../server';
import { AppError } from '../../utils/AppError';
import logger from '../../utils/logger';

// In a real app, these would come from process.env
const MTN_API_KEY = process.env.MTN_API_KEY || 'mock-api-key';
const MTN_USER_ID = process.env.MTN_USER_ID || 'mock-user-id';

export const initiateMomoPayment = async (userId: number, phone: string, bookingDetails: any) => {
    
    logger.info(`Initiating MoMo payment for user ${userId} to phone ${phone} for ${bookingDetails.totalPrice} RWF`);

    if (!phone || !phone.startsWith('07')) {
        throw new AppError('A valid Rwandan phone number is required for Mobile Money payments.', 400);
    }

    // --- MOCK MTN API INTERACTION ---
    // Here you would make a real API call to the MTN sandbox/production endpoint
    // with details like amount, currency, externalId, payer message, etc.
    // For now, we just simulate the asynchronous nature of the transaction.
    
    // Simulate waiting for user to enter PIN on their phone
    setTimeout(() => {
        const isSuccessful = Math.random() > 0.1; // 90% success rate for demo

        if (isSuccessful) {
            logger.info(`[SIMULATION] Payment success for user ${userId}`);
            // Emit success event to the specific user's room
            io.to(userId.toString()).emit('momoPaymentSuccess', {
                message: 'Payment was successful.',
                bookingDetails
            });
        } else {
            logger.warn(`[SIMULATION] Payment failed for user ${userId}`);
            // Emit failure event
            io.to(userId.toString()).emit('momoPaymentFailed', {
                message: 'Payment was not approved or timed out.',
                bookingDetails
            });
        }
    }, 8000); // 8-second delay to simulate user interaction

    return { message: 'Please check your phone to approve the payment.' };
};
