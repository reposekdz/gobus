import { Request, Response } from 'express';
import { pool } from '../../config/db';
import { catchAsync, AppError } from '../../middleware/error.middleware';
import * as mysql from 'mysql2/promise';
import {
    provinces,
    districts,
    cities as rwandaCities,
    busStations,
    popularRoutes as staticPopularRoutes,
    touristDestinations,
    getCityById,
    getDistrictById,
    getProvinceById,
    getBusStationById,
    getCitiesByDistrict,
    getDistrictsByProvince,
    getBusStationsByCity,
    getPopularCities,
    getRoutesBetweenCities,
    getTouristDestinationsByCity,
    searchCities,
    searchRoutes as searchRoutesData
} from '../../data/rwanda-routes.data';

export const getRoutes = catchAsync(async (req: Request, res: Response) => {
    const { from, to, page = 1, limit = 20 } = req.query;
    
    let query = `
        SELECT r.*, 
               c1.name as from_city, c2.name as to_city,
               COUNT(t.id) as available_trips
        FROM routes r
        LEFT JOIN cities c1 ON r.from_city_id = c1.id
        LEFT JOIN cities c2 ON r.to_city_id = c2.id
        LEFT JOIN trips t ON r.id = t.route_id AND t.departure_date >= CURDATE()
        WHERE r.is_active = 1
    `;
    
    const queryParams: any[] = [];
    
    if (from) {
        query += ` AND c1.name LIKE ?`;
        queryParams.push(`%${from}%`);
    }
    
    if (to) {
        query += ` AND c2.name LIKE ?`;
        queryParams.push(`%${to}%`);
    }
    
    query += ` GROUP BY r.id ORDER BY available_trips DESC, r.distance ASC`;
    
    const offset = (Number(page) - 1) * Number(limit);
    query += ` LIMIT ? OFFSET ?`;
    queryParams.push(Number(limit), offset);
    
    const [routes] = await pool.query<any[] & mysql.RowDataPacket[]>(query, queryParams);
    
    // Get total count for pagination
    let countQuery = `
        SELECT COUNT(DISTINCT r.id) as total
        FROM routes r
        LEFT JOIN cities c1 ON r.from_city_id = c1.id
        LEFT JOIN cities c2 ON r.to_city_id = c2.id
        WHERE r.is_active = 1
    `;
    
    const countParams: any[] = [];
    if (from) {
        countQuery += ` AND c1.name LIKE ?`;
        countParams.push(`%${from}%`);
    }
    if (to) {
        countQuery += ` AND c2.name LIKE ?`;
        countParams.push(`%${to}%`);
    }
    
    const [countResult] = await pool.query<any[] & mysql.RowDataPacket[]>(countQuery, countParams);
    const total = countResult[0].total;
    
    res.json({
        success: true,
        data: routes,
        pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / Number(limit))
        }
    });
});

export const createRoute = catchAsync(async (req: Request, res: Response) => {
    const { from_city_id, to_city_id, distance, duration, base_price, company_id } = req.body;
    
    // Check if route already exists
    const [existingRoute] = await pool.query<any[] & mysql.RowDataPacket[]>(
        'SELECT id FROM routes WHERE from_city_id = ? AND to_city_id = ? AND company_id = ?',
        [from_city_id, to_city_id, company_id]
    );
    
    if (existingRoute.length > 0) {
        return res.status(400).json({
            success: false,
            message: 'Route already exists for this company'
        });
    }
    
    const [result] = await pool.query<mysql.ResultSetHeader>(
        `INSERT INTO routes (from_city_id, to_city_id, distance, duration, base_price, company_id, is_active)
         VALUES (?, ?, ?, ?, ?, ?, 1)`,
        [from_city_id, to_city_id, distance, duration, base_price, company_id]
    );
    
    const [newRoute] = await pool.query<any[] & mysql.RowDataPacket[]>(
        `SELECT r.*, c1.name as from_city, c2.name as to_city, co.name as company_name
         FROM routes r
         LEFT JOIN cities c1 ON r.from_city_id = c1.id
         LEFT JOIN cities c2 ON r.to_city_id = c2.id
         LEFT JOIN companies co ON r.company_id = co.id
         WHERE r.id = ?`,
        [result.insertId]
    );
    
    res.status(201).json({
        success: true,
        data: newRoute[0],
        message: 'Route created successfully'
    });
});

