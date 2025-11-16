import crypto from 'crypto';
import { pool } from '../config/db';
import { AppError } from '../utils/AppError';
import logger from '../utils/logger';
import * as mysql from 'mysql2/promise';

/**
 * Payment Tokenization Service
 * PCI-DSS Compliant payment tokenization system
 * Tokens replace sensitive payment data (card numbers, CVV, etc.)
 */

interface PaymentToken {
  id: string;
  token: string;
  tokenHash: string;
  userId: number;
  last4: string;
  expiryMonth?: number;
  expiryYear?: number;
  cardType?: string;
  isActive: boolean;
  expiresAt: Date;
  createdAt: Date;
}

interface PaymentMethodData {
  cardNumber: string;
  cvv?: string;
  expiryMonth?: number;
  expiryYear?: number;
  cardHolderName?: string;
  billingAddress?: string;
}

export class PaymentTokenizationService {
  private static readonly TOKEN_LENGTH = 32;
  private static readonly TOKEN_PREFIX = 'pk_';
  private static readonly TOKEN_EXPIRY_DAYS = 365;
  private static readonly ENCRYPTION_ALGORITHM = 'aes-256-gcm';
  private static readonly ENCRYPTION_KEY: string = process.env.PAYMENT_ENCRYPTION_KEY || 
    crypto.randomBytes(32).toString('hex');

  /**
   * Generate secure encryption key from environment or create new
   */
  private static getEncryptionKey(): Buffer {
    const key = process.env.PAYMENT_ENCRYPTION_KEY;
    if (!key || key.length !== 64) {
      logger.warn('Invalid or missing PAYMENT_ENCRYPTION_KEY. Using generated key.');
      return crypto.randomBytes(32);
    }
    return Buffer.from(key, 'hex');
  }

