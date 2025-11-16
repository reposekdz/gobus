-- GoBus Platform Database Schema
-- SQL Dialect: MySQL

-- Users Table: Stores all user types (passengers, drivers, agents, admins)
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20),
    role VARCHAR(50) NOT NULL CHECK (role IN ('passenger', 'driver', 'agent', 'company', 'admin')),
    avatar_url TEXT,
    status VARCHAR(50) DEFAULT 'Active' CHECK (status IN ('Active', 'Suspended', 'Pending')),
    company_id INTEGER REFERENCES companies(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Companies Table: Stores bus operator partners
CREATE TABLE companies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    logo_url TEXT,
    cover_url TEXT,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(20),
    address TEXT,
    owner_id INTEGER REFERENCES users(id) ON DELETE RESTRICT,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('Active', 'Pending', 'Suspended')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Buses Table: Represents a single vehicle in a company's fleet
CREATE TABLE buses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    plate_number VARCHAR(15) UNIQUE NOT NULL,
    model VARCHAR(100),
    capacity INTEGER NOT NULL,
    amenities TEXT[], -- Array of strings like {'WiFi', 'AC', 'Charging'}
    status VARCHAR(50) DEFAULT 'operational' CHECK (status IN ('Operational', 'Maintenance', 'On Route')),
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Routes Table: Defines a travel path between two locations
CREATE TABLE routes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    origin VARCHAR(255) NOT NULL,
    destination VARCHAR(255) NOT NULL,
    base_price NUMERIC(10, 2) NOT NULL,
    estimated_duration_minutes INTEGER NOT NULL,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('Active', 'Inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (company_id, origin, destination)
);

-- Trips Table: A specific, scheduled journey on a Route
CREATE TABLE trips (
    id INT AUTO_INCREMENT PRIMARY KEY,
    route_id INTEGER NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
    bus_id INTEGER NOT NULL REFERENCES buses(id) ON DELETE RESTRICT,
    driver_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    departure_time TIMESTAMP WITH TIME ZONE NOT NULL,
    arrival_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(50) DEFAULT 'scheduled' CHECK (status IN ('Scheduled', 'Departed', 'Arrived', 'Cancelled', 'Delayed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Bookings Table: A record of a passenger's confirmed booking
CREATE TABLE bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    booking_id VARCHAR(20) UNIQUE NOT NULL, -- User-facing ID, e.g., GB-XYZ123
    total_price NUMERIC(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'confirmed' CHECK (status IN ('Confirmed', 'Cancelled', 'Completed', 'Pending')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seats Table: Represents seats for a specific booking
CREATE TABLE seats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INTEGER NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    seat_number VARCHAR(5) NOT NULL,
    UNIQUE (trip_id, seat_number) -- A seat can only be booked once per trip
);

-- Boardings Table: Log when a passenger's ticket is scanned
CREATE TABLE boardings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INTEGER NOT NULL REFERENCES bookings(id),
    trip_id INTEGER NOT NULL REFERENCES trips(id),
    driver_id INTEGER NOT NULL REFERENCES users(id),
    boarded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);


-- Passenger Wallet Table
CREATE TABLE wallets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    balance NUMERIC(12, 2) DEFAULT 0.00,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Wallet Transactions Table
CREATE TABLE wallet_transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    wallet_id INTEGER NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL, -- Positive for deposits, negative for withdrawals/payments
    type VARCHAR(50) CHECK (type IN ('deposit', 'purchase', 'refund', 'bonus', 'commission')),
    description TEXT,
    related_booking_id INTEGER REFERENCES bookings(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Contact Messages Table
CREATE TABLE messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    subject TEXT,
    message TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'New' CHECK (status IN ('New', 'Read', 'Archived')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Site Settings Table
CREATE TABLE site_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Featured Destinations Table
CREATE TABLE featured_destinations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    from_location VARCHAR(255) NOT NULL,
    to_location VARCHAR(255) NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    image_data_uri TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Reviews Table
CREATE TABLE reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Services Table (for company-specific offerings)
CREATE TABLE services (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Promotions Table
CREATE TABLE promotions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE, -- NULL for platform-wide promotions
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    discount_type VARCHAR(20) CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value NUMERIC(10, 2),
    start_date DATE,
    end_date DATE,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'expired')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Gallery Table (for company profiles)
CREATE TABLE gallery (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    category VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add driver_id column to buses table for assignment
ALTER TABLE buses ADD COLUMN driver_id INTEGER REFERENCES users(id) ON DELETE SET NULL;

-- Add indexes for performance
CREATE INDEX idx_trips_departure_time ON trips(departure_time);
CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_seats_trip_id ON seats(trip_id);
CREATE INDEX idx_buses_driver_id ON buses(driver_id);
CREATE INDEX idx_users_company_role ON users(company_id, role);

-- END OF SCHEMA
