import Bull from 'bull';
import { redisClient } from '../config/redis';
import config from '../config';
import logger from '../utils/logger';

// Create job queues
export const emailQueue = new Bull('email', {
    redis: {
        host: config.redis.host,
        port: config.redis.port,
        password: config.redis.password
    },
    defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 50
    }
});

export const smsQueue = new Bull('sms', {
    redis: {
        host: config.redis.host,
        port: config.redis.port,
        password: config.redis.password
    }
});

export const notificationQueue = new Bull('notification', {
    redis: {
        host: config.redis.host,
        port: config.redis.port,
        password: config.redis.password
    }
});

export const bookingQueue = new Bull('booking', {
    redis: {
        host: config.redis.host,
        port: config.redis.port,
        password: config.redis.password
    }
});

export const paymentQueue = new Bull('payment', {
    redis: {
        host: config.redis.host,
        port: config.redis.port,
        password: config.redis.password
    }
});

export const reportQueue = new Bull('report', {
    redis: {
        host: config.redis.host,
        port: config.redis.port,
        password: config.redis.password
    }
});

// Job processors
const processEmailJob = async (job: any) => {
    logger.info(`Processing email job: ${job.id}`);
    // Email processing logic here
    return { success: true };
};

const processSmsJob = async (job: any) => {
    logger.info(`Processing SMS job: ${job.id}`);
    // SMS processing logic here
    return { success: true };
};

const processNotificationJob = async (job: any) => {
    logger.info(`Processing notification job: ${job.id}`);
    // Push notification logic here
    return { success: true };
};

const processBookingJob = async (job: any) => {
    logger.info(`Processing booking job: ${job.id}`);
    // Booking processing logic here
    return { success: true };
};

const processPaymentJob = async (job: any) => {
    logger.info(`Processing payment job: ${job.id}`);
    // Payment processing logic here
    return { success: true };
};

const processReportJob = async (job: any) => {
    logger.info(`Processing report job: ${job.id}`);
    // Report generation logic here
    return { success: true };
};

// Job queues
export const queues = {
    email: emailQueue,
    sms: smsQueue,
    notification: notificationQueue,
    booking: bookingQueue,
    payment: paymentQueue,
    report: reportQueue
};

// Initialize all job processors
export const initJobs = async () => {
    try {
        emailQueue.process('send-email', 5, processEmailJob);
        smsQueue.process('send-sms', 10, processSmsJob);
        notificationQueue.process('send-push-notification', 10, processNotificationJob);
        bookingQueue.process('expire-booking', 5, processBookingJob);
        paymentQueue.process('process-payment', 3, processPaymentJob);
        reportQueue.process('generate-report', 1, processReportJob);
        
        Object.values(queues).forEach(queue => {
            queue.on('error', (error) => {
                logger.error(`Queue ${queue.name} error:`, error);
            });
            
            queue.on('completed', (job, result) => {
                logger.info(`Job ${job.id} completed in queue ${queue.name}`);
            });
            
            queue.on('failed', (job, error) => {
                logger.error(`Job ${job.id} failed in queue ${queue.name}:`, error);
            });
        });
        
        logger.info('All job queues initialized successfully');
        
    } catch (error) {
        logger.error('Failed to initialize job queues:', error);
        throw error;
    }
};

export class JobService {
    static async addEmailJob(type: string, data: any, options: any = {}) {
        return await emailQueue.add(type, data, {
            attempts: 3,
            backoff: { type: 'exponential', delay: 2000 },
            ...options
        });
    }
    
    static async addBookingJob(type: string, data: any, options: any = {}) {
        return await bookingQueue.add(type, data, {
            attempts: 2,
            backoff: { type: 'exponential', delay: 1000 },
            ...options
        });
    }
    
    static async addPaymentJob(type: string, data: any, options: any = {}) {
        return await paymentQueue.add(type, data, {
            attempts: 3,
            backoff: { type: 'exponential', delay: 5000 },
            ...options
        });
    }
}

export default JobService;