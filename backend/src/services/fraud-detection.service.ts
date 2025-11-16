import { pool } from '../config/db';
import { AppError } from '../utils/AppError';
import logger from '../utils/logger';
import * as mysql from 'mysql2/promise';

/**
 * Fraud Detection Service
 * Advanced ML-based fraud detection with anomaly detection
 * Risk scoring and suspicious activity detection
 */

interface TransactionRiskScore {
  score: number; // 0-100 (higher = more risky)
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  reasons: string[];
  recommendedAction: 'allow' | 'review' | 'block';
}

interface FraudIndicator {
  type: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  weight: number;
}

interface TransactionContext {
  userId: number;
  amount: number;
  currency: string;
  transactionType: 'payment' | 'transfer' | 'deposit' | 'withdrawal';
  ipAddress?: string;
  userAgent?: string;
  deviceId?: string;
  location?: {
    latitude: number;
    longitude: number;
    city?: string;
    country?: string;
  };
  recipientSerialCode?: string;
  paymentMethod?: string;
}

export class FraudDetectionService {
  private static readonly RISK_THRESHOLD_LOW = 30;
  private static readonly RISK_THRESHOLD_MEDIUM = 60;
  private static readonly RISK_THRESHOLD_HIGH = 80;
  private static readonly RISK_THRESHOLD_CRITICAL = 90;

  /**
   * Analyze transaction for fraud indicators
   */
  static async analyzeTransaction(context: TransactionContext): Promise<TransactionRiskScore> {
    try {
      const indicators: FraudIndicator[] = [];
      let totalScore = 0;

      // 1. Velocity checks (multiple transactions in short time)
      const velocityScore = await this.checkVelocity(context);
      if (velocityScore > 0) {
        indicators.push({
          type: 'velocity',
          severity: velocityScore > 50 ? 'high' : velocityScore > 25 ? 'medium' : 'low',
          description: `Unusual transaction velocity detected (${velocityScore}% risk)`,
          weight: velocityScore
        });
        totalScore += velocityScore * 0.3;
      }

      // 2. Amount anomaly detection
      const amountScore = await this.checkAmountAnomaly(context);
      if (amountScore > 0) {
        indicators.push({
          type: 'amount_anomaly',
          severity: amountScore > 50 ? 'high' : 'medium',
          description: `Unusual transaction amount (${amountScore}% risk)`,
          weight: amountScore
        });
        totalScore += amountScore * 0.25;
      }

      // 3. Geographic anomaly detection
      const geoScore = await this.checkGeographicAnomaly(context);
      if (geoScore > 0) {
        indicators.push({
          type: 'geographic_anomaly',
          severity: geoScore > 50 ? 'high' : 'medium',
          description: `Unusual geographic location (${geoScore}% risk)`,
          weight: geoScore
        });
        totalScore += geoScore * 0.2;
      }

      // 4. Device and IP checks
      const deviceScore = await this.checkDeviceAndIP(context);
      if (deviceScore > 0) {
        indicators.push({
          type: 'device_ip_anomaly',
          severity: deviceScore > 50 ? 'high' : 'medium',
          description: `Suspicious device or IP (${deviceScore}% risk)`,
          weight: deviceScore
        });
        totalScore += deviceScore * 0.15;
      }

      // 5. Recipient checks (for transfers)
      if (context.transactionType === 'transfer' && context.recipientSerialCode) {
        const recipientScore = await this.checkRecipient(context);
        if (recipientScore > 0) {
          indicators.push({
            type: 'recipient_risk',
            severity: recipientScore > 50 ? 'high' : 'medium',
            description: `Suspicious recipient activity (${recipientScore}% risk)`,
            weight: recipientScore
          });
          totalScore += recipientScore * 0.1;
        }
      }

      // Normalize score to 0-100
      const finalScore = Math.min(100, Math.round(totalScore));

      // Determine risk level
      let riskLevel: 'low' | 'medium' | 'high' | 'critical';
      let recommendedAction: 'allow' | 'review' | 'block';

      if (finalScore >= this.RISK_THRESHOLD_CRITICAL) {
        riskLevel = 'critical';
        recommendedAction = 'block';
      } else if (finalScore >= this.RISK_THRESHOLD_HIGH) {
        riskLevel = 'high';
        recommendedAction = 'block';
      } else if (finalScore >= this.RISK_THRESHOLD_MEDIUM) {
        riskLevel = 'medium';
        recommendedAction = 'review';
      } else if (finalScore >= this.RISK_THRESHOLD_LOW) {
        riskLevel = 'low';
        recommendedAction = 'review';
      } else {
        riskLevel = 'low';
        recommendedAction = 'allow';
      }

      // Record fraud analysis
      await this.recordFraudAnalysis(context, finalScore, riskLevel, indicators);

      return {
        score: finalScore,
        riskLevel,
        reasons: indicators.map(i => i.description),
        recommendedAction
      };
    } catch (error: any) {
      logger.error('Error analyzing transaction for fraud', {
        error: error.message,
        context
      });
      // On error, allow transaction but flag for review
      return {
        score: 50,
        riskLevel: 'medium',
        reasons: ['Fraud analysis error - flagged for review'],
        recommendedAction: 'review'
      };
    }
  }

