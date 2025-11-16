import { Request, Response, NextFunction } from 'express';
import { pool } from '../config/db';
import { AppError } from '../utils/AppError';
import logger from '../utils/logger';
import * as mysql from 'mysql2/promise';

/**
 * Rate Limiting Middleware
 * Protects endpoints from abuse and DDoS attacks
 * Supports multiple rate limit strategies
 */

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  message?: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (req: Request) => string;
}

const defaultKeyGenerator = (req: Request): string => {
  // Use user ID if authenticated, otherwise use IP address
  return (req as any).user?.id?.toString() || req.ip || 'unknown';
};

/**
 * Create rate limiter middleware
 */
export const createRateLimiter = (config: RateLimitConfig) => {
  const {
    windowMs,
    maxRequests,
    message = 'Too many requests, please try again later',
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
    keyGenerator = defaultKeyGenerator
  } = config;

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const identifier = keyGenerator(req);
      const endpoint = req.path || req.route?.path || 'unknown';
      const now = new Date();

      // Get or create rate limit record
      const [records] = await pool.execute<mysql.RowDataPacket[]>(
        `SELECT * FROM rate_limit_tracking
         WHERE identifier = ? AND endpoint = ?`,
        [identifier, endpoint]
      );

      let record: any;
      let windowStart: Date;

      if (records.length === 0) {
        // Create new record
        windowStart = new Date();
        await pool.execute(
          `INSERT INTO rate_limit_tracking (identifier, endpoint, request_count, window_start)
           VALUES (?, ?, 1, ?)`,
          [identifier, endpoint, windowStart]
        );
        record = {
          request_count: 1,
          window_start: windowStart,
          blocked_until: null
        };
      } else {
        record = records[0];
        windowStart = new Date(record.window_start);

        // Check if blocked
        if (record.blocked_until) {
          const blockedUntil = new Date(record.blocked_until);
          if (now < blockedUntil) {
            const secondsRemaining = Math.ceil((blockedUntil.getTime() - now.getTime()) / 1000);
            
            // Log security event
            await logSecurityEvent(req, 'rate_limit_blocked', {
              identifier,
              endpoint,
              secondsRemaining
            });

            return res.status(429).json({
              success: false,
              message,
              retryAfter: secondsRemaining
            });
          } else {
            // Block expired, reset
            windowStart = new Date();
            await pool.execute(
              `UPDATE rate_limit_tracking
               SET request_count = 1, window_start = ?, blocked_until = NULL
               WHERE identifier = ? AND endpoint = ?`,
              [windowStart, identifier, endpoint]
            );
            record.request_count = 1;
          }
        } else {
          // Check if window expired
          const windowEnd = new Date(windowStart.getTime() + windowMs);
          
          if (now > windowEnd) {
            // Window expired, reset
            windowStart = new Date();
            await pool.execute(
              `UPDATE rate_limit_tracking
               SET request_count = 1, window_start = ?
               WHERE identifier = ? AND endpoint = ?`,
              [windowStart, identifier, endpoint]
            );
            record.request_count = 1;
          } else {
            // Within window, increment count
            const newCount = record.request_count + 1;
            await pool.execute(
              `UPDATE rate_limit_tracking
               SET request_count = ?, last_request_at = NOW()
               WHERE identifier = ? AND endpoint = ?`,
              [newCount, identifier, endpoint]
            );
            record.request_count = newCount;
          }
        }
      }

      // Check if limit exceeded
      if (record.request_count > maxRequests) {
        // Calculate block duration (exponential backoff)
        const exceededBy = record.request_count - maxRequests;
        const blockDurationMs = Math.min(
          3600000, // Max 1 hour
          windowMs * Math.pow(2, exceededBy)
        );
        const blockedUntil = new Date(now.getTime() + blockDurationMs);

        await pool.execute(
          `UPDATE rate_limit_tracking
           SET blocked_until = ?
           WHERE identifier = ? AND endpoint = ?`,
          [blockedUntil, identifier, endpoint]
        );

        // Log security event
        await logSecurityEvent(req, 'rate_limit_exceeded', {
          identifier,
          endpoint,
          requestCount: record.request_count,
          maxRequests,
          blockedUntil
        });

        const secondsRemaining = Math.ceil(blockDurationMs / 1000);
        return res.status(429).json({
          success: false,
          message,
          retryAfter: secondsRemaining
        });
      }

      // Add rate limit headers
      res.set({
        'X-RateLimit-Limit': maxRequests.toString(),
        'X-RateLimit-Remaining': Math.max(0, maxRequests - record.request_count).toString(),
        'X-RateLimit-Reset': new Date(windowStart.getTime() + windowMs).toISOString()
      });

      // Track response status for skip options
      const originalSend = res.send;
      res.send = function (body) {
        const statusCode = res.statusCode;

        // Update skip logic if needed
        if (skipSuccessfulRequests && statusCode < 400) {
          // Don't count successful requests
        } else if (skipFailedRequests && statusCode >= 400) {
          // Don't count failed requests
        }

        return originalSend.call(this, body);
      };

      next();
    } catch (error: any) {
      logger.error('Error in rate limiter', {
        error: error.message,
        path: req.path
      });
      // On error, allow request but log
      next();
    }
  };
};

/**
 * Log security event
 */
async function logSecurityEvent(req: Request, eventType: string, data: any): Promise<void> {
  try {
    await pool.execute(
      `INSERT INTO security_audit_logs (
        user_id, event_type, event_category, severity,
        description, ip_address, user_agent, request_data, created_at
      ) VALUES (?, ?, 'security', 'warning', ?, ?, ?, ?, NOW())`,
      [
        (req as any).user?.id || null,
        eventType,
        JSON.stringify(data),
        req.ip || null,
        req.get('user-agent') || null,
        JSON.stringify({
          path: req.path,
          method: req.method,
          query: req.query,
          body: sanitizeRequestBody(req.body)
        })
      ]
    );
  } catch (error: any) {
    logger.error('Error logging security event', { error: error.message });
  }
}

/**
 * Sanitize request body to remove sensitive data
 */
function sanitizeRequestBody(body: any): any {
  if (!body || typeof body !== 'object') {
    return body;
  }

  const sensitiveFields = ['password', 'pin', 'cvv', 'cardNumber', 'token'];
  const sanitized = { ...body };

  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '***REDACTED***';
    }
  }

  return sanitized;
}

/**
 * Pre-configured rate limiters for common use cases
 */

// Strict rate limiter for payment endpoints
export const paymentRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 10,
  message: 'Too many payment requests. Please wait before trying again.'
});

// Authentication rate limiter
export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5,
  message: 'Too many authentication attempts. Please wait before trying again.'
});

// API rate limiter (general)
export const apiRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 60,
  message: 'Rate limit exceeded. Please slow down your requests.'
});

// OTP rate limiter
export const otpRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 5,
  message: 'Too many OTP requests. Please wait an hour before requesting again.'
});
