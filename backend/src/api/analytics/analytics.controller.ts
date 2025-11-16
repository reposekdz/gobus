import { Request, Response } from 'express';
import { db } from '../../config/database';

export class AnalyticsController {
  // Get popular routes
  static async getPopularRoutes(req: Request, res: Response) {
    try {
      const { limit = 10, period = '30days' } = req.query;

      let dateFilter = '';
      if (period === '7days') {
        dateFilter = 'AND b.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)';
      } else if (period === '30days') {
        dateFilter = 'AND b.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)';
      } else if (period === '90days') {
        dateFilter = 'AND b.created_at >= DATE_SUB(NOW(), INTERVAL 90 DAY)';
      }

      const routes = await db.query(
        `SELECT 
          CONCAT(t.from_location, ' → ', t.to_location) as route,
          t.from_location,
          t.to_location,
          COUNT(b.id) as booking_count,
          AVG(t.avg_rating) as avg_rating,
          MIN(b.total_amount) as min_price,
          MAX(b.total_amount) as max_price,
          AVG(b.total_amount) as avg_price
         FROM bookings b
         JOIN trips t ON b.trip_id = t.id
         WHERE b.status IN ('confirmed', 'completed')
         ${dateFilter}
         GROUP BY route, t.from_location, t.to_location
         ORDER BY booking_count DESC
         LIMIT ?`,
        [Number(limit)]
      );

      res.json({
        success: true,
        data: routes
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get booking trends
  static async getBookingTrends(req: Request, res: Response) {
    try {
      const { period = '30days' } = req.query;

      let groupBy = 'DATE(created_at)';
      let dateFilter = 'DATE_SUB(NOW(), INTERVAL 30 DAY)';

      if (period === '7days') {
        dateFilter = 'DATE_SUB(NOW(), INTERVAL 7 DAY)';
      } else if (period === '90days') {
        dateFilter = 'DATE_SUB(NOW(), INTERVAL 90 DAY)';
      } else if (period === 'year') {
        groupBy = 'DATE_FORMAT(created_at, "%Y-%m")';
        dateFilter = 'DATE_SUB(NOW(), INTERVAL 1 YEAR)';
      }

      const trends = await db.query(
        `SELECT 
          ${groupBy} as date,
          COUNT(*) as booking_count,
          SUM(total_amount) as revenue,
          COUNT(DISTINCT user_id) as unique_users
         FROM bookings
         WHERE created_at >= ${dateFilter}
         GROUP BY date
         ORDER BY date ASC`
      );

      res.json({
        success: true,
        data: trends
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get peak travel times
  static async getPeakTimes(req: Request, res: Response) {
    try {
      const hourlyData = await db.query(
        `SELECT 
          HOUR(t.departure_time) as hour,
          COUNT(b.id) as booking_count,
          AVG(b.total_amount) as avg_price
         FROM bookings b
         JOIN trips t ON b.trip_id = t.id
         WHERE b.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
         GROUP BY hour
         ORDER BY hour ASC`
      );

      const weekdayData = await db.query(
        `SELECT 
          DAYOFWEEK(b.trip_date) as day_of_week,
          COUNT(*) as booking_count,
          AVG(b.total_amount) as avg_price
         FROM bookings b
         WHERE b.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
         GROUP BY day_of_week
         ORDER BY day_of_week ASC`
      );

      res.json({
        success: true,
        data: {
          hourly: hourlyData,
          weekday: weekdayData
        }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get price insights
  static async getPriceInsights(req: Request, res: Response) {
    try {
      const { from, to } = req.query;

      if (!from || !to) {
        return res.status(400).json({
          success: false,
          message: 'Hitamo ahantu utangirira n\'ahageze (Please specify from and to locations)'
        });
      }

      // Get historical prices
      const priceHistory = await db.query(
        `SELECT 
          DATE(b.created_at) as date,
          MIN(b.total_amount) as min_price,
          MAX(b.total_amount) as max_price,
          AVG(b.total_amount) as avg_price
         FROM bookings b
         JOIN trips t ON b.trip_id = t.id
         WHERE t.from_location = ? AND t.to_location = ?
         AND b.created_at >= DATE_SUB(NOW(), INTERVAL 90 DAY)
         GROUP BY date
         ORDER BY date ASC`,
        [from, to]
      );

      // Get current best price
      const [bestPrice] = await db.query(
        `SELECT MIN(b.total_amount) as price
         FROM bookings b
         JOIN trips t ON b.trip_id = t.id
         WHERE t.from_location = ? AND t.to_location = ?
         AND b.trip_date >= CURDATE()
         AND b.status = 'confirmed'`,
        [from, to]
      );

      // Calculate price prediction
      const avgPrice = priceHistory.length > 0
        ? priceHistory.reduce((sum: number, item: any) => sum + Number(item.avg_price), 0) / priceHistory.length
        : 0;

      const trend = priceHistory.length >= 2
        ? Number(priceHistory[priceHistory.length - 1].avg_price) > Number(priceHistory[priceHistory.length - 2].avg_price)
          ? 'increasing'
          : 'decreasing'
        : 'stable';

      res.json({
        success: true,
        data: {
          history: priceHistory,
          bestCurrentPrice: bestPrice.price || null,
          avgPrice,
          trend,
          recommendation: trend === 'increasing'
            ? 'Tanga ubu, ibiciro birimo kwiyongera (Book now, prices are increasing)'
            : 'Teganya ubundi, ibiciro birashobora kugabanuka (Wait, prices may decrease)'
        }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}
