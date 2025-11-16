import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import dbService from './database/db-service';

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
    message: 'GoBus Backend Server is running with SQLite database',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    database: 'SQLite (persistent)'
  });
});

// Auth routes
app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password required'
      });
    }

    const user = dbService.getUserByEmail(email);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // In production, you'd verify password hash here
    const token = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${Buffer.from(JSON.stringify({ id: user.id, email: user.email })).toString('base64')}`;
    
    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        wallet_balance: user.wallet_balance
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Login failed' });
  }
});

app.post('/api/auth/register', (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email and password required'
      });
    }

    // Check if user exists
    const existingUser = dbService.getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // In production, hash the password
    const user = dbService.createUser(name, email, password, phone);
    const token = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${Buffer.from(JSON.stringify({ id: user.id, email: user.email })).toString('base64')}`;
    
    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        wallet_balance: 0
      },
      message: 'Registration successful'
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: 'Registration failed' });
  }
});

// Search routes
app.get('/api/routes/search', (req, res) => {
  try {
    const { from, to, date } = req.query;
    
    const routes = dbService.searchRoutes(from as string, to as string);
    
    // Get trips for each route
    const routesWithTrips = routes.map(route => {
      const trips = dbService.searchTrips(route.id, date as string);
      return {
        ...route,
        trips: trips.map(trip => ({
          ...trip,
          price: trip.price,
          available_seats: trip.available_seats
        }))
      };
    });
    
    res.json({
      success: true,
      routes: routesWithTrips
    });
  } catch (error) {
    console.error('Search routes error:', error);
    res.status(500).json({ success: false, message: 'Search failed' });
  }
});

// Get route details
app.get('/api/routes/:id', (req, res) => {
  try {
    const route = dbService.getRouteById(Number(req.params.id));
    if (!route) {
      return res.status(404).json({ success: false, message: 'Route not found' });
    }
    res.json({ success: true, route });
  } catch (error) {
    console.error('Get route error:', error);
    res.status(500).json({ success: false, message: 'Failed to get route' });
  }
});

// Locations
app.get('/api/locations', (req, res) => {
  try {
    const locations = dbService.getAllLocations();
    res.json({
      success: true,
      locations
    });
  } catch (error) {
    console.error('Get locations error:', error);
    res.status(500).json({ success: false, message: 'Failed to get locations' });
  }
});

// Trips
app.get('/api/trips', (req, res) => {
  try {
    const { route_id, date } = req.query;
    const trips = dbService.searchTrips(
      route_id ? Number(route_id) : undefined,
      date as string
    );
    res.json({ success: true, trips });
  } catch (error) {
    console.error('Get trips error:', error);
    res.status(500).json({ success: false, message: 'Failed to get trips' });
  }
});

app.get('/api/trips/:id', (req, res) => {
  try {
    const trip = dbService.getTripById(Number(req.params.id));
    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }
    res.json({ success: true, trip });
  } catch (error) {
    console.error('Get trip error:', error);
    res.status(500).json({ success: false, message: 'Failed to get trip' });
  }
});

// Bookings
app.post('/api/bookings', (req, res) => {
  try {
    const { user_id, trip_id, seat_numbers, total_price } = req.body;
    
    if (!user_id || !trip_id || !seat_numbers || !total_price) {
      return res.status(400).json({
        success: false,
        message: 'Missing required booking information'
      });
    }

    // Check if trip exists and has available seats
    const trip = dbService.getTripById(trip_id);
    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }

    const seatsArray = seat_numbers.split(',');
    if (trip.available_seats < seatsArray.length) {
      return res.status(400).json({ success: false, message: 'Not enough available seats' });
    }

    // Update trip seats
    const updated = dbService.updateTripSeats(trip_id, seatsArray.length);
    if (!updated) {
      return res.status(400).json({ success: false, message: 'Failed to book seats' });
    }

    // Create booking
    const booking = dbService.createBooking(user_id, trip_id, seat_numbers, total_price);

    // Create transaction record
    dbService.createTransaction(user_id, 'booking_payment', -total_price, `Booking #${booking.id}`);
    
    res.json({
      success: true,
      booking,
      message: 'Booking created successfully'
    });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ success: false, message: 'Booking failed' });
  }
});

