import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import { AppError } from './error.middleware';
import logger from '../utils/logger';
import config from '../config';

// General rate limiting
export const generalLimiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.maxRequests,
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logger.logSecurity('Rate limit exceeded', {
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            url: req.url
        });
        res.status(429).json({
            success: false,
            message: 'Too many requests from this IP, please try again later.'
        });
    }
});

// Strict rate limiting for authentication endpoints
export const authLimiter = rateLimit({
    windowMs: config.rateLimit.authWindowMs,
    max: config.rateLimit.authMaxRequests,
    message: {
        success: false,
        message: 'Too many authentication attempts, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logger.logSecurity('Auth rate limit exceeded', {
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            email: req.body?.email
        });
        res.status(429).json({
            success: false,
            message: 'Too many authentication attempts, please try again later.'
        });
    }
});

// Payment endpoint rate limiting
export const paymentLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 payment attempts per window
    message: {
        success: false,
        message: 'Too many payment attempts, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Speed limiting - slow down requests
export const speedLimiter = slowDown({
    windowMs: 15 * 60 * 1000, // 15 minutes
    delayAfter: 50, // Allow 50 requests per windowMs without delay
    delayMs: 500, // Add 500ms delay per request after delayAfter
    maxDelayMs: 20000, // Maximum delay of 20 seconds
});

// IP whitelist middleware
export const ipWhitelist = (whitelist: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const clientIP = req.ip || req.connection.remoteAddress;
        
        if (whitelist.includes(clientIP!)) {
            return next();
        }
        
        logger.logSecurity('IP not whitelisted', {
            ip: clientIP,
            url: req.url
        });
        
        return next(new AppError('Access denied from this IP address', 403));
    };
};

// Request size limiting
export const requestSizeLimit = (maxSize: string = '10mb') => {
    return (req: Request, res: Response, next: NextFunction) => {
        const contentLength = parseInt(req.get('content-length') || '0');
        const maxBytes = parseSize(maxSize);
        
        if (contentLength > maxBytes) {
            logger.logSecurity('Request size exceeded', {
                ip: req.ip,
                contentLength,
                maxSize,
                url: req.url
            });
            
            return next(new AppError('Request entity too large', 413));
        }
        
        next();
    };
};

// Helper function to parse size strings
function parseSize(size: string): number {
    const units: { [key: string]: number } = {
        'b': 1,
        'kb': 1024,
        'mb': 1024 * 1024,
        'gb': 1024 * 1024 * 1024
    };
    
    const match = size.toLowerCase().match(/^(\d+(?:\.\d+)?)\s*([a-z]+)?$/);
    if (!match) return 0;
    
    const value = parseFloat(match[1]);
    const unit = match[2] || 'b';
    
    return value * (units[unit] || 1);
}

// SQL injection detection
export const sqlInjectionProtection = (req: Request, res: Response, next: NextFunction) => {
    const sqlPatterns = [
        /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
        /((\%27)|(\')|(--)|(\%23)|(#))/gi,
        /((\%3D)|(=))[^\n]*((\%27)|(\')|(--)|(\%3B)|(;))/gi,
        /\w*((\%27)|(\'))((\%6F)|o|(\%4F))((\%72)|r|(\%52))/gi
    ];
    
    const checkForSQLInjection = (obj: any, path: string = ''): boolean => {
        if (typeof obj === 'string') {
            return sqlPatterns.some(pattern => pattern.test(obj));
        }
        
        if (typeof obj === 'object' && obj !== null) {
            for (const [key, value] of Object.entries(obj)) {
                if (checkForSQLInjection(value, `${path}.${key}`)) {
                    return true;
                }
            }
        }
        
        return false;
    };
    
    if (checkForSQLInjection(req.body) || checkForSQLInjection(req.query) || checkForSQLInjection(req.params)) {
        logger.logSecurity('SQL injection attempt detected', {
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            url: req.url,
            body: req.body,
            query: req.query,
            params: req.params
        });
        
        return next(new AppError('Invalid request detected', 400));
    }
    
    next();
};

// XSS protection
export const xssProtection = (req: Request, res: Response, next: NextFunction) => {
    const xssPatterns = [
        /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
        /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
        /javascript:/gi,
        /on\w+\s*=/gi,
        /<img[^>]+src[\\s]*=[\\s]*["\']javascript:/gi
    ];
    
    const sanitizeValue = (value: any): any => {
        if (typeof value === 'string') {
            return xssPatterns.reduce((acc, pattern) => {
                return acc.replace(pattern, '');
            }, value);
        }
        
        if (typeof value === 'object' && value !== null) {
            const sanitized: any = Array.isArray(value) ? [] : {};
            for (const [key, val] of Object.entries(value)) {
                sanitized[key] = sanitizeValue(val);
            }
            return sanitized;
        }
        
        return value;
    };
    
    req.body = sanitizeValue(req.body);
    req.query = sanitizeValue(req.query);
    
    next();
};

// CSRF protection for state-changing operations
export const csrfProtection = (req: Request, res: Response, next: NextFunction) => {
    const stateMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
    
    if (!stateMethods.includes(req.method)) {
        return next();
    }
    
    const token = req.headers['x-csrf-token'] || req.body._csrf;
    const sessionToken = req.session?.csrfToken;
    
    if (!token || !sessionToken || token !== sessionToken) {
        logger.logSecurity('CSRF token mismatch', {
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            url: req.url,
            method: req.method
        });
        
        return next(new AppError('Invalid CSRF token', 403));
    }
    
    next();
};

// Request logging middleware
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    
    res.on('finish', () => {
        const duration = Date.now() - start;
        logger.logRequest(req, res, duration);
    });
    
    next();
};

// Security headers middleware
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
    // Remove server information
    res.removeHeader('X-Powered-By');
    
    // Set security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    
    if (req.secure) {
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    }
    
    next();
};

// Suspicious activity detection
export const suspiciousActivityDetection = (req: Request, res: Response, next: NextFunction) => {
    const suspiciousPatterns = [
        /\.\.\//g, // Directory traversal
        /\/etc\/passwd/g, // System file access
        /\/proc\//g, // Process information
        /cmd\.exe/g, // Windows command execution
        /powershell/g, // PowerShell execution
        /base64/g, // Base64 encoding (potential payload)
    ];
    
    const checkSuspicious = (value: string): boolean => {
        return suspiciousPatterns.some(pattern => pattern.test(value));
    };
    
    const fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
    const userAgent = req.get('User-Agent') || '';
    const referer = req.get('Referer') || '';
    
    if (checkSuspicious(fullUrl) || checkSuspicious(userAgent) || checkSuspicious(referer)) {
        logger.logSecurity('Suspicious activity detected', {
            ip: req.ip,
            userAgent,
            referer,
            url: req.url,
            method: req.method
        });
        
        return next(new AppError('Suspicious activity detected', 400));
    }
    
    next();
};