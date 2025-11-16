import { pool } from '../config/db';
import * as mysql from 'mysql2/promise';
import logger from '../utils/logger';
import { AppError } from '../middleware/error.middleware';

export class DatabaseService {
    private static instance: DatabaseService;
    
    private constructor() {}
    
    public static getInstance(): DatabaseService {
        if (!DatabaseService.instance) {
            DatabaseService.instance = new DatabaseService();
        }
        return DatabaseService.instance;
    }
    
    async execute<T extends mysql.RowDataPacket[] | mysql.RowDataPacket[][] | mysql.OkPacket | mysql.OkPacket[] | mysql.ResultSetHeader>(
        query: string,
        params: any[] = []
    ): Promise<[T, mysql.FieldPacket[]]> {
        const start = Date.now();
        let connection: mysql.PoolConnection | null = null;
        
        try {
            connection = await pool.getConnection();
            const result = await connection.execute<T>(query, params);
            
            const duration = Date.now() - start;
            logger.logDatabase(query, duration);
            
            return result;
        } catch (error: any) {
            const duration = Date.now() - start;
            logger.logDatabase(query, duration, error);
            
            this.handleDatabaseError(error);
            throw error;
        } finally {
            if (connection) {
                connection.release();
            }
        }
    }
    
    async transaction<T>(callback: (connection: mysql.PoolConnection) => Promise<T>): Promise<T> {
        const connection = await pool.getConnection();
        
        try {
            await connection.beginTransaction();
            const result = await callback(connection);
            await connection.commit();
            
            logger.info('Transaction completed successfully');
            return result;
        } catch (error: any) {
            await connection.rollback();
            logger.error('Transaction rolled back due to error:', error);
            
            this.handleDatabaseError(error);
            throw error;
        } finally {
            connection.release();
        }
    }
    
    async findOne<T extends mysql.RowDataPacket>(
        query: string,
        params: any[] = []
    ): Promise<T | null> {
        const [rows] = await this.execute<T[]>(query, params);
        return rows.length > 0 ? rows[0] : null;
    }
    
    async findMany<T extends mysql.RowDataPacket>(
        query: string,
        params: any[] = []
    ): Promise<T[]> {
        const [rows] = await this.execute<T[]>(query, params);
        return rows;
    }
    
    async insert(
        table: string,
        data: Record<string, any>
    ): Promise<mysql.ResultSetHeader> {
        const fields = Object.keys(data);
        const values = Object.values(data);
        const placeholders = fields.map(() => '?').join(', ');
        
        const query = `INSERT INTO ${table} (${fields.join(', ')}) VALUES (${placeholders})`;
        const [result] = await this.execute<mysql.ResultSetHeader>(query, values);
        
        return result;
    }
    
    async update(
        table: string,
        data: Record<string, any>,
        where: Record<string, any>
    ): Promise<mysql.ResultSetHeader> {
        const setClause = Object.keys(data).map(key => `${key} = ?`).join(', ');
        const whereClause = Object.keys(where).map(key => `${key} = ?`).join(' AND ');
        
        const query = `UPDATE ${table} SET ${setClause} WHERE ${whereClause}`;
        const params = [...Object.values(data), ...Object.values(where)];
        
        const [result] = await this.execute<mysql.ResultSetHeader>(query, params);
        return result;
    }
    
    async exists(
        table: string,
        where: Record<string, any>
    ): Promise<boolean> {
        const whereClause = Object.keys(where).map(key => `${key} = ?`).join(' AND ');
        const query = `SELECT 1 FROM ${table} WHERE ${whereClause} LIMIT 1`;
        
        const [rows] = await this.execute<mysql.RowDataPacket[]>(query, Object.values(where));
        return rows.length > 0;
    }
    
    async getStats(): Promise<{
        connections: {
            active: number;
            idle: number;
            total: number;
        };
        tables: Record<string, number>;
    }> {
        try {
            // Get connection stats
            const [connectionStats] = await this.execute<mysql.RowDataPacket[]>(
                'SHOW STATUS WHERE Variable_name IN ("Threads_connected", "Threads_running")'
            );
            
            // Get table row counts
            const [tables] = await this.execute<mysql.RowDataPacket[]>(
                'SELECT table_name, table_rows FROM information_schema.tables WHERE table_schema = DATABASE()'
            );
            
            const tableStats: Record<string, number> = {};
            tables.forEach(table => {
                tableStats[table.table_name] = table.table_rows;
            });
            
            return {
                connections: {
                    active: connectionStats.find(s => s.Variable_name === 'Threads_running')?.Value || 0,
                    idle: connectionStats.find(s => s.Variable_name === 'Threads_connected')?.Value || 0,
                    total: 20 // From config
                },
                tables: tableStats
            };
        } catch (error) {
            return {
                connections: { active: 0, idle: 0, total: 20 },
                tables: {}
            };
        }
    }
    
    private handleDatabaseError(error: any): void {
        const errorMappings: Record<string, { statusCode: number; message: string }> = {
            'ER_DUP_ENTRY': { statusCode: 409, message: 'Duplicate entry detected' },
            'ER_NO_REFERENCED_ROW_2': { statusCode: 400, message: 'Referenced record does not exist' },
            'ER_ROW_IS_REFERENCED_2': { statusCode: 400, message: 'Cannot delete record with existing references' },
            'ER_DATA_TOO_LONG': { statusCode: 400, message: 'Data too long for field' },
            'ER_BAD_NULL_ERROR': { statusCode: 400, message: 'Required field cannot be null' },
            'ECONNREFUSED': { statusCode: 503, message: 'Database connection refused' },
            'ETIMEDOUT': { statusCode: 503, message: 'Database connection timeout' }
        };
        
        const mapping = errorMappings[error.code];
        if (mapping) {
            error.statusCode = mapping.statusCode;
            error.message = mapping.message;
        }
    }
}

export const db = DatabaseService.getInstance();