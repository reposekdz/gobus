import { Request, Response } from 'express';
import { db } from '../../config/database';

export class ProfileController {
  // Get user profile with comprehensive details
  static async getProfile(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Ntabwo warinjiye (Not authenticated)'
        });
      }

      const user = await db.query(
        'SELECT id, name, email, phone, avatar_url, created_at, wallet_balance, loyalty_points FROM users WHERE id = ?',
        [userId]
      );

      if (!user || user.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Ntibashobora kubona umukoresha (User not found)'
        });
      }

      // Get user statistics
      const stats = await ProfileController.getUserStats(userId);

      res.json({
        success: true,
        data: {
          ...user[0],
          stats
        }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Update user profile
  static async updateProfile(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { name, phone, avatar_url, preferences } = req.body;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Ntabwo warinjiye (Not authenticated)'
        });
      }

      await db.query(
        'UPDATE users SET name = ?, phone = ?, avatar_url = ?, preferences = ?, updated_at = NOW() WHERE id = ?',
        [name, phone, avatar_url, JSON.stringify(preferences), userId]
      );

      res.json({
        success: true,
        message: 'Umwirondoro wawe wahindutse neza (Profile updated successfully)'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get user trip history
  static async getTripHistory(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { page = 1, limit = 10, status } = req.query;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Ntabwo warinjiye (Not authenticated)'
        });
      }

      const offset = (Number(page) - 1) * Number(limit);
      
      let query = `
        SELECT b.*, t.from_location, t.to_location, t.departure_time, t.arrival_time, t.bus_company
        FROM bookings b
        JOIN trips t ON b.trip_id = t.id
        WHERE b.user_id = ?
      `;
      
      const params: any[] = [userId];

      if (status) {
        query += ' AND b.status = ?';
        params.push(status);
      }

      query += ' ORDER BY b.created_at DESC LIMIT ? OFFSET ?';
      params.push(Number(limit), offset);

      const trips = await db.query(query, params);

      // Get total count
      const countQuery = status 
        ? 'SELECT COUNT(*) as total FROM bookings WHERE user_id = ? AND status = ?'
        : 'SELECT COUNT(*) as total FROM bookings WHERE user_id = ?';
      const countParams = status ? [userId, status] : [userId];
      const [{ total }] = await db.query(countQuery, countParams);

      res.json({
        success: true,
        data: trips,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get user loyalty information
  static async getLoyaltyInfo(req: Request, res: Response) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Ntabwo warinjiye (Not authenticated)'
        });
      }

      const [user] = await db.query(
        'SELECT loyalty_points, loyalty_tier FROM users WHERE id = ?',
        [userId]
      );

      // Get loyalty history
      const history = await db.query(
        'SELECT * FROM loyalty_transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 20',
        [userId]
      );

      // Get available rewards
      const rewards = await ProfileController.getAvailableRewards(user.loyalty_points);

      res.json({
        success: true,
        data: {
          points: user.loyalty_points || 0,
          tier: user.loyalty_tier || 'bronze',
          history,
          rewards
        }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Private helper methods
  private static async getUserStats(userId: string) {
    const stats = {
      totalTrips: 0,
      upcomingTrips: 0,
      completedTrips: 0,
      cancelledTrips: 0,
      totalSpent: 0,
      favoriteRoute: null as string | null,
      memberSince: null as Date | null
    };

    try {
      // Get total trips count
      const [totals] = await db.query(
        'SELECT COUNT(*) as count FROM bookings WHERE user_id = ?',
        [userId]
      );
      stats.totalTrips = totals.count || 0;

      // Get upcoming trips
      const [upcoming] = await db.query(
        'SELECT COUNT(*) as count FROM bookings WHERE user_id = ? AND status = ? AND trip_date >= CURDATE()',
        [userId, 'confirmed']
      );
      stats.upcomingTrips = upcoming.count || 0;

      // Get completed trips
      const [completed] = await db.query(
        'SELECT COUNT(*) as count FROM bookings WHERE user_id = ? AND status = ?',
        [userId, 'completed']
      );
      stats.completedTrips = completed.count || 0;

      // Get cancelled trips
      const [cancelled] = await db.query(
        'SELECT COUNT(*) as count FROM bookings WHERE user_id = ? AND status = ?',
        [userId, 'cancelled']
      );
      stats.cancelledTrips = cancelled.count || 0;

      // Get total spent
      const [spent] = await db.query(
        'SELECT SUM(total_amount) as total FROM bookings WHERE user_id = ? AND status IN (?, ?)',
        [userId, 'completed', 'confirmed']
      );
      stats.totalSpent = spent.total || 0;

      // Get favorite route
      const favoriteRoute = await db.query(
        `SELECT CONCAT(t.from_location, ' - ', t.to_location) as route, COUNT(*) as count
         FROM bookings b
         JOIN trips t ON b.trip_id = t.id
         WHERE b.user_id = ?
         GROUP BY route
         ORDER BY count DESC
         LIMIT 1`,
        [userId]
      );
      if (favoriteRoute && favoriteRoute.length > 0) {
        stats.favoriteRoute = favoriteRoute[0].route;
      }

      // Get member since
      const [user] = await db.query(
        'SELECT created_at FROM users WHERE id = ?',
        [userId]
      );
      stats.memberSince = user.created_at;

    } catch (error) {
      console.error('Error getting user stats:', error);
    }

    return stats;
  }

  private static async getAvailableRewards(points: number) {
    const rewards = [
      { id: 1, name: 'Igihembo cya 10% (10% Discount)', points: 500, type: 'discount', value: 10 },
      { id: 2, name: 'Igihembo cya 20% (20% Discount)', points: 1000, type: 'discount', value: 20 },
      { id: 3, name: 'Urugendo rw\'ubuntu (Free Trip)', points: 2000, type: 'free_trip', value: 100 },
      { id: 4, name: 'VIP Lounge Access', points: 750, type: 'vip_access', value: 1 },
      { id: 5, name: 'Amafaranga 5,000 RWF (5,000 RWF Credit)', points: 1500, type: 'wallet_credit', value: 5000 }
    ];

    return rewards.filter(reward => points >= reward.points);
  }
}
