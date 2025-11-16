import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

declare global {
    namespace Express {
        interface Request {
            requestId?: string;
            startTime?: number;
        }
    }
}

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
    req.requestId = uuidv4();
    req.startTime = Date.now();
    
    if (req.requestId) {
        res.setHeader('X-Request-ID', req.requestId);
    }
    
    const requestInfo = {
        requestId: req.requestId,
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString()
    };
    
    logger.info('Incoming request', requestInfo);
    
    const originalJson = res.json;
    res.json = function(body: any) {
        const responseTime = Date.now() - (req.startTime || Date.now());
        
        const responseInfo = {
            requestId: req.requestId,
            statusCode: res.statusCode,
            responseTime: `${responseTime}ms`,
            timestamp: new Date().toISOString()
        };
        
        if (res.statusCode >= 400) {
            logger.error('Request completed with error', responseInfo);
        } else {
            logger.info('Request completed successfully', responseInfo);
        }
        
        return originalJson.call(this, body);
    };
    
    next();
};