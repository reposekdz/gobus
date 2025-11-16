import db, { initializeDatabase } from './sqlite-init';

// Initialize database on first import
initializeDatabase();

export const dbService = {
  // User operations
  createUser(name: string, email: string, password: string, phone?: string, role: string = 'passenger') {
    const stmt = db.prepare(`
      INSERT INTO users (name, email, password, phone, role, wallet_balance) 
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(name, email, password, phone || '', role, 0);
    return { id: result.lastInsertRowid, name, email, phone, role, wallet_balance: 0 };
  },

  getUserByEmail(email: string) {
    const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
    return stmt.get(email);
  },

  getUserById(id: number) {
    const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
    return stmt.get(id);
  },

  updateUserWallet(userId: number, amount: number) {
    const stmt = db.prepare('UPDATE users SET wallet_balance = wallet_balance + ? WHERE id = ?');
    stmt.run(amount, userId);
    return this.getUserById(userId);
  },

  // Route operations
  searchRoutes(from?: string, to?: string) {
    let query = `
      SELECT r.*, c.name as company_name, c.rating as company_rating
      FROM routes r
      LEFT JOIN companies c ON r.company_id = c.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (from) {
      query += ' AND LOWER(r.from_location) LIKE LOWER(?)';
      params.push(`%${from}%`);
    }

    if (to) {
      query += ' AND LOWER(r.to_location) LIKE LOWER(?)';
      params.push(`%${to}%`);
    }

    const stmt = db.prepare(query);
    return stmt.all(...params);
  },

  getRouteById(id: number) {
    const stmt = db.prepare(`
      SELECT r.*, c.name as company_name 
      FROM routes r
      LEFT JOIN companies c ON r.company_id = c.id
      WHERE r.id = ?
    `);
    return stmt.get(id);
  },

  // Trip operations
  searchTrips(routeId?: number, date?: string) {
    let query = `SELECT * FROM trips WHERE available_seats > 0`;
    const params: any[] = [];

    if (routeId) {
      query += ' AND route_id = ?';
      params.push(routeId);
    }

    if (date) {
      query += ' AND departure_date = ?';
      params.push(date);
    }

    query += ' ORDER BY departure_date, departure_time';

    const stmt = db.prepare(query);
    return stmt.all(...params);
  },

  getTripById(id: number) {
    const stmt = db.prepare('SELECT * FROM trips WHERE id = ?');
    return stmt.get(id);
  },

  updateTripSeats(tripId: number, seatsToBook: number) {
    const stmt = db.prepare('UPDATE trips SET available_seats = available_seats - ? WHERE id = ? AND available_seats >= ?');
    const result = stmt.run(seatsToBook, tripId, seatsToBook);
    return result.changes > 0;
  },

  // Booking operations
  createBooking(userId: number, tripId: number, seatNumbers: string, totalPrice: number) {
    const qrCode = `GOBUS-${Date.now()}-${userId}`;
    const stmt = db.prepare(`
      INSERT INTO bookings (user_id, trip_id, seat_numbers, total_price, payment_status, booking_status, qr_code) 
      VALUES (?, ?, ?, ?, 'completed', 'confirmed', ?)
    `);
    const result = stmt.run(userId, tripId, seatNumbers, totalPrice, qrCode);
    
    return {
      id: result.lastInsertRowid,
      user_id: userId,
      trip_id: tripId,
      seat_numbers: seatNumbers,
      total_price: totalPrice,
      qr_code: qrCode,
      booking_status: 'confirmed',
      booking_date: new Date().toISOString()
    };
  },

  getUserBookings(userId: number) {
    const stmt = db.prepare(`
      SELECT b.*, t.departure_date, t.departure_time, r.from_location, r.to_location, c.name as company_name
      FROM bookings b
      JOIN trips t ON b.trip_id = t.id
      JOIN routes r ON t.route_id = r.id
      LEFT JOIN companies c ON r.company_id = c.id
      WHERE b.user_id = ?
      ORDER BY b.booking_date DESC
    `);
    return stmt.all(userId);
  },

  getBookingById(id: number) {
    const stmt = db.prepare(`
      SELECT b.*, t.departure_date, t.departure_time, r.from_location, r.to_location
      FROM bookings b
      JOIN trips t ON b.trip_id = t.id
      JOIN routes r ON t.route_id = r.id
      WHERE b.id = ?
    `);
    return stmt.get(id);
  },

  // Transaction operations
  createTransaction(userId: number, type: string, amount: number, description?: string) {
    const stmt = db.prepare(`
      INSERT INTO transactions (user_id, type, amount, description, status) 
      VALUES (?, ?, ?, ?, 'completed')
    `);
    const result = stmt.run(userId, type, amount, description || '');
    return { id: result.lastInsertRowid, user_id: userId, type, amount, description };
  },

  getUserTransactions(userId: number, limit: number = 50) {
    const stmt = db.prepare(`
      SELECT * FROM transactions 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT ?
    `);
    return stmt.all(userId, limit);
  },

  // Company operations
  getAllCompanies() {
    const stmt = db.prepare('SELECT * FROM companies ORDER BY rating DESC');
    return stmt.all();
  },

  getCompanyById(id: number) {
    const stmt = db.prepare('SELECT * FROM companies WHERE id = ?');
    return stmt.get(id);
  },

  // Locations
  getAllLocations() {
    const stmt = db.prepare(`
      SELECT DISTINCT from_location as name FROM routes
      UNION
      SELECT DISTINCT to_location as name FROM routes
      ORDER BY name
    `);
    return stmt.all();
  }
};

export default dbService;