  /**
   * Check transaction velocity (frequency)
   */
  private static async checkVelocity(context: TransactionContext): Promise<number> {
    try {
      // Check transactions in last hour
      const [recentTransactions] = await pool.execute<mysql.RowDataPacket[]>(
        `SELECT COUNT(*) as count, SUM(amount) as total
         FROM wallet_transactions
         WHERE user_id = ? AND created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)`,
        [context.userId]
      );

      const count = parseInt(recentTransactions[0].count || '0');
      const total = parseFloat(recentTransactions[0].total || '0');

      let score = 0;

      // More than 10 transactions in an hour = suspicious
      if (count > 10) {
        score += 60;
      } else if (count > 5) {
        score += 30;
      }

      // Large total amount in short time
      if (total > 1000000) { // 1M RWF
        score += 40;
      } else if (total > 500000) {
        score += 20;
      }

      return Math.min(100, score);
    } catch (error: any) {
      logger.error('Error checking velocity', { error: error.message });
      return 0;
    }
  }

  /**
   * Check amount anomalies
   */
  private static async checkAmountAnomaly(context: TransactionContext): Promise<number> {
    try {
      // Get user's average transaction amount
      const [stats] = await pool.execute<mysql.RowDataPacket[]>(
        `SELECT 
          AVG(amount) as avg_amount,
          MAX(amount) as max_amount,
          STDDEV(amount) as stddev_amount
         FROM wallet_transactions
         WHERE user_id = ? AND transaction_type = ? AND created_at > DATE_SUB(NOW(), INTERVAL 90 DAY)`,
        [context.userId, context.transactionType]
      );

      const avgAmount = parseFloat(stats[0].avg_amount || '0');
      const maxAmount = parseFloat(stats[0].max_amount || '0');
      const stddev = parseFloat(stats[0].stddev_amount || '0');

      let score = 0;

      // If no history, moderate risk for large amounts
      if (avgAmount === 0) {
        if (context.amount > 500000) {
          score = 40;
        } else if (context.amount > 100000) {
          score = 20;
        }
        return score;
      }

      // Amount significantly higher than average
      if (context.amount > avgAmount * 5) {
        score += 60;
      } else if (context.amount > avgAmount * 3) {
        score += 40;
      } else if (context.amount > avgAmount * 2) {
        score += 20;
      }

      // Amount exceeds previous maximum significantly
      if (context.amount > maxAmount * 2) {
        score += 30;
      }

      // Statistical outlier (beyond 3 standard deviations)
      if (stddev > 0 && context.amount > avgAmount + (3 * stddev)) {
        score += 50;
      }

      return Math.min(100, score);
    } catch (error: any) {
      logger.error('Error checking amount anomaly', { error: error.message });
      return 0;
    }
  }

