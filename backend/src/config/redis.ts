import Redis from 'ioredis';
import config from './index';
import logger from '../utils/logger';

export const redisClient = new Redis({
    host: config.redis.host,
    port: config.redis.port,
    password: config.redis.password,
    maxRetriesPerRequest: 3,
    lazyConnect: true
});

redisClient.on('connect', () => logger.info('Redis connected'));
redisClient.on('error', (error) => logger.error('Redis error:', error));

export const connectRedis = async () => {
    try {
        await redisClient.connect();
        await redisClient.ping();
        logger.info('Redis connection successful');
    } catch (error) {
        logger.error('Redis connection failed:', error);
        throw error;
    }
};

export class CacheService {
    async get<T>(key: string): Promise<T | null> {
        try {
            const value = await redisClient.get(key);
            return value ? JSON.parse(value) : null;
        } catch (error) {
            logger.error('Cache get error:', error);
            return null;
        }
    }
    
    async set(key: string, value: any, ttl: number = 3600): Promise<boolean> {
        try {
            await redisClient.setex(key, ttl, JSON.stringify(value));
            return true;
        } catch (error) {
            logger.error('Cache set error:', error);
            return false;
        }
    }
    
    async del(key: string): Promise<boolean> {
        try {
            await redisClient.del(key);
            return true;
        } catch (error) {
            logger.error('Cache delete error:', error);
            return false;
        }
    }
    
    async flushPattern(pattern: string): Promise<boolean> {
        try {
            const keys = await redisClient.keys(pattern);
            if (keys.length > 0) {
                await redisClient.del(...keys);
            }
            return true;
        } catch (error) {
            logger.error('Cache pattern flush error:', error);
            return false;
        }
    }
}

export const cache = new CacheService();
export default redisClient;