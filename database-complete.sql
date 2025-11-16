-- Complete GoBus Database with Sample Data
DROP DATABASE IF EXISTS gobus_db;
CREATE DATABASE gobus_db;
USE gobus_db;

-- Users Table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20),
    role VARCHAR(50) NOT NULL,
    avatar_url TEXT,
    status VARCHAR(50) DEFAULT 'Active',
    company_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Companies Table
CREATE TABLE companies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    logo_url TEXT,
    cover_url TEXT,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(20),
    address TEXT,
    owner_id INT,
    status VARCHAR(50) DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Buses Table
CREATE TABLE buses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT NOT NULL,
    plate_number VARCHAR(15) UNIQUE NOT NULL,
    model VARCHAR(100),
    capacity INT NOT NULL,
    amenities JSON,
    status VARCHAR(50) DEFAULT 'Operational',
    image_url TEXT,
    driver_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Routes Table
CREATE TABLE routes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT NOT NULL,
    origin VARCHAR(255) NOT NULL,
    destination VARCHAR(255) NOT NULL,
    base_price DECIMAL(10, 2) NOT NULL,
    estimated_duration_minutes INT NOT NULL,
    status VARCHAR(50) DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Trips Table
CREATE TABLE trips (
    id INT AUTO_INCREMENT PRIMARY KEY,
    route_id INT NOT NULL,
    bus_id INT NOT NULL,
    driver_id INT NOT NULL,
    departure_time TIMESTAMP NOT NULL,
    arrival_time TIMESTAMP NOT NULL,
    status VARCHAR(50) DEFAULT 'Scheduled',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Bookings Table
CREATE TABLE bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    trip_id INT NOT NULL,
    booking_id VARCHAR(20) UNIQUE NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'Confirmed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Seats Table
CREATE TABLE seats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,
    trip_id INT NOT NULL,
    seat_number VARCHAR(5) NOT NULL,
    UNIQUE (trip_id, seat_number)
);

-- Insert Sample Data
-- Companies
INSERT INTO companies (name, description, contact_email, contact_phone, address, status) VALUES
('Volcano Express', 'Premium bus service across Rwanda', 'info@volcano.rw', '+250788123456', 'Kigali, Rwanda', 'Active'),
('Kigali Bus Service', 'Reliable city and intercity transport', 'contact@kbs.rw', '+250788654321', 'Nyabugogo, Kigali', 'Active'),
('Rwanda Intercity', 'Connecting all major cities', 'hello@intercity.rw', '+250788987654', 'Remera, Kigali', 'Active');

-- Users (Company managers, drivers, passengers)
INSERT INTO users (name, email, password_hash, phone_number, role, company_id, status) VALUES
-- Company managers (password: password123)
('John Manager', 'manager@volcano.rw', '$2b$12$LQv3c1yqBTVHdkuLiDJ.iOjjj8zNphrxVCC5/Q/E/6.q5sK5Uy6jO', '+250788111111', 'company', 1, 'Active'),
('Sarah Boss', 'manager@kbs.rw', '$2b$12$LQv3c1yqBTVHdkuLiDJ.iOjjj8zNphrxVCC5/Q/E/6.q5sK5Uy6jO', '+250788222222', 'company', 2, 'Active'),
('Mike Director', 'manager@intercity.rw', '$2b$12$LQv3c1yqBTVHdkuLiDJ.iOjjj8zNphrxVCC5/Q/E/6.q5sK5Uy6jO', '+250788333333', 'company', 3, 'Active'),

-- Drivers (password: driver123)
('James Driver', 'james@volcano.rw', '$2b$12$LQv3c1yqBTVHdkuLiDJ.iOjjj8zNphrxVCC5/Q/E/6.q5sK5Uy6jO', '+250788444444', 'driver', 1, 'Active'),
('Mary Driver', 'mary@kbs.rw', '$2b$12$LQv3c1yqBTVHdkuLiDJ.iOjjj8zNphrxVCC5/Q/E/6.q5sK5Uy6jO', '+250788555555', 'driver', 2, 'Active'),
('Peter Driver', 'peter@intercity.rw', '$2b$12$LQv3c1yqBTVHdkuLiDJ.iOjjj8zNphrxVCC5/Q/E/6.q5sK5Uy6jO', '+250788666666', 'driver', 3, 'Active'),

-- Passengers (password: passenger123)
('Alice Passenger', 'alice@email.com', '$2b$12$LQv3c1yqBTVHdkuLiDJ.iOjjj8zNphrxVCC5/Q/E/6.q5sK5Uy6jO', '+250788777777', 'passenger', NULL, 'Active'),
('Bob Customer', 'bob@email.com', '$2b$12$LQv3c1yqBTVHdkuLiDJ.iOjjj8zNphrxVCC5/Q/E/6.q5sK5Uy6jO', '+250788888888', 'passenger', NULL, 'Active'),
('Carol User', 'carol@email.com', '$2b$12$LQv3c1yqBTVHdkuLiDJ.iOjjj8zNphrxVCC5/Q/E/6.q5sK5Uy6jO', '+250788999999', 'passenger', NULL, 'Active');

