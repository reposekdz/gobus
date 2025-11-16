import { Router } from 'express';

const router = Router();

// Health check endpoint
router.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'GoBus API is running',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: 'Demo mode - MySQL configuration available in .env.production'
    });
});

// API info endpoint
router.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'GoBus API v1.0.0 - Demo Mode',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        note: 'Backend is running in demo mode. Connect MySQL database for full functionality.',
        productionConfigAvailable: true
    });
});

// Mock auth endpoints
router.post('/auth/login', (req, res) => {
    res.json({
        success: true,
        token: 'demo-jwt-token',
        user: { id: 1, email: req.body.email, role: 'passenger' }
    });
});

router.post('/auth/register', (req, res) => {
    res.json({
        success: true,
        token: 'demo-jwt-token',
        user: { id: Date.now(), ...req.body, role: 'passenger' }
    });
});

router.get('/auth/me', (req, res) => {
    res.json({
        success: true,
        data: { id: 1, email: 'demo@gobus.rw', role: 'passenger', name: 'Demo User' }
    });
});

// Mock routes endpoints
router.get('/routes/search', (req, res) => {
    res.json({
        success: true,
        routes: [
            { id: 1, from: 'Kigali', to: 'Musanze', price: 2500, duration: '2h 30min' },
            { id: 2, from: 'Kigali', to: 'Huye', price: 3000, duration: '3h 15min' }
        ]
    });
});

router.get('/routes/cities', (req, res) => {
    res.json({
        success: true,
        data: ['Kigali', 'Musanze', 'Huye', 'Rubavu', 'Rusizi']
    });
});

router.get('/routes/popular', (req, res) => {
    res.json({
        success: true,
        data: [
            { id: 1, from: 'Kigali', to: 'Musanze', frequency: 150 },
            { id: 2, from: 'Kigali', to: 'Huye', frequency: 120 }
        ]
    });
});

// Mock bookings endpoints
router.post('/bookings', (req, res) => {
    res.json({
        success: true,
        data: {
            id: Date.now(),
            ...req.body,
            status: 'confirmed',
            qrCode: `GOBUS-${Date.now()}`
        }
    });
});

router.get('/bookings', (req, res) => {
    res.json({ success: true, data: [] });
});

// Mock wallet endpoints
router.get('/wallet/balance', (req, res) => {
    res.json({ success: true, data: { balance: 50000, currency: 'RWF' } });
});

router.post('/wallet/topup', (req, res) => {
    res.json({ success: true, message: 'Wallet topped up successfully' });
});

// Mock companies endpoints
router.get('/companies', (req, res) => {
    res.json({
        success: true,
        data: [
            { id: 1, name: 'Volcano Express', rating: 4.5, logo: null, totalTrips: 1250 },
            { id: 2, name: 'Southern Star', rating: 4.3, logo: null, totalTrips: 980 }
        ]
    });
});

router.get('/companies/promoted', (req, res) => {
    res.json({
        success: true,
        data: [
            { id: 1, name: 'Volcano Express', rating: 4.5, logo: null, totalTrips: 1250 },
            { id: 2, name: 'Southern Star', rating: 4.3, logo: null, totalTrips: 980 }
        ]
    });
});

// Mock destinations endpoints
router.get('/destinations', (req, res) => {
    res.json({
        success: true,
        data: [
            { id: 1, name: 'Musanze', description: 'Gateway to Volcanoes National Park', image: null },
            { id: 2, name: 'Huye', description: 'Cultural and educational center', image: null },
            { id: 3, name: 'Rubavu', description: 'Beautiful lakeside town', image: null }
        ]
    });
});

router.get('/destinations/featured', (req, res) => {
    res.json({
        success: true,
        data: [
            { id: 1, name: 'Musanze', description: 'Gateway to Volcanoes National Park', image: null },
            { id: 2, name: 'Huye', description: 'Cultural and educational center', image: null },
            { id: 3, name: 'Rubavu', description: 'Beautiful lakeside town', image: null }
        ]
    });
});

// Mock partners endpoints
router.get('/partners', (req, res) => {
    res.json({
        success: true,
        data: [
            { id: 1, name: 'Rwanda Tourism Board', logo: null },
            { id: 2, name: 'MTN Rwanda', logo: null },
            { id: 3, name: 'Airtel Rwanda', logo: null }
        ]
    });
});

// Mock stations endpoints
router.get('/stations', (req, res) => {
    res.json({
        success: true,
        data: [
            { id: 1, name: 'Nyabugogo Bus Terminal', city: 'Kigali', latitude: -1.9536, longitude: 30.0606 },
            { id: 2, name: 'Musanze Bus Station', city: 'Musanze', latitude: -1.4983, longitude: 29.6344 },
            { id: 3, name: 'Huye Bus Station', city: 'Huye', latitude: -2.5973, longitude: 29.7390 }
        ]
    });
});

// Mock advertisements endpoints
router.get('/advertisements', (req, res) => {
    res.json({ success: true, data: [] });
});

// Mock settings endpoints
router.get('/settings', (req, res) => {
    res.json({
        success: true,
        data: {
            siteName: 'GoBus Rwanda',
            currency: 'RWF',
            supportEmail: 'support@gobus.rw',
            supportPhone: '+250788123456'
        }
    });
});

router.get('/settings/:key', (req, res) => {
    const settings: any = {
        siteName: 'GoBus Rwanda',
        currency: 'RWF',
        supportEmail: 'support@gobus.rw',
        supportPhone: '+250788123456',
        heroImage: null,
        hero_image: null
    };
    res.json({
        success: true,
        data: settings[req.params.key] || null
    });
});

export default router;
