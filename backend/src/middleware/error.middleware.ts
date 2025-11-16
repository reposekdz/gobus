import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

interface CustomError extends Error {
    statusCode?: number;
    code?: string;
    errno?: number;
    sqlState?: string;
    sqlMessage?: string;
    errors?: any;
}

export const errorHandler = (error: CustomError, req: Request, res: Response, next: NextFunction) => {
    let statusCode = error.statusCode || 500;
    let message = error.message || 'Internal Server Error';
    let errors: any = null;

    // Log error details
    logger.error('Error occurred:', {
        message: error.message,
        stack: error.stack,
        url: req.url,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        userId: (req as any).user?.id
    });

    // MySQL/Database errors
    if (error.code === 'ER_DUP_ENTRY') {
        statusCode = 409;
        message = 'Duplicate entry. Resource already exists.';
    } else if (error.code === 'ER_NO_REFERENCED_ROW_2') {
        statusCode = 400;
        message = 'Referenced resource does not exist.';
    } else if (error.code === 'ER_ROW_IS_REFERENCED_2') {
        statusCode = 400;
        message = 'Cannot delete resource as it is referenced by other records.';
    } else if (error.code === 'ER_DATA_TOO_LONG') {
        statusCode = 400;
        message = 'Data too long for field.';
    } else if (error.code === 'ER_BAD_NULL_ERROR') {
        statusCode = 400;
        message = 'Required field cannot be null.';
    } else if (error.code === 'ECONNREFUSED') {
        statusCode = 503;
        message = 'Database connection failed.';
    }

    // Validation errors
    if (error.name === 'ValidationError') {
        statusCode = 400;
        message = 'Validation Error';
        errors = error.errors;
    }

    // JWT errors
    if (error.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Invalid authentication token.';
    } else if (error.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Authentication token has expired.';
    }

    // Multer errors (file upload)
    if (error.code === 'LIMIT_FILE_SIZE') {
        statusCode = 400;
        message = 'File size too large.';
    } else if (error.code === 'LIMIT_FILE_COUNT') {
        statusCode = 400;
        message = 'Too many files uploaded.';
    } else if (error.code === 'LIMIT_UNEXPECTED_FILE') {
        statusCode = 400;
        message = 'Unexpected file field.';
    }

    // Rate limiting errors
    if (error.message?.includes('Too many requests')) {
        statusCode = 429;
        message = 'Too many requests. Please try again later.';
    }

    // Payment errors
    if (error.message?.includes('payment') || error.message?.includes('stripe')) {
        statusCode = 402;
        message = 'Payment processing failed.';
    }

    // Don't expose internal errors in production
    if (process.env.NODE_ENV === 'production' && statusCode === 500) {
        message = 'Something went wrong. Please try again later.';
    }

    const errorResponse: any = {
        success: false,
        message,
        timestamp: new Date().toISOString(),
        path: req.url,
        method: req.method
    };

    if (errors) {
        errorResponse.errors = errors;
    }

    // Include error code in development
    if (process.env.NODE_ENV === 'development') {
        errorResponse.stack = error.stack;
        errorResponse.errorCode = error.code;
    }

    res.status(statusCode).json(errorResponse);
};

// 404 handler
export const notFoundHandler = (req: Request, res: Response) => {
    res.status(404).json({
        success: false,
        message: 'Resource not found',
        path: req.url,
        method: req.method,
        timestamp: new Date().toISOString()
    });
};

// Custom error class
export class AppError extends Error {
    public statusCode: number;
    public isOperational: boolean;

    constructor(message: string, statusCode: number = 500) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}

// Async error wrapper
export const catchAsync = (fn: Function) => {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};