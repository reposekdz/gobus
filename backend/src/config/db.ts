import mysql from 'mysql2/promise';
import config from './index';
import logger from '../utils/logger';

// Connection pool with enhanced configuration
const pool = mysql.createPool({
    host: config.mysql.host,
    user: config.mysql.user,
    password: config.mysql.password,
    database: config.mysql.database,
    port: config.mysql.port,
    waitForConnections: true,
    connectionLimit: config.mysql.connectionLimit,
    queueLimit: 0,
    connectTimeout: 60000,
    charset: 'utf8mb4',
    timezone: '+00:00',
    supportBigNumbers: true,
    bigNumberStrings: true,
    dateStrings: false,
    multipleStatements: false,
    ssl: process.env.NODE_ENV === 'production' ? {
        rejectUnauthorized: false
    } : undefined
});

// Health check function
const checkDBHealth = async () => {
    try {
        const connection = await pool.getConnection();
        await connection.ping();
        connection.release();
        return true;
    } catch (error) {
        logger.error('Database health check failed:', error);
        return false;
    }
};

// Connection function with retry logic
const connectDB = async (retries = 5) => {
    for (let i = 0; i < retries; i++) {
        try {
            const connection = await pool.getConnection();
            await connection.execute('SELECT 1');
            connection.release();
            
            logger.info(`MySQL connected successfully on attempt ${i + 1}`);
            
            // Set up connection monitoring
            setInterval(async () => {
                const isHealthy = await checkDBHealth();
                if (!isHealthy) {
                    logger.warn('Database connection unhealthy');
                }
            }, 30000); // Check every 30 seconds
            
            return;
        } catch (error) {
            logger.error(`MySQL connection attempt ${i + 1} failed:`, (error as Error).message);
            
            if (i === retries - 1) {
                logger.error('All MySQL connection attempts failed');
                process.exit(1);
            }
            
            // Wait before retry (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
        }
    }
};

// Graceful shutdown
const closeDB = async () => {
    try {
        await pool.end();
        logger.info('MySQL connection pool closed');
    } catch (error) {
        logger.error('Error closing MySQL connection pool:', error);
    }
};

export { pool, connectDB, closeDB, checkDBHealth };