-- Buses
INSERT INTO buses (company_id, plate_number, model, capacity, amenities, status, driver_id) VALUES
(1, 'RAD001A', 'Mercedes Sprinter', 30, '["WiFi", "AC", "USB Charging"]', 'Operational', 4),
(1, 'RAD002B', 'Toyota Coaster', 25, '["AC", "Music System"]', 'Operational', NULL),
(2, 'RAD003C', 'Isuzu NPR', 35, '["WiFi", "AC", "TV"]', 'Operational', 5),
(2, 'RAD004D', 'Mercedes Benz', 40, '["WiFi", "AC", "USB Charging", "TV"]', 'Operational', NULL),
(3, 'RAD005E', 'Volvo Bus', 50, '["WiFi", "AC", "USB Charging", "TV", "Toilet"]', 'Operational', 6),
(3, 'RAD006F', 'Scania Bus', 45, '["WiFi", "AC", "USB Charging"]', 'Operational', NULL);

-- Routes
INSERT INTO routes (company_id, origin, destination, base_price, estimated_duration_minutes, status) VALUES
(1, 'Kigali', 'Butare', 2500.00, 120, 'Active'),
(1, 'Kigali', 'Musanze', 3000.00, 150, 'Active'),
(2, 'Kigali', 'Rubavu', 3500.00, 180, 'Active'),
(2, 'Kigali', 'Nyagatare', 4000.00, 200, 'Active'),
(3, 'Kigali', 'Rusizi', 4500.00, 240, 'Active'),
(3, 'Butare', 'Musanze', 3500.00, 180, 'Active');

-- Trips (Today and tomorrow)
INSERT INTO trips (route_id, bus_id, driver_id, departure_time, arrival_time, status) VALUES
-- Today's trips
(1, 1, 4, DATE_ADD(NOW(), INTERVAL 2 HOUR), DATE_ADD(NOW(), INTERVAL 4 HOUR), 'Scheduled'),
(2, 2, 4, DATE_ADD(NOW(), INTERVAL 3 HOUR), DATE_ADD(NOW(), INTERVAL 5 HOUR), 'Scheduled'),
(3, 3, 5, DATE_ADD(NOW(), INTERVAL 4 HOUR), DATE_ADD(NOW(), INTERVAL 7 HOUR), 'Scheduled'),
(4, 4, 5, DATE_ADD(NOW(), INTERVAL 5 HOUR), DATE_ADD(NOW(), INTERVAL 8 HOUR), 'Scheduled'),
(5, 5, 6, DATE_ADD(NOW(), INTERVAL 6 HOUR), DATE_ADD(NOW(), INTERVAL 10 HOUR), 'Scheduled'),

-- Tomorrow's trips
(1, 1, 4, DATE_ADD(NOW(), INTERVAL 1 DAY), DATE_ADD(NOW(), INTERVAL 1 DAY) + INTERVAL 2 HOUR, 'Scheduled'),
(2, 2, 4, DATE_ADD(NOW(), INTERVAL 1 DAY) + INTERVAL 1 HOUR, DATE_ADD(NOW(), INTERVAL 1 DAY) + INTERVAL 3 HOUR, 'Scheduled'),
(3, 3, 5, DATE_ADD(NOW(), INTERVAL 1 DAY) + INTERVAL 2 HOUR, DATE_ADD(NOW(), INTERVAL 1 DAY) + INTERVAL 5 HOUR, 'Scheduled'),
(4, 4, 5, DATE_ADD(NOW(), INTERVAL 1 DAY) + INTERVAL 3 HOUR, DATE_ADD(NOW(), INTERVAL 1 DAY) + INTERVAL 6 HOUR, 'Scheduled'),
(5, 5, 6, DATE_ADD(NOW(), INTERVAL 1 DAY) + INTERVAL 4 HOUR, DATE_ADD(NOW(), INTERVAL 1 DAY) + INTERVAL 8 HOUR, 'Scheduled');

-- Sample Bookings
INSERT INTO bookings (user_id, trip_id, booking_id, total_price, status) VALUES
(7, 1, 'GB-1001', 2500.00, 'Confirmed'),
(8, 2, 'GB-1002', 3000.00, 'Confirmed'),
(9, 3, 'GB-1003', 3500.00, 'Confirmed');

-- Sample Seats
INSERT INTO seats (booking_id, trip_id, seat_number) VALUES
(1, 1, 'A1'),
(2, 2, 'B2'),
(3, 3, 'C3');

-- Add Foreign Key Constraints
ALTER TABLE users ADD FOREIGN KEY (company_id) REFERENCES companies(id);
ALTER TABLE buses ADD FOREIGN KEY (company_id) REFERENCES companies(id);
ALTER TABLE buses ADD FOREIGN KEY (driver_id) REFERENCES users(id);
ALTER TABLE routes ADD FOREIGN KEY (company_id) REFERENCES companies(id);
ALTER TABLE trips ADD FOREIGN KEY (route_id) REFERENCES routes(id);
ALTER TABLE trips ADD FOREIGN KEY (bus_id) REFERENCES buses(id);
ALTER TABLE trips ADD FOREIGN KEY (driver_id) REFERENCES users(id);
ALTER TABLE bookings ADD FOREIGN KEY (user_id) REFERENCES users(id);
ALTER TABLE bookings ADD FOREIGN KEY (trip_id) REFERENCES trips(id);
ALTER TABLE seats ADD FOREIGN KEY (booking_id) REFERENCES bookings(id);
ALTER TABLE seats ADD FOREIGN KEY (trip_id) REFERENCES trips(id);

-- Add Indexes
CREATE INDEX idx_trips_departure_time ON trips(departure_time);
CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_seats_trip_id ON seats(trip_id);
CREATE INDEX idx_buses_driver_id ON buses(driver_id);
CREATE INDEX idx_users_company_role ON users(company_id, role);