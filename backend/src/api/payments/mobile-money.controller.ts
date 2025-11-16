import { Request, Response } from 'express';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../../config/database';
import logger from '../../utils/logger';
import { config } from '../../config';

interface MTNPaymentRequest {
  amount: string;
  currency: string;
  externalId: string;
  payer: {
    partyIdType: string;
    partyId: string;
  };
  payerMessage: string;
  payeeNote: string;
}

interface AirtelPaymentRequest {
  reference: string;
  subscriber: {
    country: string;
    currency: string;
    msisdn: string;
  };
  transaction: {
    amount: string;
    country: string;
    currency: string;
    id: string;
  };
}

export class MobileMoneyController {
  // MTN Mobile Money Payment
  static async initiateMTNPayment(req: Request, res: Response) {
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();
      
      const { booking_id, phone_number, amount } = req.body;
      const userId = req.user?.id;

      // Validate booking
      const [booking] = await connection.execute(
        'SELECT * FROM bookings WHERE id = ? AND user_id = ? AND status = "pending"',
        [booking_id, userId]
      );

      if (!Array.isArray(booking) || booking.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Booking not found or already processed'
        });
      }

      const bookingData = booking[0] as any;

      // Generate MTN API credentials
      const mtnApiUser = await this.getMTNApiUser();
      const mtnApiKey = await this.getMTNApiKey(mtnApiUser);

      // Create payment request
      const externalId = uuidv4();
      const paymentRequest: MTNPaymentRequest = {
        amount: amount.toString(),
        currency: 'RWF',
        externalId,
        payer: {
          partyIdType: 'MSISDN',
          partyId: phone_number.replace('+', '')
        },
        payerMessage: `Payment for GoBus booking ${bookingData.booking_reference}`,
        payeeNote: `GoBus booking payment - ${bookingData.booking_reference}`
      };

      // Make request to MTN API
      const mtnResponse = await axios.post(
        `${config.mtn.apiBaseUrl}/collection/v1_0/requesttopay`,
        paymentRequest,
        {
          headers: {
            'Authorization': `Bearer ${mtnApiKey}`,
            'X-Reference-Id': externalId,
            'X-Target-Environment': config.mtn.environment,
            'Ocp-Apim-Subscription-Key': config.mtn.collection.primaryKey,
            'Content-Type': 'application/json'
          }
        }
      );

      // Save payment record
      const paymentId = uuidv4();
      await connection.execute(`
        INSERT INTO mobile_money_payments (
          id, booking_id, user_id, provider, phone_number, amount, currency,
          external_reference, provider_reference, status, request_data, created_at, updated_at
        ) VALUES (?, ?, ?, 'mtn', ?, ?, 'RWF', ?, ?, 'pending', ?, NOW(), NOW())
      `, [
        paymentId, booking_id, userId, phone_number, amount,
        externalId, externalId, JSON.stringify(paymentRequest)
      ]);

      await connection.commit();

      // Start polling for payment status
      setTimeout(() => this.pollMTNPaymentStatus(externalId, paymentId), 5000);

      logger.info(`MTN payment initiated: ${paymentId}`, {
        paymentId,
        bookingId: booking_id,
        userId,
        amount,
        phoneNumber: phone_number
      });

      res.json({
        success: true,
        message: 'Payment request sent to your phone. Please complete the payment.',
        data: {
          payment_id: paymentId,
          external_reference: externalId,
          amount,
          phone_number,
          status: 'pending'
        }
      });

    } catch (error) {
      await connection.rollback();
      logger.error('Error initiating MTN payment:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to initiate payment',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Payment service unavailable'
      });
    } finally {
      connection.release();
    }
  }

  // Airtel Money Payment
  static async initiateAirtelPayment(req: Request, res: Response) {
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();
      
      const { booking_id, phone_number, amount } = req.body;
      const userId = req.user?.id;

      // Validate booking
      const [booking] = await connection.execute(
        'SELECT * FROM bookings WHERE id = ? AND user_id = ? AND status = "pending"',
        [booking_id, userId]
      );

      if (!Array.isArray(booking) || booking.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Booking not found or already processed'
        });
      }

      const bookingData = booking[0] as any;

      // Get Airtel access token
      const airtelToken = await this.getAirtelAccessToken();

      // Create payment request
      const transactionId = uuidv4();
      const paymentRequest: AirtelPaymentRequest = {
        reference: `GOBUS-${bookingData.booking_reference}`,
        subscriber: {
          country: process.env.AIRTEL_COUNTRY || 'RW',
          currency: process.env.AIRTEL_CURRENCY || 'RWF',
          msisdn: phone_number.replace('+', '')
        },
        transaction: {
          amount: amount.toString(),
          country: process.env.AIRTEL_COUNTRY || 'RW',
          currency: process.env.AIRTEL_CURRENCY || 'RWF',
          id: transactionId
        }
      };

      // Make request to Airtel API
      const airtelResponse = await axios.post(
        `${process.env.AIRTEL_API_BASE_URL}/merchant/v1/payments/`,
        paymentRequest,
        {
          headers: {
            'Authorization': `Bearer ${airtelToken}`,
            'Content-Type': 'application/json',
            'X-Country': process.env.AIRTEL_COUNTRY || 'RW',
            'X-Currency': process.env.AIRTEL_CURRENCY || 'RWF'
          }
        }
      );

      // Save payment record
      const paymentId = uuidv4();
      await connection.execute(`
        INSERT INTO mobile_money_payments (
          id, booking_id, user_id, provider, phone_number, amount, currency,
          external_reference, provider_reference, status, request_data, response_data, created_at, updated_at
        ) VALUES (?, ?, ?, 'airtel', ?, ?, 'RWF', ?, ?, 'pending', ?, ?, NOW(), NOW())
      `, [
        paymentId, booking_id, userId, phone_number, amount,
        transactionId, airtelResponse.data.transaction?.id || transactionId,
        JSON.stringify(paymentRequest), JSON.stringify(airtelResponse.data)
      ]);

      await connection.commit();

      // Start polling for payment status
      setTimeout(() => this.pollAirtelPaymentStatus(transactionId, paymentId), 5000);

      logger.info(`Airtel payment initiated: ${paymentId}`, {
        paymentId,
        bookingId: booking_id,
        userId,
        amount,
        phoneNumber: phone_number
      });

      res.json({
        success: true,
        message: 'Payment request sent to your phone. Please complete the payment.',
        data: {
          payment_id: paymentId,
          external_reference: transactionId,
          amount,
          phone_number,
          status: 'pending'
        }
      });

    } catch (error) {
      await connection.rollback();
      logger.error('Error initiating Airtel payment:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to initiate payment',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Payment service unavailable'
      });
    } finally {
      connection.release();
    }
  }

  // Check payment status
  static async checkPaymentStatus(req: Request, res: Response) {
    try {
      const { paymentId } = req.params;
      const userId = req.user?.id;

      const [payment] = await db.execute(`
        SELECT 
          mmp.*,
          b.booking_reference,
          b.status as booking_status
        FROM mobile_money_payments mmp
        JOIN bookings b ON mmp.booking_id = b.id
        WHERE mmp.id = ? AND mmp.user_id = ?
      `, [paymentId, userId]);

      if (!Array.isArray(payment) || payment.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Payment not found'
        });
      }

      const paymentData = payment[0] as any;

      res.json({
        success: true,
        data: {
          payment: {
            id: paymentData.id,
            booking_reference: paymentData.booking_reference,
            provider: paymentData.provider,
            amount: paymentData.amount,
            currency: paymentData.currency,
            phone_number: paymentData.phone_number,
            status: paymentData.status,
            created_at: paymentData.created_at,
            completed_at: paymentData.completed_at
          }
        }
      });

    } catch (error) {
      logger.error('Error checking payment status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to check payment status',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // MTN Webhook handler
  static async handleMTNWebhook(req: Request, res: Response) {
    try {
      const { financialTransactionId, externalId, status, reason } = req.body;

      await db.execute(`
        UPDATE mobile_money_payments 
        SET status = ?, provider_transaction_id = ?, webhook_data = ?, completed_at = NOW(), updated_at = NOW()
        WHERE external_reference = ? AND provider = 'mtn'
      `, [status.toLowerCase(), financialTransactionId, JSON.stringify(req.body), externalId]);

      if (status === 'SUCCESSFUL') {
        await this.processSuccessfulPayment(externalId, 'mtn');
      }

      logger.info(`MTN webhook processed: ${externalId}`, {
        externalId,
        status,
        financialTransactionId
      });

      res.status(200).json({ success: true });

    } catch (error) {
      logger.error('Error processing MTN webhook:', error);
      res.status(500).json({ success: false });
    }
  }

  // Airtel Webhook handler
  static async handleAirtelWebhook(req: Request, res: Response) {
    try {
      const { transaction } = req.body;

      await db.execute(`
        UPDATE mobile_money_payments 
        SET status = ?, provider_transaction_id = ?, webhook_data = ?, completed_at = NOW(), updated_at = NOW()
        WHERE external_reference = ? AND provider = 'airtel'
      `, [
        transaction.status.toLowerCase(),
        transaction.airtel_money_id,
        JSON.stringify(req.body),
        transaction.id
      ]);

      if (transaction.status === 'TS') { // Transaction Successful
        await this.processSuccessfulPayment(transaction.id, 'airtel');
      }

      logger.info(`Airtel webhook processed: ${transaction.id}`, {
        transactionId: transaction.id,
        status: transaction.status,
        airtelMoneyId: transaction.airtel_money_id
      });

      res.status(200).json({ success: true });

    } catch (error) {
      logger.error('Error processing Airtel webhook:', error);
      res.status(500).json({ success: false });
    }
  }

  // Helper methods
  private static async getMTNApiUser(): Promise<string> {
    const response = await axios.post(
      `${config.mtn.apiBaseUrl}/v1_0/apiuser`,
      {
        providerCallbackHost: config.mtn.callbackUrl
      },
      {
        headers: {
          'Ocp-Apim-Subscription-Key': config.mtn.collection.primaryKey,
          'Content-Type': 'application/json'
        }
      }
    );
    return config.mtn.collection.userId || '';
  }

  private static async getMTNApiKey(apiUser: string): Promise<string> {
    const response = await axios.post(
      `${config.mtn.apiBaseUrl}/v1_0/apiuser/${apiUser}/apikey`,
      {},
      {
        headers: {
          'Ocp-Apim-Subscription-Key': config.mtn.collection.primaryKey
        }
      }
    );
    return response.data.apiKey;
  }

  private static async getAirtelAccessToken(): Promise<string> {
    const response = await axios.post(
      `${process.env.AIRTEL_API_BASE_URL}/auth/oauth2/token`,
      {
        client_id: process.env.AIRTEL_CLIENT_ID,
        client_secret: process.env.AIRTEL_CLIENT_SECRET,
        grant_type: process.env.AIRTEL_GRANT_TYPE || 'client_credentials'
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data.access_token;
  }

  private static async pollMTNPaymentStatus(externalId: string, paymentId: string): Promise<void> {
    try {
      const mtnApiKey = await this.getMTNApiKey(config.mtn.collection.userId || '');
      
      const response = await axios.get(
        `${config.mtn.apiBaseUrl}/collection/v1_0/requesttopay/${externalId}`,
        {
          headers: {
            'Authorization': `Bearer ${mtnApiKey}`,
            'X-Target-Environment': config.mtn.environment,
            'Ocp-Apim-Subscription-Key': config.mtn.collection.primaryKey
          }
        }
      );

      const status = response.data.status;
      
      await db.execute(`
        UPDATE mobile_money_payments 
        SET status = ?, response_data = ?, updated_at = NOW()
        WHERE id = ?
      `, [status.toLowerCase(), JSON.stringify(response.data), paymentId]);

      if (status === 'SUCCESSFUL') {
        await this.processSuccessfulPayment(externalId, 'mtn');
      } else if (status === 'PENDING') {
        // Continue polling
        setTimeout(() => this.pollMTNPaymentStatus(externalId, paymentId), 10000);
      }

    } catch (error) {
      logger.error('Error polling MTN payment status:', error);
    }
  }

  private static async pollAirtelPaymentStatus(transactionId: string, paymentId: string): Promise<void> {
    try {
      const airtelToken = await this.getAirtelAccessToken();
      
      const response = await axios.get(
        `${process.env.AIRTEL_API_BASE_URL}/standard/v1/payments/${transactionId}`,
        {
          headers: {
            'Authorization': `Bearer ${airtelToken}`,
            'X-Country': process.env.AIRTEL_COUNTRY || 'RW',
            'X-Currency': process.env.AIRTEL_CURRENCY || 'RWF'
          }
        }
      );

      const status = response.data.transaction.status;
      
      await db.execute(`
        UPDATE mobile_money_payments 
        SET status = ?, response_data = ?, updated_at = NOW()
        WHERE id = ?
      `, [status.toLowerCase(), JSON.stringify(response.data), paymentId]);

      if (status === 'TS') { // Transaction Successful
        await this.processSuccessfulPayment(transactionId, 'airtel');
      } else if (status === 'TIP') { // Transaction In Progress
        // Continue polling
        setTimeout(() => this.pollAirtelPaymentStatus(transactionId, paymentId), 10000);
      }

    } catch (error) {
      logger.error('Error polling Airtel payment status:', error);
    }
  }

  private static async processSuccessfulPayment(externalReference: string, provider: string): Promise<void> {
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();

      // Get payment details
      const [payment] = await connection.execute(
        'SELECT * FROM mobile_money_payments WHERE external_reference = ? AND provider = ?',
        [externalReference, provider]
      );

      if (!Array.isArray(payment) || payment.length === 0) {
        return;
      }

      const paymentData = payment[0] as any;

      // Update booking status
      await connection.execute(
        'UPDATE bookings SET status = "confirmed", payment_status = "completed", updated_at = NOW() WHERE id = ?',
        [paymentData.booking_id]
      );

      // Update payment status
      await connection.execute(
        'UPDATE mobile_money_payments SET status = "completed", completed_at = NOW(), updated_at = NOW() WHERE id = ?',
        [paymentData.id]
      );

      await connection.commit();

      logger.info(`Payment processed successfully: ${paymentData.id}`, {
        paymentId: paymentData.id,
        bookingId: paymentData.booking_id,
        provider,
        amount: paymentData.amount
      });

    } catch (error) {
      await connection.rollback();
      logger.error('Error processing successful payment:', error);
    } finally {
      connection.release();
    }
  }
}