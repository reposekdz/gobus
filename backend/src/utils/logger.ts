import winston from 'winston';
import path from 'path';
import fs from 'fs';
import config from '../config';

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Custom format for better readability
const customFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
        let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
        
        if (Object.keys(meta).length > 0) {
            log += ` ${JSON.stringify(meta)}`;
        }
        
        if (stack) {
            log += `\n${stack}`;
        }
        
        return log;
    })
);

// Console format for development
const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: 'HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
        let log = `${timestamp} ${level}: ${message}`;
        
        if (Object.keys(meta).length > 0) {
            log += ` ${JSON.stringify(meta, null, 2)}`;
        }
        
        return log;
    })
);

const logger = winston.createLogger({
    level: config.logging.level,
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    defaultMeta: { 
        service: 'gobus-backend',
        environment: config.nodeEnv,
        version: process.env.npm_package_version || '1.0.0'
    },
    transports: [
        // Error logs
        new winston.transports.File({
            filename: path.join(logsDir, 'error.log'),
            level: 'error',
            format: customFormat,
            maxsize: 5242880, // 5MB
            maxFiles: 5
        }),
        
        // Combined logs
        new winston.transports.File({
            filename: path.join(logsDir, 'combined.log'),
            format: customFormat,
            maxsize: 5242880, // 5MB
            maxFiles: 10
        }),
        
        // Access logs
        new winston.transports.File({
            filename: path.join(logsDir, 'access.log'),
            level: 'http',
            format: customFormat,
            maxsize: 5242880, // 5MB
            maxFiles: 7
        })
    ],
    
    // Handle uncaught exceptions and rejections
    exceptionHandlers: [
        new winston.transports.File({
            filename: path.join(logsDir, 'exceptions.log'),
            format: customFormat
        })
    ],
    
    rejectionHandlers: [
        new winston.transports.File({
            filename: path.join(logsDir, 'rejections.log'),
            format: customFormat
        })
    ]
});

// Add console transport for development
if (config.nodeEnv !== 'production') {
    logger.add(new winston.transports.Console({
        format: consoleFormat,
        level: 'debug'
    }));
}

// Add performance logging
logger.profile = (id: string, meta?: any) => {
    return logger.profile(id, meta);
};

// Extend logger with custom methods
interface ExtendedLogger extends winston.Logger {
    logRequest: (req: any, res: any, responseTime: number) => void;
    logError: (error: Error, context?: any) => void;
    logSecurity: (event: string, details: any) => void;
    logPerformance: (operation: string, duration: number, details?: any) => void;
    logDatabase: (query: string, duration: number, error?: Error) => void;
}

// Add structured logging methods
(logger as ExtendedLogger).logRequest = (req: any, res: any, responseTime: number) => {
    logger.http('HTTP Request', {
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        responseTime: `${responseTime}ms`,
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        userId: req.user?.id
    });
};

(logger as ExtendedLogger).logError = (error: Error, context?: any) => {
    logger.error('Application Error', {
        message: error.message,
        stack: error.stack,
        ...context
    });
};

(logger as ExtendedLogger).logSecurity = (event: string, details: any) => {
    logger.warn('Security Event', {
        event,
        ...details,
        timestamp: new Date().toISOString()
    });
};

(logger as ExtendedLogger).logPerformance = (operation: string, duration: number, details?: any) => {
    logger.info('Performance Metric', {
        operation,
        duration: `${duration}ms`,
        ...details
    });
};

(logger as ExtendedLogger).logDatabase = (query: string, duration: number, error?: Error) => {
    if (error) {
        logger.error('Database Error', {
            query: query.substring(0, 200) + (query.length > 200 ? '...' : ''),
            duration: `${duration}ms`,
            error: error.message
        });
    } else {
        logger.debug('Database Query', {
            query: query.substring(0, 200) + (query.length > 200 ? '...' : ''),
            duration: `${duration}ms`
        });
    }
};

export default logger as ExtendedLogger;