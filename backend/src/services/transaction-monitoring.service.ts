import { pool } from '../config/db';
import { AppError } from '../utils/AppError';
import logger from '../utils/logger';
import * as mysql from 'mysql2/promise';
import { FraudDetectionService, TransactionContext } from './fraud-detection.service';

/**
 * Transaction Monitoring Service
 * Real-time monitoring of all transactions with fraud detection
 * Security audit logging and anomaly detection
 */

interface MonitoringContext extends TransactionContext {
  transactionId?: number;
  requestStartTime: number;
}

export class TransactionMonitoringService {
  /**
   * Monitor and analyze transaction
   */
  static async monitorTransaction(
    context: MonitoringContext
  ): Promise<{
    allowed: boolean;
    riskScore?: number;
    riskLevel?: string;
    fraudAnalysis?: any;
  }> {
    const requestStartTime = Date.now();

    try {
      // 1. Run fraud detection
      const fraudAnalysis = await FraudDetectionService.analyzeTransaction(context);

      // 2. Determine if transaction should proceed
      const allowed = fraudAnalysis.recommendedAction !== 'block';

      // 3. Log transaction monitoring
      const processingTime = Date.now() - requestStartTime;
      await this.logTransactionMonitoring({
        ...context,
        riskScore: fraudAnalysis.score,
        riskLevel: fraudAnalysis.riskLevel,
        recommendedAction: fraudAnalysis.recommendedAction,
        indicators: fraudAnalysis.reasons,
        processingTime,
        allowed
      });

      // 4. Log security audit if high risk
      if (fraudAnalysis.riskLevel === 'high' || fraudAnalysis.riskLevel === 'critical') {
        await this.logSecurityAudit({
          userId: context.userId,
          eventType: 'high_risk_transaction',
          severity: fraudAnalysis.riskLevel === 'critical' ? 'critical' : 'error',
          description: `High risk transaction detected: ${fraudAnalysis.score}% risk score`,
          transactionData: {
            amount: context.amount,
            type: context.transactionType,
            riskScore: fraudAnalysis.score,
            indicators: fraudAnalysis.reasons
          }
        });
      }

      // 5. If blocked, create alert
      if (!allowed) {
        await this.createFraudAlert(context, fraudAnalysis);
      }

      return {
        allowed,
        riskScore: fraudAnalysis.score,
        riskLevel: fraudAnalysis.riskLevel,
        fraudAnalysis
      };
    } catch (error: any) {
      logger.error('Error monitoring transaction', {
        error: error.message,
        context
      });

      // On error, allow transaction but flag for review
      await this.logTransactionMonitoring({
        ...context,
        status: 'failed',
        errorMessage: error.message,
        processingTime: Date.now() - requestStartTime,
        allowed: true // Allow on monitoring failure
      });

      return {
        allowed: true,
        riskScore: 50, // Medium risk due to monitoring failure
        riskLevel: 'medium'
      };
    }
  }

  /**
   * Log transaction monitoring
   */
  private static async logTransactionMonitoring(data: {
    userId: number;
    transactionType: string;
    transactionId?: number;
    amount: number;
    currency: string;
    status?: string;
    ipAddress?: string;
    userAgent?: string;
    deviceId?: string;
    location?: any;
    riskScore?: number;
    riskLevel?: string;
    recommendedAction?: string;
    indicators?: string[];
    processingTime: number;
    allowed: boolean;
    errorMessage?: string;
  }): Promise<void> {
    try {
      await pool.execute(
        `INSERT INTO transaction_monitoring_logs (
          user_id, transaction_type, transaction_id, amount, currency,
          status, ip_address, user_agent, device_id, location_data,
          risk_indicators, processing_time_ms, error_message, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          data.userId,
          data.transactionType,
          data.transactionId || null,
          data.amount,
          data.currency,
          data.allowed ? (data.status || 'completed') : 'blocked',
          data.ipAddress || null,
          data.userAgent || null,
          data.deviceId || null,
          data.location ? JSON.stringify(data.location) : null,
          data.indicators ? JSON.stringify(data.indicators) : null,
          data.processingTime,
          data.errorMessage || null
        ]
      );
    } catch (error: any) {
      logger.error('Error logging transaction monitoring', {
        error: error.message
      });
    }
  }

  /**
   * Log security audit event
   */
  private static async logSecurityAudit(data: {
    userId?: number;
    eventType: string;
    eventCategory?: 'authentication' | 'authorization' | 'transaction' | 'configuration' | 'security';
    severity: 'info' | 'warning' | 'error' | 'critical';
    description: string;
    ipAddress?: string;
    userAgent?: string;
    requestData?: any;
    responseStatus?: number;
    transactionData?: any;
  }): Promise<void> {
    try {
      await pool.execute(
        `INSERT INTO security_audit_logs (
          user_id, event_type, event_category, severity,
          description, ip_address, user_agent, request_data, response_status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          data.userId || null,
          data.eventType,
          data.eventCategory || 'security',
          data.severity,
          data.description,
          data.ipAddress || null,
          data.userAgent || null,
          data.requestData || data.transactionData ? JSON.stringify(data.requestData || data.transactionData) : null,
          data.responseStatus || null
        ]
      );
    } catch (error: any) {
      logger.error('Error logging security audit', {
        error: error.message
      });
    }
  }

