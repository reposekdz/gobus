import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { AppError } from './error.middleware';

export const validate = (schema: Joi.ObjectSchema) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const { error, value } = schema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true
        });

        if (error) {
            const errors = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message,
                value: detail.context?.value
            }));

            return next(new AppError('Validation failed', 400));
        }

        req.body = value;
        next();
    };
};

export const validateQuery = (schema: Joi.ObjectSchema) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const { error, value } = schema.validate(req.query, {
            abortEarly: false,
            stripUnknown: true
        });

        if (error) {
            const errors = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message,
                value: detail.context?.value
            }));

            return next(new AppError('Query validation failed', 400));
        }

        req.query = value;
        next();
    };
};

export const validateParams = (schema: Joi.ObjectSchema) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const { error, value } = schema.validate(req.params, {
            abortEarly: false,
            stripUnknown: true
        });

        if (error) {
            const errors = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message,
                value: detail.context?.value
            }));

            return next(new AppError('Parameter validation failed', 400));
        }

        req.params = value;
        next();
    };
};

// Common validation schemas
export const schemas = {
    // User schemas
    register: Joi.object({
        name: Joi.string().min(2).max(100).required(),
        email: Joi.string().email().required(),
        password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/).required()
            .messages({
                'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
            }),
        phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).required(),
        role: Joi.string().valid('passenger', 'driver', 'company', 'agent', 'admin').default('passenger')
    }),

    login: Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().required()
    }),

    updateProfile: Joi.object({
        name: Joi.string().min(2).max(100),
        phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/),
        avatar_url: Joi.string().uri()
    }),

    changePassword: Joi.object({
        currentPassword: Joi.string().required(),
        newPassword: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/).required()
    }),

    // Booking schemas
    createBooking: Joi.object({
        tripId: Joi.number().integer().positive().required(),
        seatNumbers: Joi.array().items(Joi.string()).min(1).max(6).required(),
        passengerDetails: Joi.array().items(
            Joi.object({
                name: Joi.string().min(2).max(100).required(),
                phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/),
                idNumber: Joi.string().min(5).max(20)
            })
        ).required(),
        paymentMethod: Joi.string().valid('wallet', 'card', 'mobile_money').required()
    }),

    // Trip schemas
    searchTrips: Joi.object({
        origin: Joi.string().min(2).max(100).required(),
        destination: Joi.string().min(2).max(100).required(),
        date: Joi.date().min('now').required(),
        passengers: Joi.number().integer().min(1).max(6).default(1)
    }),

    // Company schemas
    createCompany: Joi.object({
        name: Joi.string().min(2).max(100).required(),
        description: Joi.string().max(500),
        logo_url: Joi.string().uri(),
        cover_url: Joi.string().uri(),
        contact_email: Joi.string().email(),
        contact_phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/)
    }),

    // Bus schemas
    createBus: Joi.object({
        plateNumber: Joi.string().min(5).max(20).required(),
        model: Joi.string().min(2).max(100).required(),
        capacity: Joi.number().integer().min(10).max(100).required(),
        amenities: Joi.array().items(Joi.string().valid('AC', 'WiFi', 'TV', 'Charging', 'Toilet', 'Reclining_Seats')),
        image_url: Joi.string().uri()
    }),

    // Route schemas
    createRoute: Joi.object({
        origin: Joi.string().min(2).max(100).required(),
        destination: Joi.string().min(2).max(100).required(),
        basePrice: Joi.number().positive().required(),
        estimatedDurationMinutes: Joi.number().integer().positive().required(),
        distance: Joi.number().positive()
    }),

    // Payment schemas
    processPayment: Joi.object({
        bookingId: Joi.string().required(),
        amount: Joi.number().positive().required(),
        paymentMethod: Joi.string().valid('wallet', 'card', 'mobile_money').required(),
        paymentDetails: Joi.object().when('paymentMethod', {
            is: 'card',
            then: Joi.object({
                cardToken: Joi.string().required()
            }),
            otherwise: Joi.object()
        })
    }),

    // Wallet schemas
    topUpWallet: Joi.object({
        amount: Joi.number().positive().min(1000).max(1000000).required(),
        paymentMethod: Joi.string().valid('card', 'mobile_money').required()
    }),

    transferMoney: Joi.object({
        recipientId: Joi.number().integer().positive().required(),
        amount: Joi.number().positive().min(100).required(),
        pin: Joi.string().length(4).pattern(/^\d+$/).required(),
        description: Joi.string().max(200)
    }),

    // Common parameter schemas
    idParam: Joi.object({
        id: Joi.number().integer().positive().required()
    }),

    // Pagination schema
    pagination: Joi.object({
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(100).default(10),
        sortBy: Joi.string().default('created_at'),
        sortOrder: Joi.string().valid('asc', 'desc').default('desc')
    })
};