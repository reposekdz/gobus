import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Ensure data directory exists
const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'gobus.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize database schema
export function initializeDatabase() {
  console.log('Initializing SQLite database...');

  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      phone TEXT,
      role TEXT DEFAULT 'passenger',
      wallet_balance REAL DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Companies table
  db.exec(`
    CREATE TABLE IF NOT EXISTS companies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      rating REAL DEFAULT 0,
      total_buses INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Routes table
  db.exec(`
    CREATE TABLE IF NOT EXISTS routes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      from_location TEXT NOT NULL,
      to_location TEXT NOT NULL,
      distance_km REAL,
      base_price REAL NOT NULL,
      duration TEXT NOT NULL,
      company_id INTEGER,
      FOREIGN KEY (company_id) REFERENCES companies(id)
    );
  `);

  // Trips table
  db.exec(`
    CREATE TABLE IF NOT EXISTS trips (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      route_id INTEGER NOT NULL,
      departure_date TEXT NOT NULL,
      departure_time TEXT NOT NULL,
      arrival_time TEXT NOT NULL,
      total_seats INTEGER DEFAULT 40,
      available_seats INTEGER DEFAULT 40,
      price REAL NOT NULL,
      status TEXT DEFAULT 'scheduled',
      FOREIGN KEY (route_id) REFERENCES routes(id)
    );
  `);

  // Bookings table
  db.exec(`
    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      trip_id INTEGER NOT NULL,
      seat_numbers TEXT NOT NULL,
      total_price REAL NOT NULL,
      payment_status TEXT DEFAULT 'pending',
      booking_status TEXT DEFAULT 'confirmed',
      qr_code TEXT NOT NULL,
      booking_date TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (trip_id) REFERENCES trips(id)
    );
  `);

  // Transactions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'completed',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  // Insert sample companies
  const companyStmt = db.prepare(`
    INSERT OR IGNORE INTO companies (id, name, rating, total_buses) VALUES (?, ?, ?, ?)
  `);

  const companies = [
    [1, 'Volcano Express', 4.5, 25],
    [2, 'Southern Star', 4.3, 18],
    [3, 'Lake Kivu Lines', 4.7, 20],
    [4, 'Royal Bus', 4.2, 15],
    [5, 'Express Bus Service', 4.6, 22]
  ];

  companies.forEach(company => companyStmt.run(company));

  // Insert sample routes
  const routeStmt = db.prepare(`
    INSERT OR IGNORE INTO routes (id, from_location, to_location, distance_km, base_price, duration, company_id) VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const routes = [
    [1, 'Kigali', 'Musanze', 95, 2500, '2h 30min', 1],
    [2, 'Kigali', 'Huye', 135, 3000, '3h 15min', 2],
    [3, 'Kigali', 'Rubavu', 155, 3500, '4h', 3],
    [4, 'Musanze', 'Kigali', 95, 2500, '2h 30min', 1],
    [5, 'Huye', 'Kigali', 135, 3000, '3h 15min', 2],
    [6, 'Rubavu', 'Kigali', 155, 3500, '4h', 3],
    [7, 'Kigali', 'Rusizi', 230, 4500, '5h 30min', 4],
    [8, 'Kigali', 'Nyagatare', 170, 3800, '4h 15min', 5],
    [9, 'Musanze', 'Rubavu', 85, 2200, '2h', 3],
    [10, 'Huye', 'Rusizi', 150, 3200, '3h 30min', 4]
  ];

  routes.forEach(route => routeStmt.run(route));

  // Insert sample trips for the next few days
  const tripStmt = db.prepare(`
    INSERT OR IGNORE INTO trips (id, route_id, departure_date, departure_time, arrival_time, total_seats, available_seats, price, status) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const today = new Date();
  let tripId = 1;

  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const date = new Date(today);
    date.setDate(date.getDate() + dayOffset);
    const dateStr = date.toISOString().split('T')[0];

    // Create trips for each route
    routes.forEach((route, idx) => {
      // Morning trip
      tripStmt.run([
        tripId++,
        route[0],
        dateStr,
        '06:00',
        '09:30',
        40,
        Math.floor(Math.random() * 15) + 25,
        route[4],
        'scheduled'
      ]);

      // Afternoon trip
      tripStmt.run([
        tripId++,
        route[0],
        dateStr,
        '14:00',
        '17:30',
        40,
        Math.floor(Math.random() * 15) + 25,
        route[4],
        'scheduled'
      ]);
    });
  }

  console.log('✅ Database initialized successfully with sample data');
}

export default db;
