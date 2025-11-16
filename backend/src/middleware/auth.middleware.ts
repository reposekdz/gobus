import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { pool } from '../config/db';
import * as mysql from 'mysql2/promise';
import logger from '../utils/logger';

export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ success: false, message: 'Access token required' });
    }

    const secretKey = process.env.JWT_SECRET || 'gobus_secret_key_2024';
    const decoded = jwt.verify(token, secretKey) as any;
    
    const [users] = await pool.execute<mysql.RowDataPacket[]>(
      'SELECT id, name, email, role, company_id, is_active FROM users WHERE id = ?',
      [decoded.userId]
    );
    
    if (!Array.isArray(users) || users.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }

    const user = users[0];
    
    // Check if user is active
    if (!user.is_active) {
      return res.status(403).json({ success: false, message: 'Account is inactive' });
    }

    (req as any).user = user;
    next();
  } catch (error: any) {
    logger.error('Authentication error:', error);
    return res.status(403).json({ success: false, message: 'Invalid or expired token' });
  }
};

export const authorizeRoles = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!(req as any).user || !roles.includes((req as any).user.role)) {
      return res.status(403).json({ success: false, message: 'Insufficient permissions' });
    }
    next();
  };
};

export const requireRole = (roles: string[]) => authorizeRoles(roles);
export const protect = authenticateToken;
export const authorize = authorizeRoles;