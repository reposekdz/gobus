import { pool } from '../config/db';
import Redis from 'ioredis';
import config from '../config';
import logger from '../utils/logger';
import { db } from './database.service';

interface HealthStatus {
    status: 'healthy' | 'unhealthy' | 'degraded';
    timestamp: string;
    uptime: number;
    version: string;
    environment: string;
    services: {
        database: ServiceHealth;
        redis: ServiceHealth;
        memory: MemoryHealth;
        disk: DiskHealth;
    };
    performance: {
        responseTime: number;
        averageResponseTime: number;
        requestsPerMinute: number;
    };
}

interface ServiceHealth {
    status: 'healthy' | 'unhealthy';
    responseTime: number;
    error?: string;
    details?: any;
}

interface MemoryHealth {
    status: 'healthy' | 'unhealthy' | 'warning';
    used: number;
    total: number;
    percentage: number;
    heap: {
        used: number;
        total: number;
        percentage: number;
    };
}

interface DiskHealth {
    status: 'healthy' | 'unhealthy' | 'warning';
    free: number;
    total: number;
    percentage: number;
}

export class HealthService {
    private static instance: HealthService;
    private redis: Redis;
    private performanceMetrics: {
        responseTimes: number[];
        requestCount: number;
        lastMinuteRequests: number[];
    };

    private constructor() {
        this.redis = new Redis({
            host: config.redis.host,
            port: config.redis.port,
            password: config.redis.password,
            maxRetriesPerRequest: 3,
            lazyConnect: true
        });

        this.performanceMetrics = {
            responseTimes: [],
            requestCount: 0,
            lastMinuteRequests: []
        };

        // Clean up old metrics every minute
        setInterval(() => {
            this.cleanupMetrics();
        }, 60000);
    }

    public static getInstance(): HealthService {
        if (!HealthService.instance) {
            HealthService.instance = new HealthService();
        }
        return HealthService.instance;
    }

    async getHealthStatus(): Promise<HealthStatus> {
        const startTime = Date.now();

        try {
            const [databaseHealth, redisHealth, memoryHealth, diskHealth] = await Promise.allSettled([
                this.checkDatabase(),
                this.checkRedis(),
                this.checkMemory(),
                this.checkDisk()
            ]);

            const responseTime = Date.now() - startTime;
            this.recordResponseTime(responseTime);

            const services = {
                database: databaseHealth.status === 'fulfilled' ? databaseHealth.value : { status: 'unhealthy' as const, responseTime: 0, error: 'Check failed' },
                redis: redisHealth.status === 'fulfilled' ? redisHealth.value : { status: 'unhealthy' as const, responseTime: 0, error: 'Check failed' },
                memory: memoryHealth.status === 'fulfilled' ? memoryHealth.value : { status: 'unhealthy' as const, used: 0, total: 0, percentage: 0, heap: { used: 0, total: 0, percentage: 0 } },
                disk: diskHealth.status === 'fulfilled' ? diskHealth.value : { status: 'unhealthy' as const, free: 0, total: 0, percentage: 0 }
            };

            const overallStatus = this.determineOverallStatus(services);

            return {
                status: overallStatus,
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                version: process.env.npm_package_version || '1.0.0',
                environment: config.nodeEnv,
                services,
                performance: {
                    responseTime,
                    averageResponseTime: this.getAverageResponseTime(),
                    requestsPerMinute: this.getRequestsPerMinute()
                }
            };
        } catch (error) {
            logger.error('Health check failed:', error);
            return {
                status: 'unhealthy',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                version: process.env.npm_package_version || '1.0.0',
                environment: config.nodeEnv,
                services: {
                    database: { status: 'unhealthy', responseTime: 0, error: 'Health check failed' },
                    redis: { status: 'unhealthy', responseTime: 0, error: 'Health check failed' },
                    memory: { status: 'unhealthy', used: 0, total: 0, percentage: 0, heap: { used: 0, total: 0, percentage: 0 } },
                    disk: { status: 'unhealthy', free: 0, total: 0, percentage: 0 }
                },
                performance: {
                    responseTime: Date.now() - startTime,
                    averageResponseTime: 0,
                    requestsPerMinute: 0
                }
            };
        }
    }

    private async checkDatabase(): Promise<ServiceHealth> {
        const startTime = Date.now();
        
        try {
            await db.execute('SELECT 1');
            const responseTime = Date.now() - startTime;
            
            // Get additional database stats
            const stats = await db.getStats();
            
            return {
                status: 'healthy',
                responseTime,
                details: {
                    connections: stats.connections,
                    tableCount: Object.keys(stats.tables).length
                }
            };
        } catch (error: any) {
            const responseTime = Date.now() - startTime;
            logger.error('Database health check failed:', error);
            
            return {
                status: 'unhealthy',
                responseTime,
                error: error.message
            };
        }
    }

