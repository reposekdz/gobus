import { Request, Response } from 'express';
import asyncHandler from '../../utils/asyncHandler';
import * as stationsService from './stations.service';
import logger from '../../utils/logger';

/**
 * Get all stations with optional filters
 * GET /api/v1/stations
 */
export const getAllStations = asyncHandler(async (req: Request, res: Response) => {
    const { province, district, type, search } = req.query;
    
    const stations = await stationsService.getAllStations({
        province: province as string,
        district: district as string,
        type: type as string,
        search: search as string
    });
    
    res.json({
        success: true,
        count: stations.length,
        data: stations
    });
});

/**
 * Get station by code
 * GET /api/v1/stations/:code
 */
export const getStationByCode = asyncHandler(async (req: Request, res: Response) => {
    const { code } = req.params;
    
    const station = await stationsService.getStationByCode(code);
    
    if (!station) {
        return res.status(404).json({
            success: false,
            message: 'Station not found'
        });
    }
    
    res.json({
        success: true,
        data: station
    });
});

/**
 * Get stations grouped by province
 * GET /api/v1/stations/grouped/province
 */
export const getStationsGroupedByProvince = asyncHandler(async (req: Request, res: Response) => {
    const grouped = await stationsService.getStationsGroupedByProvince();
    
    res.json({
        success: true,
        data: grouped
    });
});

/**
 * Get provinces and districts
 * GET /api/v1/stations/provinces-districts
 */
export const getProvincesAndDistricts = asyncHandler(async (req: Request, res: Response) => {
    const data = await stationsService.getProvincesAndDistricts();
    
    res.json({
        success: true,
        data
    });
});

/**
 * Sync stations to database (Admin only)
 * POST /api/v1/stations/sync
 */
export const syncStations = asyncHandler(async (req: Request, res: Response) => {
    await stationsService.syncStationsToDatabase();
    
    res.json({
        success: true,
        message: 'Stations synced successfully'
    });
});

