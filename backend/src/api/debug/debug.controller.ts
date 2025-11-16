import { Request, Response } from 'express';
import * as debugService from './debug.service';
import asyncHandler from '../../utils/asyncHandler';

export const seedDatabase = asyncHandler(async (req: any, res: any) => {
    await debugService.seedDatabase();
    res.status(200).json({ success: true, message: 'Database seeded successfully.' });
});