    private async checkRedis(): Promise<ServiceHealth> {
        const startTime = Date.now();
        
        try {
            await this.redis.ping();
            const responseTime = Date.now() - startTime;
            
            // Get Redis info
            const info = await this.redis.info('memory');
            const memoryMatch = info.match(/used_memory:(\d+)/);
            const usedMemory = memoryMatch ? parseInt(memoryMatch[1]) : 0;
            
            return {
                status: 'healthy',
                responseTime,
                details: {
                    usedMemory: Math.round(usedMemory / 1024 / 1024) + 'MB'
                }
            };
        } catch (error: any) {
            const responseTime = Date.now() - startTime;
            logger.error('Redis health check failed:', error);
            
            return {
                status: 'unhealthy',
                responseTime,
                error: error.message
            };
        }
    }

    private async checkMemory(): Promise<MemoryHealth> {
        const memUsage = process.memoryUsage();
        const totalMemory = require('os').totalmem();
        const freeMemory = require('os').freemem();
        const usedMemory = totalMemory - freeMemory;
        
        const memoryPercentage = (usedMemory / totalMemory) * 100;
        const heapPercentage = (memUsage.heapUsed / memUsage.heapTotal) * 100;
        
        let status: 'healthy' | 'unhealthy' | 'warning' = 'healthy';
        if (memoryPercentage > 90 || heapPercentage > 90) {
            status = 'unhealthy';
        } else if (memoryPercentage > 80 || heapPercentage > 80) {
            status = 'warning';
        }
        
        return {
            status,
            used: Math.round(usedMemory / 1024 / 1024),
            total: Math.round(totalMemory / 1024 / 1024),
            percentage: Math.round(memoryPercentage),
            heap: {
                used: Math.round(memUsage.heapUsed / 1024 / 1024),
                total: Math.round(memUsage.heapTotal / 1024 / 1024),
                percentage: Math.round(heapPercentage)
            }
        };
    }

    private async checkDisk(): Promise<DiskHealth> {
        try {
            const fs = require('fs');
            const stats = fs.statSync(process.cwd());
            
            // This is a simplified disk check - in production, you'd want to use a proper disk usage library
            const fakeTotal = 100 * 1024; // 100GB in MB
            const fakeUsed = 50 * 1024; // 50GB in MB
            const fakeFree = fakeTotal - fakeUsed;
            const percentage = (fakeUsed / fakeTotal) * 100;
            
            let status: 'healthy' | 'unhealthy' | 'warning' = 'healthy';
            if (percentage > 95) {
                status = 'unhealthy';
            } else if (percentage > 85) {
                status = 'warning';
            }
            
            return {
                status,
                free: fakeFree,
                total: fakeTotal,
                percentage: Math.round(percentage)
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                free: 0,
                total: 0,
                percentage: 100
            };
        }
    }

    private determineOverallStatus(services: HealthStatus['services']): 'healthy' | 'unhealthy' | 'degraded' {
        const criticalServices = [services.database, services.redis];
        const allServices = Object.values(services);
        
        // If any critical service is unhealthy, overall status is unhealthy
        if (criticalServices.some(service => service.status === 'unhealthy')) {
            return 'unhealthy';
        }
        
        // If any service is unhealthy or warning, overall status is degraded
        if (allServices.some(service => service.status === 'unhealthy' || service.status === 'warning')) {
            return 'degraded';
        }
        
        return 'healthy';
    }

    private recordResponseTime(responseTime: number): void {
        this.performanceMetrics.responseTimes.push(responseTime);
        this.performanceMetrics.requestCount++;
        
        // Keep only last 100 response times
        if (this.performanceMetrics.responseTimes.length > 100) {
            this.performanceMetrics.responseTimes.shift();
        }
    }

    private getAverageResponseTime(): number {
        if (this.performanceMetrics.responseTimes.length === 0) return 0;
        
        const sum = this.performanceMetrics.responseTimes.reduce((a, b) => a + b, 0);
        return Math.round(sum / this.performanceMetrics.responseTimes.length);
    }

    private getRequestsPerMinute(): number {
        return this.performanceMetrics.lastMinuteRequests.length;
    }

    private cleanupMetrics(): void {
        const now = Date.now();
        const oneMinuteAgo = now - 60000;
        
        // Remove requests older than 1 minute
        this.performanceMetrics.lastMinuteRequests = this.performanceMetrics.lastMinuteRequests.filter(
            timestamp => timestamp > oneMinuteAgo
        );
    }

    public recordRequest(): void {
        this.performanceMetrics.lastMinuteRequests.push(Date.now());
    }

    async cleanup(): Promise<void> {
        try {
            await this.redis.quit();
        } catch (error) {
            logger.error('Error closing Redis connection:', error);
        }
    }
}

export const healthService = HealthService.getInstance();