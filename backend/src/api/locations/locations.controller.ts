import { Request, Response } from 'express';
import { rwandaDistrictsStations, getAllBusStations, getStationsByDistrict, searchStations } from '../../data/rwanda-districts-stations';

export const getAllLocations = async (req: Request, res: Response) => {
  try {
    const allStations = getAllBusStations();
    res.json({ stations: allStations });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch locations' });
  }
};

export const getStationsByDistrictName = async (req: Request, res: Response) => {
  try {
    const { district } = req.params;
    const stations = getStationsByDistrict(district);
    res.json({ stations });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch district stations' });
  }
};

export const searchLocations = async (req: Request, res: Response) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.json({ stations: [] });
    }
    const results = searchStations(q as string);
    res.json({ stations: results });
  } catch (error) {
    res.status(500).json({ error: 'Failed to search locations' });
  }
};

export const getDistrictsAndProvinces = async (req: Request, res: Response) => {
  try {
    res.json({ data: rwandaDistrictsStations });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch districts' });
  }
};