export const updateRoute = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { distance, duration, base_price, is_active } = req.body;
    
    const [result] = await pool.query<mysql.ResultSetHeader>(
        `UPDATE routes SET distance = ?, duration = ?, base_price = ?, is_active = ?, updated_at = NOW()
         WHERE id = ?`,
        [distance, duration, base_price, is_active, id]
    );
    
    if (result.affectedRows === 0) {
        return res.status(404).json({
            success: false,
            message: 'Route not found'
        });
    }
    
    const [updatedRoute] = await pool.query<any[] & mysql.RowDataPacket[]>(
        `SELECT r.*, c1.name as from_city, c2.name as to_city, co.name as company_name
         FROM routes r
         LEFT JOIN cities c1 ON r.from_city_id = c1.id
         LEFT JOIN cities c2 ON r.to_city_id = c2.id
         LEFT JOIN companies co ON r.company_id = co.id
         WHERE r.id = ?`,
        [id]
    );
    
    res.json({
        success: true,
        data: updatedRoute[0],
        message: 'Route updated successfully'
    });
});

export const deleteRoute = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    
    // Check if route has active trips
    const [activeTrips] = await pool.query<any[] & mysql.RowDataPacket[]>(
        'SELECT COUNT(*) as count FROM trips WHERE route_id = ? AND departure_date >= CURDATE()',
        [id]
    );
    
    if (activeTrips[0].count > 0) {
        return res.status(400).json({
            success: false,
            message: 'Cannot delete route with active trips. Please cancel or complete all trips first.'
        });
    }
    
    const [result] = await pool.query<mysql.ResultSetHeader>(
        'UPDATE routes SET is_active = 0, updated_at = NOW() WHERE id = ?',
        [id]
    );
    
    if (result.affectedRows === 0) {
        return res.status(404).json({
            success: false,
            message: 'Route not found'
        });
    }
    
    res.json({
        success: true,
        message: 'Route deactivated successfully'
    });
});

export const getCities = catchAsync(async (req: Request, res: Response) => {
    const lang = (req.query.lang as string) || 'en';
    const { popular, districtId, search } = req.query;
    
    let cities = rwandaCities;
    
    // Filter by popular
    if (popular === 'true') {
        cities = getPopularCities();
    }
    
    // Filter by district
    if (districtId) {
        cities = getCitiesByDistrict(districtId as string);
    }
    
    // Search
    if (search && typeof search === 'string') {
        cities = searchCities(search);
    }
    
    const formattedCities = cities.map(city => ({
        id: city.id,
        name: lang === 'rw' ? city.nameRw : lang === 'fr' ? city.nameFr : city.name,
        districtId: city.districtId,
        latitude: city.latitude,
        longitude: city.longitude,
        isPopular: city.isPopular
    }));
    
    res.json({
        success: true,
        data: formattedCities,
        count: formattedCities.length
    });
});

export const searchAvailableRoutes = catchAsync(async (req: Request, res: Response) => {
    const { from, to, date } = req.query;
    
    if (!from || !to) {
        return res.status(400).json({
            success: false,
            message: 'From and To cities are required'
        });
    }
    
    let query = `
        SELECT DISTINCT r.*, 
               c1.name as from_city, c2.name as to_city,
               co.name as company_name, co.logo as company_logo,
               t.id as trip_id, t.departure_time, t.arrival_time, 
               t.available_seats, t.total_seats, t.price
        FROM routes r
        INNER JOIN cities c1 ON r.from_city_id = c1.id
        INNER JOIN cities c2 ON r.to_city_id = c2.id
        INNER JOIN companies co ON r.company_id = co.id
        INNER JOIN trips t ON r.id = t.route_id
        WHERE r.is_active = 1 
        AND t.departure_date >= CURDATE()
        AND t.available_seats > 0
        AND c1.name LIKE ?
        AND c2.name LIKE ?
    `;
    
    const queryParams = [`%${from}%`, `%${to}%`];
    
    if (date) {
        query += ` AND DATE(t.departure_date) = ?`;
        queryParams.push(date as string);
    }
    
    query += ` ORDER BY t.departure_time ASC`;
    
    const [routes] = await pool.query<any[] & mysql.RowDataPacket[]>(query, queryParams);
    
    res.json({
        success: true,
        data: routes,
        count: routes.length
    });
});