  /**
   * Create fraud alert
   */
  private static async createFraudAlert(
    context: TransactionContext,
    fraudAnalysis: any
  ): Promise<void> {
    try {
      // Create fraud report automatically for critical cases
      if (fraudAnalysis.riskLevel === 'critical') {
        await pool.execute(
          `INSERT INTO fraud_reports (
            reported_user_id, reported_by_user_id, report_type,
            description, transaction_id, status, created_at
          ) VALUES (?, 0, 'suspicious_activity', ?, ?, 'pending', NOW())`,
          [
            context.userId,
            `Auto-generated: Critical risk transaction blocked. Score: ${fraudAnalysis.score}%. Indicators: ${fraudAnalysis.reasons.join(', ')}`,
            null // Transaction ID would be set if available
          ]
        );
      }

      // Send alert to administrators (in production, use notification service)
      logger.warn('Fraud alert created', {
        userId: context.userId,
        riskScore: fraudAnalysis.score,
        riskLevel: fraudAnalysis.riskLevel,
        indicators: fraudAnalysis.reasons
      });
    } catch (error: any) {
      logger.error('Error creating fraud alert', {
        error: error.message
      });
    }
  }

  /**
   * Get transaction monitoring statistics
   */
  static async getMonitoringStats(timeRange: '1h' | '24h' | '7d' | '30d' = '24h'): Promise<{
    totalTransactions: number;
    blockedTransactions: number;
    highRiskTransactions: number;
    averageRiskScore: number;
    averageProcessingTime: number;
    topRiskIndicators: Array<{ indicator: string; count: number }>;
  }> {
    try {
      const timeIntervals: Record<string, string> = {
        '1h': 'INTERVAL 1 HOUR',
        '24h': 'INTERVAL 24 HOUR',
        '7d': 'INTERVAL 7 DAY',
        '30d': 'INTERVAL 30 DAY'
      };

      const interval = timeIntervals[timeRange] || timeIntervals['24h'];

      // Get overall stats
      const [stats] = await pool.execute<mysql.RowDataPacket[]>(
        `SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'blocked' THEN 1 ELSE 0 END) as blocked,
          SUM(CASE WHEN JSON_EXTRACT(risk_indicators, '$.risk_level') IN ('high', 'critical') THEN 1 ELSE 0 END) as high_risk,
          AVG(JSON_EXTRACT(risk_indicators, '$.risk_score')) as avg_score,
          AVG(processing_time_ms) as avg_processing_time
         FROM transaction_monitoring_logs
         WHERE created_at > DATE_SUB(NOW(), ${interval})`,
        []
      );

      // Get top risk indicators
      const [indicators] = await pool.execute<mysql.RowDataPacket[]>(
        `SELECT 
          JSON_EXTRACT(risk_indicators, '$[*].type') as indicator_types
         FROM transaction_monitoring_logs
         WHERE created_at > DATE_SUB(NOW(), ${interval})
         AND risk_indicators IS NOT NULL
         LIMIT 1000`,
        []
      );

      // Count indicator occurrences
      const indicatorCounts: Record<string, number> = {};
      indicators.forEach((row: any) => {
        if (row.indicator_types) {
          const types = JSON.parse(row.indicator_types);
          if (Array.isArray(types)) {
            types.forEach((type: string) => {
              indicatorCounts[type] = (indicatorCounts[type] || 0) + 1;
            });
          }
        }
      });

      const topRiskIndicators = Object.entries(indicatorCounts)
        .map(([indicator, count]) => ({ indicator, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      return {
        totalTransactions: parseInt(stats[0].total || '0'),
        blockedTransactions: parseInt(stats[0].blocked || '0'),
        highRiskTransactions: parseInt(stats[0].high_risk || '0'),
        averageRiskScore: parseFloat(stats[0].avg_score || '0'),
        averageProcessingTime: parseFloat(stats[0].avg_processing_time || '0'),
        topRiskIndicators
      };
    } catch (error: any) {
      logger.error('Error getting monitoring stats', {
        error: error.message
      });
      return {
        totalTransactions: 0,
        blockedTransactions: 0,
        highRiskTransactions: 0,
        averageRiskScore: 0,
        averageProcessingTime: 0,
        topRiskIndicators: []
      };
    }
  }

  /**
   * Get user transaction monitoring history
   */
  static async getUserMonitoringHistory(
    userId: number,
    limit: number = 50
  ): Promise<any[]> {
    try {
      const [logs] = await pool.execute<mysql.RowDataPacket[]>(
        `SELECT 
          id, transaction_type, amount, currency, status,
          risk_indicators, processing_time_ms, created_at
         FROM transaction_monitoring_logs
         WHERE user_id = ?
         ORDER BY created_at DESC
         LIMIT ?`,
        [userId, limit]
      );

      return logs.map(log => ({
        ...log,
        risk_indicators: log.risk_indicators ? JSON.parse(log.risk_indicators) : null
      }));
    } catch (error: any) {
      logger.error('Error getting user monitoring history', {
        error: error.message,
        userId
      });
      return [];
    }
  }
}