app.get('/api/bookings', (req, res) => {
  try {
    const { user_id } = req.query;
    
    if (!user_id) {
      return res.status(400).json({ success: false, message: 'User ID required' });
    }

    const bookings = dbService.getUserBookings(Number(user_id));
    res.json({ success: true, bookings });
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({ success: false, message: 'Failed to get bookings' });
  }
});

app.get('/api/bookings/:id', (req, res) => {
  try {
    const booking = dbService.getBookingById(Number(req.params.id));
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    res.json({ success: true, booking });
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({ success: false, message: 'Failed to get booking' });
  }
});

// Wallet
app.get('/api/wallet/balance', (req, res) => {
  try {
    const { user_id } = req.query;
    
    if (!user_id) {
      return res.status(400).json({ success: false, message: 'User ID required' });
    }

    const user = dbService.getUserById(Number(user_id));
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      balance: user.wallet_balance,
      currency: 'RWF'
    });
  } catch (error) {
    console.error('Get wallet balance error:', error);
    res.status(500).json({ success: false, message: 'Failed to get balance' });
  }
});

app.post('/api/wallet/topup', (req, res) => {
  try {
    const { user_id, amount } = req.body;
    
    if (!user_id || !amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Valid user ID and amount required' });
    }

    const user = dbService.updateUserWallet(user_id, Number(amount));
    dbService.createTransaction(user_id, 'wallet_topup', Number(amount), 'Wallet top-up');

    res.json({
      success: true,
      message: 'Wallet topped up successfully',
      newBalance: user.wallet_balance
    });
  } catch (error) {
    console.error('Wallet top-up error:', error);
    res.status(500).json({ success: false, message: 'Top-up failed' });
  }
});

app.get('/api/wallet/transactions', (req, res) => {
  try {
    const { user_id, limit } = req.query;
    
    if (!user_id) {
      return res.status(400).json({ success: false, message: 'User ID required' });
    }

    const transactions = dbService.getUserTransactions(
      Number(user_id),
      limit ? Number(limit) : 50
    );

    res.json({ success: true, transactions });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ success: false, message: 'Failed to get transactions' });
  }
});

// Companies
app.get('/api/companies', (req, res) => {
  try {
    const companies = dbService.getAllCompanies();
    res.json({ success: true, companies });
  } catch (error) {
    console.error('Get companies error:', error);
    res.status(500).json({ success: false, message: 'Failed to get companies' });
  }
});

app.get('/api/companies/:id', (req, res) => {
  try {
    const company = dbService.getCompanyById(Number(req.params.id));
    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }
    res.json({ success: true, company });
  } catch (error) {
    console.error('Get company error:', error);
    res.status(500).json({ success: false, message: 'Failed to get company' });
  }
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
  console.log('🚌 GoBus Production Backend Server');
  console.log(`📍 Server: http://localhost:${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Frontend URL: ${FRONTEND_URL}`);
  console.log(`💾 Database: SQLite (persistent storage)`);
  console.log(`✅ Health check: http://localhost:${PORT}/health`);
  console.log('');
  console.log('API Endpoints:');
  console.log('  POST /api/auth/login');
  console.log('  POST /api/auth/register');
  console.log('  GET  /api/routes/search');
  console.log('  GET  /api/locations');
  console.log('  GET  /api/trips');
  console.log('  POST /api/bookings');
  console.log('  GET  /api/bookings');
  console.log('  GET  /api/wallet/balance');
  console.log('  POST /api/wallet/topup');
  console.log('  GET  /api/companies');
});