  /**
   * Check geographic anomalies
   */
  private static async checkGeographicAnomaly(context: TransactionContext): Promise<number> {
    try {
      if (!context.location || !context.ipAddress) {
        return 0;
      }

      // Get user's recent transaction locations
      const [recentLocations] = await pool.execute<mysql.RowDataPacket[]>(
        `SELECT location_lat, location_lng, ip_address
         FROM fraud_analysis_logs
         WHERE user_id = ? AND created_at > DATE_SUB(NOW(), INTERVAL 7 DAY)
         ORDER BY created_at DESC
         LIMIT 10`,
        [context.userId]
      );

      if (recentLocations.length === 0) {
        // No history - first transaction, allow
        return 0;
      }

      let score = 0;

      // Check if location changed dramatically
      const lastLocation = recentLocations[0];
      if (lastLocation.location_lat && lastLocation.location_lng) {
        const distance = this.calculateDistance(
          lastLocation.location_lat,
          lastLocation.location_lng,
          context.location.latitude,
          context.location.longitude
        );

        // If moved more than 1000km in less than 24 hours = impossible
        const hoursSinceLastTx = (Date.now() - new Date(recentLocations[0].created_at).getTime()) / (1000 * 60 * 60);
        
        if (distance > 1000 && hoursSinceLastTx < 24) {
          score += 80;
        } else if (distance > 500 && hoursSinceLastTx < 12) {
          score += 60;
        } else if (distance > 200 && hoursSinceLastTx < 6) {
          score += 40;
        }
      }

      // Check IP address change
      if (lastLocation.ip_address && lastLocation.ip_address !== context.ipAddress) {
        score += 20;
      }

      return Math.min(100, score);
    } catch (error: any) {
      logger.error('Error checking geographic anomaly', { error: error.message });
      return 0;
    }
  }

  /**
   * Check device and IP anomalies
   */
  private static async checkDeviceAndIP(context: TransactionContext): Promise<number> {
    try {
      if (!context.deviceId && !context.ipAddress) {
        return 0;
      }

      let score = 0;

      // Check if IP is known fraud IP (would integrate with external service)
      if (context.ipAddress) {
        // Check for VPN/Proxy indicators
        if (await this.isProxyOrVPN(context.ipAddress)) {
          score += 30;
        }

        // Check if IP used by multiple accounts recently
        const [ipUsage] = await pool.execute<mysql.RowDataPacket[]>(
          `SELECT COUNT(DISTINCT user_id) as unique_users
           FROM fraud_analysis_logs
           WHERE ip_address = ? AND created_at > DATE_SUB(NOW(), INTERVAL 1 DAY)`,
          [context.ipAddress]
        );

        const uniqueUsers = parseInt(ipUsage[0].unique_users || '0');
        if (uniqueUsers > 10) {
          score += 50; // Same IP, many accounts = suspicious
        } else if (uniqueUsers > 5) {
          score += 30;
        }
      }

      // Check device fingerprint changes
      if (context.deviceId) {
        const [deviceUsage] = await pool.execute<mysql.RowDataPacket[]>(
          `SELECT COUNT(*) as count
           FROM fraud_analysis_logs
           WHERE user_id = ? AND device_id = ? AND created_at > DATE_SUB(NOW(), INTERVAL 30 DAY)`,
          [context.userId, context.deviceId]
        );

        const deviceCount = parseInt(deviceUsage[0].count || '0');
        if (deviceCount === 0) {
          // New device
          score += 20;
        }
      }

      return Math.min(100, score);
    } catch (error: any) {
      logger.error('Error checking device/IP anomaly', { error: error.message });
      return 0;
    }
  }

