import { Request, Response } from 'express';
import { db } from '../../config/database';

export class ReviewController {
  // Create a review
  static async createReview(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { booking_id, trip_id, rating, comment, categories } = req.body;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Ntabwo warinjiye (Not authenticated)'
        });
      }

      // Validate rating
      if (rating < 1 || rating > 5) {
        return res.status(400).json({
          success: false,
          message: 'Igipimo kigomba kuba hagati ya 1 na 5 (Rating must be between 1 and 5)'
        });
      }

      // Check if user has already reviewed this trip
      const existingReview = await db.query(
        'SELECT id FROM reviews WHERE user_id = ? AND booking_id = ?',
        [userId, booking_id]
      );

      if (existingReview && existingReview.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Warasanzwe wanditse igitekerezo kuri uryu rugendo (You have already reviewed this trip)'
        });
      }

      // Create review
      const result = await db.query(
        `INSERT INTO reviews (user_id, booking_id, trip_id, rating, comment, categories, created_at)
         VALUES (?, ?, ?, ?, ?, ?, NOW())`,
        [userId, booking_id, trip_id, rating, comment, JSON.stringify(categories)]
      );

      // Update trip average rating
      await ReviewController.updateTripRating(trip_id);

      // Award loyalty points for review
      await ReviewController.awardReviewPoints(userId, 50);

      res.status(201).json({
        success: true,
        message: 'Igitekerezo cyawe cyashyizweho neza (Review submitted successfully)',
        data: { review_id: result.insertId }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get reviews for a trip
  static async getTripReviews(req: Request, res: Response) {
    try {
      const { tripId } = req.params;
      const { page = 1, limit = 10, sort = 'recent' } = req.query;

      const offset = (Number(page) - 1) * Number(limit);

      let orderBy = 'r.created_at DESC';
      if (sort === 'rating_high') orderBy = 'r.rating DESC';
      if (sort === 'rating_low') orderBy = 'r.rating ASC';
      if (sort === 'helpful') orderBy = 'r.helpful_count DESC';

      const reviews = await db.query(
        `SELECT r.*, u.name as user_name, u.avatar_url
         FROM reviews r
         JOIN users u ON r.user_id = u.id
         WHERE r.trip_id = ?
         ORDER BY ${orderBy}
         LIMIT ? OFFSET ?`,
        [tripId, Number(limit), offset]
      );

      // Get total count and average rating
      const [stats] = await db.query(
        `SELECT COUNT(*) as total, AVG(rating) as avg_rating
         FROM reviews
         WHERE trip_id = ?`,
        [tripId]
      );

      // Get rating distribution
      const distribution = await db.query(
        `SELECT rating, COUNT(*) as count
         FROM reviews
         WHERE trip_id = ?
         GROUP BY rating
         ORDER BY rating DESC`,
        [tripId]
      );

      res.json({
        success: true,
        data: {
          reviews,
          stats: {
            total: stats.total || 0,
            avgRating: Number(stats.avg_rating) || 0,
            distribution
          },
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total: stats.total || 0,
            totalPages: Math.ceil((stats.total || 0) / Number(limit))
          }
        }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Mark review as helpful
  static async markHelpful(req: Request, res: Response) {
    try {
      const { reviewId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Ntabwo warinjiye (Not authenticated)'
        });
      }

      // Check if user has already marked this review as helpful
      const existing = await db.query(
        'SELECT id FROM review_helpful WHERE user_id = ? AND review_id = ?',
        [userId, reviewId]
      );

      if (existing && existing.length > 0) {
        // Remove helpful mark
        await db.query(
          'DELETE FROM review_helpful WHERE user_id = ? AND review_id = ?',
          [userId, reviewId]
        );
        await db.query(
          'UPDATE reviews SET helpful_count = helpful_count - 1 WHERE id = ?',
          [reviewId]
        );
      } else {
        // Add helpful mark
        await db.query(
          'INSERT INTO review_helpful (user_id, review_id, created_at) VALUES (?, ?, NOW())',
          [userId, reviewId]
        );
        await db.query(
          'UPDATE reviews SET helpful_count = helpful_count + 1 WHERE id = ?',
          [reviewId]
        );
      }

      res.json({
        success: true,
        message: 'Murakoze (Thank you)'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get company reviews
  static async getCompanyReviews(req: Request, res: Response) {
    try {
      const { companyId } = req.params;
      const { page = 1, limit = 10 } = req.query;

      const offset = (Number(page) - 1) * Number(limit);

      const reviews = await db.query(
        `SELECT r.*, u.name as user_name, u.avatar_url, t.from_location, t.to_location
         FROM reviews r
         JOIN users u ON r.user_id = u.id
         JOIN trips t ON r.trip_id = t.id
         WHERE t.bus_company_id = ?
         ORDER BY r.created_at DESC
         LIMIT ? OFFSET ?`,
        [companyId, Number(limit), offset]
      );

      const [stats] = await db.query(
        `SELECT COUNT(*) as total, AVG(r.rating) as avg_rating
         FROM reviews r
         JOIN trips t ON r.trip_id = t.id
         WHERE t.bus_company_id = ?`,
        [companyId]
      );

      res.json({
        success: true,
        data: {
          reviews,
          stats: {
            total: stats.total || 0,
            avgRating: Number(stats.avg_rating) || 0
          },
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total: stats.total || 0,
            totalPages: Math.ceil((stats.total || 0) / Number(limit))
          }
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
  private static async updateTripRating(tripId: string) {
    try {
      const [stats] = await db.query(
        'SELECT AVG(rating) as avg_rating, COUNT(*) as review_count FROM reviews WHERE trip_id = ?',
        [tripId]
      );

      await db.query(
        'UPDATE trips SET avg_rating = ?, review_count = ? WHERE id = ?',
        [stats.avg_rating || 0, stats.review_count || 0, tripId]
      );
    } catch (error) {
      console.error('Error updating trip rating:', error);
    }
  }

  private static async awardReviewPoints(userId: string, points: number) {
    try {
      await db.query(
        'UPDATE users SET loyalty_points = loyalty_points + ? WHERE id = ?',
        [points, userId]
      );

      await db.query(
        `INSERT INTO loyalty_transactions (user_id, points, type, description, created_at)
         VALUES (?, ?, ?, ?, NOW())`,
        [userId, points, 'review', 'Amanota yo kwandika igitekerezo (Points for writing a review)']
      );
    } catch (error) {
      console.error('Error awarding review points:', error);
    }
  }
}