export const getPopularRoutes = catchAsync(async (req: Request, res: Response) => {
    const { fromCityId, toCityId, frequency } = req.query;
    
    let routes = staticPopularRoutes;
    
    // Filter by cities if provided
    if (fromCityId && toCityId) {
        routes = getRoutesBetweenCities(fromCityId as string, toCityId as string);
    } else if (fromCityId) {
        routes = routes.filter(r => r.fromCityId === fromCityId || r.toCityId === fromCityId);
    }
    
    // Filter by frequency if provided
    if (frequency) {
        routes = routes.filter(r => r.frequency === frequency);
    }
    
    // Sort by demand
    routes.sort((a, b) => {
        if (a.isHighDemand && !b.isHighDemand) return -1;
        if (!a.isHighDemand && b.isHighDemand) return 1;
        return 0;
    });
    
    // Enrich with city names
    const enrichedRoutes = routes.map(route => {
        const fromCity = getCityById(route.fromCityId);
        const toCity = getCityById(route.toCityId);
        return {
            ...route,
            fromCity: fromCity?.name,
            toCity: toCity?.name
        };
    });

    res.json({
        success: true,
        data: enrichedRoutes.slice(0, 10),
        count: enrichedRoutes.length
    });
});

/**
 * Get all provinces
 */
export const getProvinces = catchAsync(async (req: Request, res: Response) => {
    const lang = (req.query.lang as string) || 'en';
    
    const formattedProvinces = provinces.map(province => ({
        id: province.id,
        name: lang === 'rw' ? province.nameRw : lang === 'fr' ? province.nameFr : province.name,
        code: province.code
    }));

    res.json({
        success: true,
        data: formattedProvinces,
        count: formattedProvinces.length
    });
});

/**
 * Get districts by province
 */
export const getDistrictsByProvinceId = catchAsync(async (req: Request, res: Response) => {
    const { provinceId } = req.params;
    const lang = (req.query.lang as string) || 'en';
    
    const provinceDistricts = getDistrictsByProvince(provinceId);
    
    if (!provinceDistricts.length) {
        throw new AppError('Province not found', 404);
    }

    const formattedDistricts = provinceDistricts.map(district => ({
        id: district.id,
        name: lang === 'rw' ? district.nameRw : lang === 'fr' ? district.nameFr : district.name,
        code: district.code,
        provinceId: district.provinceId
    }));

    res.json({
        success: true,
        data: formattedDistricts,
        count: formattedDistricts.length
    });
});

/**
 * Get bus stations by city
 */
export const getBusStationsByCityId = catchAsync(async (req: Request, res: Response) => {
    const { cityId } = req.params;
    const lang = (req.query.lang as string) || 'en';
    
    const cityStations = getBusStationsByCity(cityId);
    
    const formattedStations = cityStations.map(station => ({
        id: station.id,
        name: lang === 'rw' ? station.nameRw : lang === 'fr' ? station.nameFr : station.name,
        cityId: station.cityId,
        address: station.address,
        latitude: station.latitude,
        longitude: station.longitude,
        facilities: station.facilities,
        operatingHours: station.operatingHours,
        phoneNumber: station.phoneNumber,
        isMainStation: station.isMainStation
    }));

    res.json({
        success: true,
        data: formattedStations,
        count: formattedStations.length
    });
});

/**
 * Get tourist destinations
 */
export const getTouristDestinations = catchAsync(async (req: Request, res: Response) => {
    const { cityId, category } = req.query;
    const lang = (req.query.lang as string) || 'en';
    
    let destinations = touristDestinations;
    
    // Filter by city if provided
    if (cityId) {
        destinations = getTouristDestinationsByCity(cityId as string);
    }
    
    // Filter by category if provided
    if (category) {
        destinations = destinations.filter(d => d.category === category);
    }
    
    const formattedDestinations = destinations.map(dest => ({
        id: dest.id,
        name: lang === 'rw' ? dest.nameRw : lang === 'fr' ? dest.nameFr : dest.name,
        description: dest.description,
        cityId: dest.cityId,
        category: dest.category,
        latitude: dest.latitude,
        longitude: dest.longitude,
        entryFee: dest.entryFee,
        openingHours: dest.openingHours
    }));

    res.json({
        success: true,
        data: formattedDestinations,
        count: formattedDestinations.length
    });
});