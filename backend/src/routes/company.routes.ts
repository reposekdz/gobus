import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// Mock company routes
router.get('/profile', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: {
      id: 1,
      name: 'Volcano Express',
      email: 'info@volcanoexpress.rw',
      phone: '+250788123456',
      routes: ['Kigali-Butare', 'Kigali-Musanze'],
      totalBuses: 15,
      totalDrivers: 25
    }
  });
});

router.get('/buses', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: 1,
        plateNumber: 'RAD 123A',
        model: 'Yutong ZK6122H9',
        capacity: 50,
        status: 'active'
      }
    ]
  });
});

export default router;