  /**
   * Encrypt sensitive payment data
   */
  private static encrypt(data: string): { encrypted: string; iv: string; authTag: string } {
    const key = this.getEncryptionKey();
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.ENCRYPTION_ALGORITHM, key, iv);

    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');

    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag
    };
  }

  /**
   * Decrypt sensitive payment data
   */
  private static decrypt(encrypted: string, iv: string, authTag: string): string {
    const key = this.getEncryptionKey();
    const decipher = crypto.createDecipheriv(
      this.ENCRYPTION_ALGORITHM,
      Buffer.from(iv, 'hex'),
      key
    );
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * Generate secure payment token
   */
  private static generateToken(): string {
    const randomBytes = crypto.randomBytes(this.TOKEN_LENGTH);
    const token = randomBytes.toString('hex');
    return `${this.TOKEN_PREFIX}${token}`;
  }

  /**
   * Hash token for storage (one-way hash)
   */
  private static hashToken(token: string): string {
    return crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');
  }

  /**
   * Extract last 4 digits from card number
   */
  private static getLast4(cardNumber: string): string {
    const cleaned = cardNumber.replace(/\s/g, '');
    return cleaned.slice(-4);
  }

  /**
   * Detect card type from card number
   */
  private static detectCardType(cardNumber: string): string {
    const cleaned = cardNumber.replace(/\s/g, '');
    
    if (/^4/.test(cleaned)) return 'visa';
    if (/^5[1-5]/.test(cleaned)) return 'mastercard';
    if (/^3[47]/.test(cleaned)) return 'amex';
    if (/^6(?:011|5)/.test(cleaned)) return 'discover';
    if (/^35/.test(cleaned)) return 'jcb';
    
    return 'unknown';
  }

  /**
   * Validate card number using Luhn algorithm
   */
  private static validateCardNumber(cardNumber: string): boolean {
    const cleaned = cardNumber.replace(/\s/g, '');
    
    if (!/^\d{13,19}$/.test(cleaned)) {
      return false;
    }

    // Luhn algorithm
    let sum = 0;
    let isEven = false;

    for (let i = cleaned.length - 1; i >= 0; i--) {
      let digit = parseInt(cleaned[i]);

      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }

      sum += digit;
      isEven = !isEven;
    }

    return sum % 10 === 0;
  }

  /**
   * Tokenize payment method
   */
  static async tokenizePaymentMethod(
    userId: number,
    paymentData: PaymentMethodData
  ): Promise<{ token: string; tokenId: string; last4: string; cardType: string }> {
    try {
      // Validate card number
      if (!this.validateCardNumber(paymentData.cardNumber)) {
        throw new AppError('Invalid card number', 400);
      }

      // Validate expiry if provided
      if (paymentData.expiryMonth && paymentData.expiryYear) {
        const currentDate = new Date();
        const expiryDate = new Date(
          paymentData.expiryYear,
          paymentData.expiryMonth - 1
        );
        
        if (expiryDate < currentDate) {
          throw new AppError('Card has expired', 400);
        }
      }

      // Encrypt sensitive data (never store plain text)
      const sensitiveData = JSON.stringify({
        cardNumber: paymentData.cardNumber,
        cvv: paymentData.cvv,
        expiryMonth: paymentData.expiryMonth,
        expiryYear: paymentData.expiryYear,
        cardHolderName: paymentData.cardHolderName
      });

      const { encrypted, iv, authTag } = this.encrypt(sensitiveData);

      // Generate token
      const token = this.generateToken();
      const tokenHash = this.hashToken(token);

      // Extract metadata
      const last4 = this.getLast4(paymentData.cardNumber);
      const cardType = this.detectCardType(paymentData.cardNumber);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + this.TOKEN_EXPIRY_DAYS);

      // Store token (hashed) and encrypted data
      const tokenId = crypto.randomUUID();
      await pool.execute(
        `INSERT INTO payment_tokens (
          id, token_hash, user_id, encrypted_data, iv, auth_tag,
          last4, expiry_month, expiry_year, card_type, expires_at,
          is_active, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())`,
        [
          tokenId,
          tokenHash,
          userId,
          encrypted,
          iv,
          authTag,
          last4,
          paymentData.expiryMonth || null,
          paymentData.expiryYear || null,
          cardType,
          expiresAt,
          paymentData.billingAddress || null
        ]
      );

      // Log tokenization (without sensitive data)
      logger.info('Payment method tokenized', {
        tokenId,
        userId,
        last4,
        cardType
      });

      return {
        token,
        tokenId,
        last4,
        cardType
      };
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Error tokenizing payment method', {
        error: error.message,
        userId
      });
      throw new AppError('Failed to tokenize payment method', 500);
    }
  }

  /**
   * Retrieve payment token (returns metadata only, not actual card data)
   */
  static async getPaymentToken(tokenId: string, userId: number): Promise<{
    id: string;
    last4: string;
    expiryMonth?: number;
    expiryYear?: number;
    cardType: string;
    isActive: boolean;
  }> {
    try {
      const [tokens] = await pool.execute<mysql.RowDataPacket[]>(
        `SELECT id, last4, expiry_month, expiry_year, card_type, is_active, expires_at
         FROM payment_tokens
         WHERE id = ? AND user_id = ? AND is_active = 1`,
        [tokenId, userId]
      );

      if (!tokens.length) {
        throw new AppError('Payment token not found', 404);
      }

      const token = tokens[0];

      // Check if token expired
      if (new Date(token.expires_at) < new Date()) {
        throw new AppError('Payment token has expired', 400);
      }

      return {
        id: token.id,
        last4: token.last4,
        expiryMonth: token.expiry_month || undefined,
        expiryYear: token.expiry_year || undefined,
        cardType: token.card_type,
        isActive: token.is_active === 1
      };
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Error retrieving payment token', {
        error: error.message,
        tokenId,
        userId
      });
      throw new AppError('Failed to retrieve payment token', 500);
    }
  }

  /**
   * Validate and retrieve payment data (for actual payment processing)
   * This should only be called by secure payment processing service
   */
  static async validateAndRetrievePaymentData(
    tokenHash: string,
    userId: number
  ): Promise<PaymentMethodData> {
    try {
      const [tokens] = await pool.execute<mysql.RowDataPacket[]>(
        `SELECT encrypted_data, iv, auth_tag, is_active, expires_at
         FROM payment_tokens
         WHERE token_hash = ? AND user_id = ? AND is_active = 1`,
        [tokenHash, userId]
      );

      if (!tokens.length) {
        throw new AppError('Invalid payment token', 401);
      }

      const token = tokens[0];

      // Check if token expired
      if (new Date(token.expires_at) < new Date()) {
        throw new AppError('Payment token has expired', 400);
      }

      // Decrypt payment data
      const decryptedData = this.decrypt(
        token.encrypted_data,
        token.iv,
        token.auth_tag
      );

      return JSON.parse(decryptedData);
    } catch (error: any) {
      logger.error('Error validating payment token', {
        error: error.message,
        userId
      });
      throw new AppError('Failed to validate payment token', 500);
    }
  }

  /**
   * Delete payment token (for card deletion)
   */
  static async deletePaymentToken(tokenId: string, userId: number): Promise<void> {
    try {
      const [result] = await pool.execute<mysql.ResultSetHeader>(
        `UPDATE payment_tokens
         SET is_active = 0, updated_at = NOW()
         WHERE id = ? AND user_id = ?`,
        [tokenId, userId]
      );

      if (result.affectedRows === 0) {
        throw new AppError('Payment token not found', 404);
      }

      logger.info('Payment token deleted', {
        tokenId,
        userId
      });
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Error deleting payment token', {
        error: error.message,
        tokenId,
        userId
      });
      throw new AppError('Failed to delete payment token', 500);
    }
  }

  /**
   * List user's payment tokens (metadata only)
   */
  static async listUserPaymentTokens(userId: number): Promise<any[]> {
    try {
      const [tokens] = await pool.execute<mysql.RowDataPacket[]>(
        `SELECT id, last4, expiry_month, expiry_year, card_type, is_active, expires_at, created_at
         FROM payment_tokens
         WHERE user_id = ? AND is_active = 1 AND expires_at > NOW()
         ORDER BY created_at DESC`,
        [userId]
      );

      return tokens.map(token => ({
        id: token.id,
        last4: token.last4,
        expiryMonth: token.expiry_month,
        expiryYear: token.expiry_year,
        cardType: token.card_type,
        isActive: token.is_active === 1,
        expiresAt: token.expires_at,
        createdAt: token.created_at
      }));
    } catch (error: any) {
      logger.error('Error listing payment tokens', {
        error: error.message,
        userId
      });
      throw new AppError('Failed to list payment tokens', 500);
    }
  }
}
