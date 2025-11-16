import { pool } from '../../config/db';
import { rwandaStations, BusStation, searchStations, getStationsByDistrict, getStationsByProvince, getAllDistricts, getAllProvinces } from '../../data/comprehensive-rwanda-stations';
import * as mysql from 'mysql2/promise';
import logger from '../../utils/logger';

/**
 * Sync stations to database
 */
export const syncStationsToDatabase = async (): Promise<void> => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        
        for (const station of rwandaStations) {
            // Check if station exists
            const [existing] = await connection.execute<mysql.RowDataPacket[]>(
                'SELECT id FROM bus_stations WHERE station_code = ?',
                [station.id]
            );
            
            if (existing.length === 0) {
                // Insert new station
                await connection.execute(
                    `INSERT INTO bus_stations 
                     (station_code, name, district, province, latitude, longitude, address, station_type, created_at, updated_at)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
                    [
                        station.id,
                        station.name,
                        station.district,
                        station.province,
                        station.latitude,
                        station.longitude,
                        station.address || null,
                        station.type
                    ]
                );
            } else {
                // Update existing station
                await connection.execute(
                    `UPDATE bus_stations 
                     SET name = ?, district = ?, province = ?, latitude = ?, longitude = ?, address = ?, station_type = ?, updated_at = NOW()
                     WHERE station_code = ?`,
                    [
                        station.name,
                        station.district,
                        station.province,
                        station.latitude,
                        station.longitude,
                        station.address || null,
                        station.type,
                        station.id
                    ]
                );
            }
        }
        
        await connection.commit();
        logger.info(`Synced ${rwandaStations.length} bus stations to database`);
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

/**
 * Get all stations
 */
export const getAllStations = async (filters?: {
    province?: string;
    district?: string;
    type?: string;
    search?: string;
}): Promise<any[]> => {
    let query = 'SELECT * FROM bus_stations WHERE 1=1';
    const params: any[] = [];
    
    if (filters?.province) {
        query += ' AND province = ?';
        params.push(filters.province);
    }
    
    if (filters?.district) {
        query += ' AND district = ?';
        params.push(filters.district);
    }
    
    if (filters?.type) {
        query += ' AND station_type = ?';
        params.push(filters.type);
    }
    
    if (filters?.search) {
        query += ' AND (name LIKE ? OR district LIKE ? OR province LIKE ?)';
        const searchTerm = `%${filters.search}%`;
        params.push(searchTerm, searchTerm, searchTerm);
    }
    
    query += ' ORDER BY province, district, name';
    
    const [stations] = await pool.execute<mysql.RowDataPacket[]>(query, params);
    return stations;
};

/**
 * Get station by code
 */
export const getStationByCode = async (code: string): Promise<any | null> => {
    const [stations] = await pool.execute<mysql.RowDataPacket[]>(
        'SELECT * FROM bus_stations WHERE station_code = ?',
        [code]
    );
    
    return stations.length > 0 ? stations[0] : null;
};

/**
 * Get stations grouped by province
 */
export const getStationsGroupedByProvince = async (): Promise<any> => {
    const provinces = getAllProvinces();
    const result: any = {};
    
    for (const province of provinces) {
        const stations = await getAllStations({ province });
        result[province] = {
            districts: [...new Set(stations.map((s: any) => s.district))],
            stations: stations
        };
    }
    
    return result;
};

/**
 * Get all provinces and districts
 */
export const getProvincesAndDistricts = async (): Promise<any> => {
    const provinces = getAllProvinces();
    const result: any = {};
    
    for (const province of provinces) {
        const [districts] = await pool.execute<mysql.RowDataPacket[]>(
            'SELECT DISTINCT district FROM bus_stations WHERE province = ? ORDER BY district',
            [province]
        );
        result[province] = districts.map((d: any) => d.district);
    }
    
    return result;
};

