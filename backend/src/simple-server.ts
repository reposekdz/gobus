import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5000';

// Middleware
app.use(cors({
  origin: process.env.ENABLE_CORS_ALL === 'true' ? '*' : FRONTEND_URL,
  credentials: true
}));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'GoBus Backend Server is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Mock data for demo
const mockRoutes = [
  { id: 1, from: 'Kigali', to: 'Musanze', price: 2500, duration: '2h 30min', company: 'Volcano Express' },
  { id: 2, from: 'Kigali', to: 'Huye', price: 3000, duration: '3h 15min', company: 'Southern Star' },
  { id: 3, from: 'Kigali', to: 'Rubavu', price: 3500, duration: '4h', company: 'Lake Kivu Lines' },
  { id: 4, from: 'Musanze', to: 'Kigali', price: 2500, duration: '2h 30min', company: 'Volcano Express' },
  { id: 5, from: 'Huye', to: 'Kigali', price: 3000, duration: '3h 15min', company: 'Southern Star' },
];

// Auth routes
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  if (email && password) {
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock-token';
    const user = {
      id: 1,
      name: 'Demo User',
      email,
      role: 'passenger',
      phone: '+250788123456'
    };
    
    res.json({
      success: true,
      token,
      user
    });
  } else {
    res.status(400).json({
      success: false,
      message: 'Email and password required'
    });
  }
});

app.post('/api/auth/register', (req, res) => {
  const { name, email, password, phone } = req.body;
  
  if (name && email && password) {
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock-token';
    const user = {
      id: Date.now(),
      name,
      email,
      phone: phone || '',
      role: 'passenger'
    };
    
    res.json({
      success: true,
      token,
      user,
      message: 'Registration successful'
    });
  } else {
    res.status(400).json({
      success: false,
      message: 'Name, email and password required'
    });
  }
});

// Search routes
app.get('/api/routes/search', (req, res) => {
  const { from, to, date } = req.query;
  
  const results = mockRoutes.filter(route => 
    (!from || route.from.toLowerCase().includes((from as string).toLowerCase())) &&
    (!to || route.to.toLowerCase().includes((to as string).toLowerCase()))
  );
  
  res.json({
    success: true,
    routes: results.map(route => ({
      ...route,
      availableSeats: Math.floor(Math.random() * 30) + 10,
      departureTime: '08:00 AM',
      arrivalTime: '11:30 AM'
    }))
  });
});

// Locations
app.get('/api/locations', (req, res) => {
  const locations = [
    'Kigali', 'Musanze', 'Huye', 'Rubavu', 'Rusizi', 
    'Nyagatare', 'Muhanga', 'Gisakura', 'Rwamagana', 'Karongi'
  ];
  
  res.json({
    success: true,
    locations: locations.map((name, idx) => ({ id: idx + 1, name }))
  });
});

// Bookings
app.post('/api/bookings', (req, res) => {
  const booking = {
    id: Date.now(),
    ...req.body,
    status: 'confirmed',
    bookingDate: new Date().toISOString(),
    qrCode: `GOBUS-${Date.now()}`
  };
  
  res.json({
    success: true,
    booking,
    message: 'Booking created successfully'
  });
});

app.get('/api/bookings', (req, res) => {
  res.json({
    success: true,
    bookings: []
  });
});

// Wallet
app.get('/api/wallet/balance', (req, res) => {
  res.json({
    success: true,
    balance: 50000,
    currency: 'RWF'
  });
});

app.post('/api/wallet/topup', (req, res) => {
  const { amount } = req.body;
  
  res.json({
    success: true,
    message: 'Wallet topped up successfully',
    newBalance: 50000 + Number(amount)
  });
});

// Companies
app.get('/api/companies', (req, res) => {
  const companies = [
    { id: 1, name: 'Volcano Express', rating: 4.5, buses: 25 },
    { id: 2, name: 'Southern Star', rating: 4.3, buses: 18 },
    { id: 3, name: 'Lake Kivu Lines', rating: 4.7, buses: 20 }
  ];
  
  res.json({
    success: true,
    companies
  });
});

// Error handling
app.use((err: any, req: any, res: any, next: any) => {
  console.error('Error:', err);
  res.status(500).json({ 
    success: false, 
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found'
  });
});

app.listen(PORT, () => {
  console.log(`🚌 GoBus Backend Server running on http://localhost:${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Frontend URL: ${FRONTEND_URL}`);
  console.log(`✅ Health check: http://localhost:${PORT}/health`);
});