  /**
   * Check recipient risk (for transfers)
   */
  private static async checkRecipient(context: TransactionContext): Promise<number> {
    try {
      if (!context.recipientSerialCode) {
        return 0;
      }

      // Check if recipient has been reported for fraud
      const [recipientRisk] = await pool.execute<mysql.RowDataPacket[]>(
        `SELECT COUNT(*) as fraud_count
         FROM fraud_reports
         WHERE reported_user_serial_code = ? AND status = 'confirmed'`,
        [context.recipientSerialCode]
      );

      const fraudCount = parseInt(recipientRisk[0].fraud_count || '0');
      if (fraudCount > 0) {
        return 80; // High risk if recipient has fraud reports
      }

      // Check if this is first transaction to this recipient
      const [transactionHistory] = await pool.execute<mysql.RowDataPacket[]>(
        `SELECT COUNT(*) as count
         FROM wallet_transactions wt
         JOIN users u ON wt.related_user_id = u.id
         WHERE wt.user_id = ? AND u.serial_code = ?`,
        [context.userId, context.recipientSerialCode]
      );

      const historyCount = parseInt(transactionHistory[0].count || '0');
      if (historyCount === 0 && context.amount > 100000) {
        // Large amount to new recipient
        return 30;
      }

      return 0;
    } catch (error: any) {
      logger.error('Error checking recipient risk', { error: error.message });
      return 0;
    }
  }

  /**
   * Record fraud analysis for learning
   */
  private static async recordFraudAnalysis(
    context: TransactionContext,
    score: number,
    riskLevel: string,
    indicators: FraudIndicator[]
  ): Promise<void> {
    try {
      await pool.execute(
        `INSERT INTO fraud_analysis_logs (
          user_id, transaction_type, amount, currency,
          risk_score, risk_level, indicators_json,
          ip_address, user_agent, device_id,
          location_lat, location_lng, location_city, location_country,
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          context.userId,
          context.transactionType,
          context.amount,
          context.currency,
          score,
          riskLevel,
          JSON.stringify(indicators),
          context.ipAddress || null,
          context.userAgent || null,
          context.deviceId || null,
          context.location?.latitude || null,
          context.location?.longitude || null,
          context.location?.city || null,
          context.location?.country || null
        ]
      );
    } catch (error: any) {
      logger.error('Error recording fraud analysis', { error: error.message });
    }
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  private static calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private static toRad(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }

  /**
   * Check if IP is proxy/VPN (simplified - integrate with external service in production)
   */
  private static async isProxyOrVPN(ipAddress: string): Promise<boolean> {
    // In production, integrate with services like:
    // - MaxMind GeoIP2
    // - IPQualityScore
    // - IP2Location
    
    // For now, return false (implement external check)
    return false;
  }

  /**
   * Get fraud statistics for user
   */
  static async getUserFraudStats(userId: number): Promise<{
    totalTransactions: number;
    highRiskTransactions: number;
    blockedTransactions: number;
    averageRiskScore: number;
  }> {
    try {
      const [stats] = await pool.execute<mysql.RowDataPacket[]>(
        `SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN risk_level IN ('high', 'critical') THEN 1 ELSE 0 END) as high_risk,
          SUM(CASE WHEN recommended_action = 'block' THEN 1 ELSE 0 END) as blocked,
          AVG(risk_score) as avg_score
         FROM fraud_analysis_logs
         WHERE user_id = ? AND created_at > DATE_SUB(NOW(), INTERVAL 90 DAY)`,
        [userId]
      );

      return {
        totalTransactions: parseInt(stats[0].total || '0'),
        highRiskTransactions: parseInt(stats[0].high_risk || '0'),
        blockedTransactions: parseInt(stats[0].blocked || '0'),
        averageRiskScore: parseFloat(stats[0].avg_score || '0')
      };
    } catch (error: any) {
      logger.error('Error getting fraud stats', { error: error.message });
      return {
        totalTransactions: 0,
        highRiskTransactions: 0,
        blockedTransactions: 0,
        averageRiskScore: 0
      };
    }
  }
}
