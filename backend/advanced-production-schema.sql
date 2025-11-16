-- =====================================================
-- GOBUS ADVANCED PRODUCTION DATABASE SCHEMA
-- =====================================================

-- Drop existing database if exists and create new one
DROP DATABASE IF EXISTS gobus_production;
CREATE DATABASE gobus_production CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE gobus_production;

-- =====================================================
-- CORE TABLES
-- =====================================================

-- Users table with enhanced fields
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    role ENUM('admin', 'company_manager', 'agent', 'driver', 'passenger') NOT NULL DEFAULT 'passenger',
    company_id VARCHAR(36) NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    email_verified_at TIMESTAMP NULL,
    phone_verified_at TIMESTAMP NULL,
    last_login TIMESTAMP NULL,
    login_attempts INT DEFAULT 0,
    locked_until TIMESTAMP NULL,
    profile_image VARCHAR(500) NULL,
    date_of_birth DATE NULL,
    gender ENUM('male', 'female', 'other') NULL,
    address TEXT NULL,
    emergency_contact_name VARCHAR(255) NULL,
    emergency_contact_phone VARCHAR(20) NULL,
    preferred_language VARCHAR(10) DEFAULT 'en',
    notification_preferences JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_phone (phone),
    INDEX idx_role (role),
    INDEX idx_company_id (company_id),
    INDEX idx_is_active (is_active)
);

-- Companies table with advanced features
CREATE TABLE companies (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) NOT NULL,
    address TEXT NOT NULL,
    license_number VARCHAR(100) UNIQUE NOT NULL,
    tax_id VARCHAR(100) UNIQUE NOT NULL,
    description TEXT NULL,
    logo_url VARCHAR(500) NULL,
    website VARCHAR(255) NULL,
    primary_color VARCHAR(7) DEFAULT '#1E40AF',
    secondary_color VARCHAR(7) DEFAULT '#3B82F6',
    subscription_plan ENUM('basic', 'premium', 'enterprise') DEFAULT 'basic',
    commission_rate DECIMAL(5,2) DEFAULT 5.00,
    api_key VARCHAR(100) UNIQUE NOT NULL,
    api_secret VARCHAR(100) NOT NULL,
    status ENUM('active', 'suspended', 'inactive') DEFAULT 'active',
    verified_at TIMESTAMP NULL,
    expires_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_subscription_plan (subscription_plan),
    INDEX idx_api_key (api_key)
);

-- Company settings
CREATE TABLE company_settings (
    id VARCHAR(36) PRIMARY KEY,
    company_id VARCHAR(36) NOT NULL,
    booking_fee_percentage DECIMAL(5,2) DEFAULT 2.50,
    cancellation_fee_percentage DECIMAL(5,2) DEFAULT 10.00,
    refund_policy_hours INT DEFAULT 24,
    max_advance_booking_days INT DEFAULT 90,
    auto_confirm_bookings BOOLEAN DEFAULT TRUE,
    enable_loyalty_program BOOLEAN DEFAULT TRUE,
    loyalty_points_ratio DECIMAL(5,4) DEFAULT 0.0200,
    enable_notifications BOOLEAN DEFAULT TRUE,
    enable_sms_notifications BOOLEAN DEFAULT TRUE,
    enable_email_notifications BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    UNIQUE KEY unique_company_settings (company_id)
);

-- Agents table
CREATE TABLE agents (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    company_id VARCHAR(36) NOT NULL,
    agent_type ENUM('sales', 'support', 'manager') NOT NULL,
    id_number VARCHAR(50) NOT NULL,
    address TEXT NOT NULL,
    commission_rate DECIMAL(5,2) DEFAULT 5.00,
    permissions JSON NOT NULL,
    status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
    hire_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    INDEX idx_company_id (company_id),
    INDEX idx_agent_type (agent_type),
    INDEX idx_status (status)
);

-- Drivers table with enhanced fields
CREATE TABLE drivers (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    company_id VARCHAR(36) NOT NULL,
    license_number VARCHAR(100) UNIQUE NOT NULL,
    license_expiry DATE NOT NULL,
    id_number VARCHAR(50) NOT NULL,
    address TEXT NOT NULL,
    emergency_contact_name VARCHAR(255) NOT NULL,
    emergency_contact_phone VARCHAR(20) NOT NULL,
    experience_years INT DEFAULT 0,
    salary_type ENUM('fixed', 'commission', 'hybrid') DEFAULT 'fixed',
    base_salary DECIMAL(10,2) DEFAULT 0.00,
    commission_rate DECIMAL(5,2) DEFAULT 0.00,
    status ENUM('active', 'inactive', 'suspended', 'on_leave') DEFAULT 'active',
    rating DECIMAL(3,2) DEFAULT 5.00,
    total_trips INT DEFAULT 0,
    total_distance_km DECIMAL(10,2) DEFAULT 0.00,
    hire_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    INDEX idx_company_id (company_id),
    INDEX idx_license_number (license_number),
    INDEX idx_status (status),
    INDEX idx_rating (rating)
);

-- Buses table with enhanced tracking
CREATE TABLE buses (
    id VARCHAR(36) PRIMARY KEY,
    company_id VARCHAR(36) NOT NULL,
    plate_number VARCHAR(20) UNIQUE NOT NULL,
    model VARCHAR(100) NOT NULL,
    manufacturer VARCHAR(100) NOT NULL,
    year_manufactured YEAR NOT NULL,
    capacity INT NOT NULL,
    bus_type ENUM('standard', 'luxury', 'vip', 'sleeper') DEFAULT 'standard',
    fuel_type ENUM('diesel', 'petrol', 'electric', 'hybrid') DEFAULT 'diesel',
    assigned_driver_id VARCHAR(36) NULL,
    status ENUM('active', 'maintenance', 'inactive', 'assigned') DEFAULT 'active',
    last_maintenance_date DATE NULL,
    next_maintenance_date DATE NULL,
    insurance_expiry DATE NULL,
    registration_expiry DATE NULL,
    gps_device_id VARCHAR(100) NULL,
    current_location JSON NULL,
    total_distance_km DECIMAL(12,2) DEFAULT 0.00,
    fuel_efficiency_kmpl DECIMAL(5,2) NULL,
    amenities JSON NULL,
    images JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_driver_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_company_id (company_id),
    INDEX idx_plate_number (plate_number),
    INDEX idx_status (status),
    INDEX idx_assigned_driver (assigned_driver_id)
);

-- Bus assignments table
CREATE TABLE bus_assignments (
    id VARCHAR(36) PRIMARY KEY,
    driver_id VARCHAR(36) NOT NULL,
    bus_id VARCHAR(36) NOT NULL,
    company_id VARCHAR(36) NOT NULL,
    assignment_type ENUM('primary', 'secondary', 'temporary') DEFAULT 'primary',
    start_date DATE NOT NULL,
    end_date DATE NULL,
    notes TEXT NULL,
    status ENUM('active', 'completed', 'cancelled') DEFAULT 'active',
    assigned_by VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (driver_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (bus_id) REFERENCES buses(id) ON DELETE CASCADE,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_driver_id (driver_id),
    INDEX idx_bus_id (bus_id),
    INDEX idx_company_id (company_id),
    INDEX idx_status (status)
);

-- Routes table with enhanced data
CREATE TABLE routes (
    id VARCHAR(36) PRIMARY KEY,
    company_id VARCHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    origin VARCHAR(255) NOT NULL,
    destination VARCHAR(255) NOT NULL,
    intermediate_stops JSON NULL,
    distance DECIMAL(8,2) NOT NULL,
    estimated_duration INT NOT NULL, -- in minutes
    base_price DECIMAL(10,2) NOT NULL,
    route_type ENUM('express', 'regular', 'luxury', 'overnight') DEFAULT 'regular',
    status ENUM('active', 'inactive', 'seasonal') DEFAULT 'active',
    operating_days JSON NOT NULL, -- ["monday", "tuesday", ...]
    peak_season_multiplier DECIMAL(3,2) DEFAULT 1.00,
    description TEXT NULL,
    route_map_url VARCHAR(500) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    INDEX idx_company_id (company_id),
    INDEX idx_origin_destination (origin, destination),
    INDEX idx_status (status)
);

-- Trips table with real-time tracking
CREATE TABLE trips (
    id VARCHAR(36) PRIMARY KEY,
    route_id VARCHAR(36) NOT NULL,
    bus_id VARCHAR(36) NOT NULL,
    driver_id VARCHAR(36) NOT NULL,
    company_id VARCHAR(36) NOT NULL,
    departure_time TIMESTAMP NOT NULL,
    arrival_time TIMESTAMP NOT NULL,
    actual_departure_time TIMESTAMP NULL,
    actual_arrival_time TIMESTAMP NULL,
    status ENUM('scheduled', 'boarding', 'in_progress', 'completed', 'cancelled', 'delayed') DEFAULT 'scheduled',
    available_seats INT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    current_location JSON NULL,
    delay_minutes INT DEFAULT 0,
    cancellation_reason TEXT NULL,
    weather_conditions VARCHAR(100) NULL,
    fuel_consumed DECIMAL(8,2) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE,
    FOREIGN KEY (bus_id) REFERENCES buses(id) ON DELETE CASCADE,
    FOREIGN KEY (driver_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    INDEX idx_route_id (route_id),
    INDEX idx_bus_id (bus_id),
    INDEX idx_driver_id (driver_id),
    INDEX idx_company_id (company_id),
    INDEX idx_departure_time (departure_time),
    INDEX idx_status (status)
);

-- =====================================================
-- BOOKING AND PAYMENT TABLES
-- =====================================================

-- Bookings table with enhanced tracking
CREATE TABLE bookings (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    trip_id VARCHAR(36) NOT NULL,
    company_id VARCHAR(36) NOT NULL,
    booking_reference VARCHAR(20) UNIQUE NOT NULL,
    passenger_count INT NOT NULL DEFAULT 1,
    seat_numbers JSON NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    discount_amount DECIMAL(10,2) DEFAULT 0.00,
    tax_amount DECIMAL(10,2) DEFAULT 0.00,
    commission_amount DECIMAL(10,2) DEFAULT 0.00,
    status ENUM('pending', 'confirmed', 'checked_in', 'completed', 'cancelled', 'refunded') DEFAULT 'pending',
    payment_status ENUM('pending', 'processing', 'completed', 'failed', 'refunded') DEFAULT 'pending',
    payment_method ENUM('cash', 'mobile_money', 'card', 'wallet', 'bank_transfer') NULL,
    booking_source ENUM('web', 'mobile', 'agent', 'phone') DEFAULT 'web',
    special_requests TEXT NULL,
    cancellation_reason TEXT NULL,
    cancelled_at TIMESTAMP NULL,
    expires_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_trip_id (trip_id),
    INDEX idx_company_id (company_id),
    INDEX idx_booking_reference (booking_reference),
    INDEX idx_status (status),
    INDEX idx_payment_status (payment_status)
);

-- Passenger information table
CREATE TABLE passenger_info (
    id VARCHAR(36) PRIMARY KEY,
    booking_id VARCHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NULL,
    email VARCHAR(255) NULL,
    id_number VARCHAR(50) NULL,
    age INT NULL,
    gender ENUM('male', 'female', 'other') NULL,
    emergency_contact_name VARCHAR(255) NULL,
    emergency_contact_phone VARCHAR(20) NULL,
    special_needs TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    INDEX idx_booking_id (booking_id)
);

-- Passenger check-ins table
CREATE TABLE passenger_checkins (
    id VARCHAR(36) PRIMARY KEY,
    booking_id VARCHAR(36) NOT NULL,
    trip_id VARCHAR(36) NOT NULL,
    driver_id VARCHAR(36) NOT NULL,
    seat_number VARCHAR(10) NOT NULL,
    check_in_time TIMESTAMP NOT NULL,
    check_in_status ENUM('checked_in', 'no_show', 'cancelled') DEFAULT 'checked_in',
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
    FOREIGN KEY (driver_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_booking_id (booking_id),
    INDEX idx_trip_id (trip_id),
    INDEX idx_driver_id (driver_id)
);

-- Mobile money payments table
CREATE TABLE mobile_money_payments (
    id VARCHAR(36) PRIMARY KEY,
    booking_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    provider ENUM('mtn', 'airtel') NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'RWF',
    external_reference VARCHAR(100) NOT NULL,
    provider_reference VARCHAR(100) NULL,
    provider_transaction_id VARCHAR(100) NULL,
    status ENUM('pending', 'completed', 'failed', 'cancelled') DEFAULT 'pending',
    request_data JSON NULL,
    response_data JSON NULL,
    webhook_data JSON NULL,
    completed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_booking_id (booking_id),
    INDEX idx_user_id (user_id),
    INDEX idx_provider (provider),
    INDEX idx_status (status),
    INDEX idx_external_reference (external_reference)
);

-- =====================================================
-- BLOCKCHAIN WALLET SYSTEM
-- =====================================================

-- Blockchain wallets table
CREATE TABLE blockchain_wallets (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    wallet_address VARCHAR(42) UNIQUE NOT NULL,
    public_key VARCHAR(130) NOT NULL,
    encrypted_private_key TEXT NOT NULL,
    wallet_type ENUM('user', 'company', 'system') DEFAULT 'user',
    currency VARCHAR(10) DEFAULT 'RWF',
    balance DECIMAL(18,8) DEFAULT 0.00000000,
    status ENUM('active', 'frozen', 'closed') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_wallet_address (wallet_address),
    INDEX idx_status (status)
);

-- Blockchain transactions table
CREATE TABLE blockchain_transactions (
    id VARCHAR(36) PRIMARY KEY,
    from_wallet VARCHAR(42) NOT NULL,
    to_wallet VARCHAR(42) NOT NULL,
    amount DECIMAL(18,8) NOT NULL,
    transaction_type ENUM('transfer', 'deposit', 'withdrawal', 'payment', 'refund') NOT NULL,
    currency VARCHAR(10) DEFAULT 'RWF',
    hash VARCHAR(66) UNIQUE NOT NULL,
    block_number BIGINT NOT NULL,
    gas_fee DECIMAL(18,8) DEFAULT 0.00000000,
    status ENUM('pending', 'confirmed', 'failed') DEFAULT 'pending',
    metadata JSON NULL,
    user_id VARCHAR(36) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_from_wallet (from_wallet),
    INDEX idx_to_wallet (to_wallet),
    INDEX idx_hash (hash),
    INDEX idx_block_number (block_number),
    INDEX idx_status (status),
    INDEX idx_transaction_type (transaction_type)
);

-- Blockchain blocks table
CREATE TABLE blockchain_blocks (
    id VARCHAR(36) PRIMARY KEY,
    block_number BIGINT UNIQUE NOT NULL,
    previous_hash VARCHAR(66) NOT NULL,
    hash VARCHAR(66) UNIQUE NOT NULL,
    nonce BIGINT NOT NULL,
    transactions_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_block_number (block_number),
    INDEX idx_hash (hash)
);

-- Company wallets table
CREATE TABLE company_wallets (
    id VARCHAR(36) PRIMARY KEY,
    company_id VARCHAR(36) NOT NULL,
    balance DECIMAL(15,2) DEFAULT 0.00,
    currency VARCHAR(3) DEFAULT 'RWF',
    status ENUM('active', 'frozen', 'closed') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    INDEX idx_company_id (company_id),
    INDEX idx_status (status)
);

-- Driver wallets table
CREATE TABLE driver_wallets (
    id VARCHAR(36) PRIMARY KEY,
    driver_id VARCHAR(36) NOT NULL,
    balance DECIMAL(15,2) DEFAULT 0.00,
    currency VARCHAR(3) DEFAULT 'RWF',
    status ENUM('active', 'frozen', 'closed') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (driver_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_driver_id (driver_id),
    INDEX idx_status (status)
);

-- =====================================================
-- TICKET SYSTEM
-- =====================================================

-- Tickets table with QR codes
CREATE TABLE tickets (
    id VARCHAR(36) PRIMARY KEY,
    booking_id VARCHAR(36) NOT NULL,
    trip_id VARCHAR(36) NOT NULL,
    company_id VARCHAR(36) NOT NULL,
    ticket_number VARCHAR(50) UNIQUE NOT NULL,
    qr_code LONGTEXT NOT NULL,
    qr_data JSON NOT NULL,
    verification_code VARCHAR(20) NOT NULL,
    status ENUM('active', 'used', 'expired', 'cancelled') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    INDEX idx_booking_id (booking_id),
    INDEX idx_trip_id (trip_id),
    INDEX idx_company_id (company_id),
    INDEX idx_ticket_number (ticket_number),
    INDEX idx_verification_code (verification_code),
    INDEX idx_status (status)
);

-- Ticket verifications table
CREATE TABLE ticket_verifications (
    id VARCHAR(36) PRIMARY KEY,
    ticket_id VARCHAR(36) NOT NULL,
    verified_by VARCHAR(36) NOT NULL,
    verification_time TIMESTAMP NOT NULL,
    verification_result ENUM('valid', 'invalid', 'expired', 'used') NOT NULL,
    location JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
    FOREIGN KEY (verified_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_ticket_id (ticket_id),
    INDEX idx_verified_by (verified_by),
    INDEX idx_verification_time (verification_time)
);

-- =====================================================
-- TRACKING AND LOGS
-- =====================================================

-- Trip status logs
CREATE TABLE trip_status_logs (
    id VARCHAR(36) PRIMARY KEY,
    trip_id VARCHAR(36) NOT NULL,
    old_status VARCHAR(50) NOT NULL,
    new_status VARCHAR(50) NOT NULL,
    location JSON NULL,
    notes TEXT NULL,
    changed_by VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_trip_id (trip_id),
    INDEX idx_changed_by (changed_by),
    INDEX idx_created_at (created_at)
);

-- Company status logs
CREATE TABLE company_status_logs (
    id VARCHAR(36) PRIMARY KEY,
    company_id VARCHAR(36) NOT NULL,
    old_status VARCHAR(50) NOT NULL,
    new_status VARCHAR(50) NOT NULL,
    reason TEXT NULL,
    changed_by VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_company_id (company_id),
    INDEX idx_changed_by (changed_by),
    INDEX idx_created_at (created_at)
);

-- =====================================================
-- REVIEWS AND RATINGS
-- =====================================================

-- Reviews table
CREATE TABLE reviews (
    id VARCHAR(36) PRIMARY KEY,
    booking_id VARCHAR(36) NOT NULL,
    trip_id VARCHAR(36) NOT NULL,
    company_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    driver_id VARCHAR(36) NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT NULL,
    review_type ENUM('trip', 'driver', 'company', 'bus') DEFAULT 'trip',
    is_verified BOOLEAN DEFAULT FALSE,
    is_published BOOLEAN DEFAULT TRUE,
    helpful_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (driver_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_booking_id (booking_id),
    INDEX idx_trip_id (trip_id),
    INDEX idx_company_id (company_id),
    INDEX idx_user_id (user_id),
    INDEX idx_driver_id (driver_id),
    INDEX idx_rating (rating),
    INDEX idx_review_type (review_type)
);

-- =====================================================
-- NOTIFICATIONS
-- =====================================================

-- Notifications table
CREATE TABLE notifications (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('booking', 'payment', 'trip', 'system', 'promotion') NOT NULL,
    data JSON NULL,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_type (type),
    INDEX idx_is_read (is_read),
    INDEX idx_created_at (created_at)
);

-- Push notification tokens
CREATE TABLE push_notification_tokens (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    token VARCHAR(500) NOT NULL,
    platform ENUM('ios', 'android', 'web') NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_token (token(255)),
    INDEX idx_platform (platform),
    INDEX idx_is_active (is_active)
);

-- =====================================================
-- ANALYTICS AND REPORTING
-- =====================================================

-- Analytics events table
CREATE TABLE analytics_events (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NULL,
    session_id VARCHAR(100) NULL,
    event_name VARCHAR(100) NOT NULL,
    event_data JSON NULL,
    user_agent TEXT NULL,
    ip_address VARCHAR(45) NULL,
    platform VARCHAR(50) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_event_name (event_name),
    INDEX idx_created_at (created_at)
);

-- =====================================================
-- SYSTEM TABLES
-- =====================================================

-- System settings
CREATE TABLE system_settings (
    id VARCHAR(36) PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    setting_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
    description TEXT NULL,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_setting_key (setting_key),
    INDEX idx_is_public (is_public)
);

-- API rate limits
CREATE TABLE api_rate_limits (
    id VARCHAR(36) PRIMARY KEY,
    identifier VARCHAR(255) NOT NULL, -- IP, user_id, or API key
    endpoint VARCHAR(255) NOT NULL,
    requests_count INT DEFAULT 0,
    window_start TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_identifier (identifier),
    INDEX idx_endpoint (endpoint),
    INDEX idx_window_start (window_start)
);

-- =====================================================
-- INITIAL DATA
-- =====================================================

-- Insert system settings
INSERT INTO system_settings (id, setting_key, setting_value, setting_type, description, is_public) VALUES
(UUID(), 'app_name', 'GoBus Rwanda', 'string', 'Application name', TRUE),
(UUID(), 'app_version', '2.0.0', 'string', 'Application version', TRUE),
(UUID(), 'maintenance_mode', 'false', 'boolean', 'Maintenance mode status', TRUE),
(UUID(), 'booking_expiry_minutes', '15', 'number', 'Booking expiry time in minutes', FALSE),
(UUID(), 'max_seats_per_booking', '8', 'number', 'Maximum seats per booking', TRUE),
(UUID(), 'default_currency', 'RWF', 'string', 'Default currency', TRUE),
(UUID(), 'enable_blockchain_wallet', 'true', 'boolean', 'Enable blockchain wallet system', FALSE),
(UUID(), 'enable_mobile_money', 'true', 'boolean', 'Enable mobile money payments', FALSE);

-- Create admin user
INSERT INTO users (id, email, password, name, phone, role, is_verified, is_active) VALUES
(UUID(), 'admin@gobus.rw', '$2b$14$8K1p/a0dqbVXiVXnfO45aOEd30OFjqrtgdHaHxiDgHm4JqL8owEWW', 'System Administrator', '+250788000000', 'admin', TRUE, TRUE);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Additional composite indexes for common queries
CREATE INDEX idx_bookings_user_status ON bookings(user_id, status);
CREATE INDEX idx_bookings_trip_status ON bookings(trip_id, status);
CREATE INDEX idx_trips_company_departure ON trips(company_id, departure_time);
CREATE INDEX idx_trips_route_departure ON trips(route_id, departure_time);
CREATE INDEX idx_blockchain_transactions_wallet_type ON blockchain_transactions(from_wallet, transaction_type);
CREATE INDEX idx_tickets_company_status ON tickets(company_id, status);
CREATE INDEX idx_reviews_company_rating ON reviews(company_id, rating);
CREATE INDEX idx_notifications_user_read ON notifications(user_id, is_read);

-- =====================================================
-- TRIGGERS FOR AUTOMATION
-- =====================================================

-- Update trip available seats when booking is created/updated
DELIMITER //
CREATE TRIGGER update_trip_seats_after_booking 
AFTER INSERT ON bookings 
FOR EACH ROW 
BEGIN
    IF NEW.status = 'confirmed' THEN
        UPDATE trips 
        SET available_seats = available_seats - NEW.passenger_count 
        WHERE id = NEW.trip_id;
    END IF;
END//

CREATE TRIGGER update_trip_seats_after_booking_update 
AFTER UPDATE ON bookings 
FOR EACH ROW 
BEGIN
    IF OLD.status != NEW.status THEN
        IF NEW.status = 'confirmed' AND OLD.status != 'confirmed' THEN
            UPDATE trips 
            SET available_seats = available_seats - NEW.passenger_count 
            WHERE id = NEW.trip_id;
        ELSEIF OLD.status = 'confirmed' AND NEW.status != 'confirmed' THEN
            UPDATE trips 
            SET available_seats = available_seats + NEW.passenger_count 
            WHERE id = NEW.trip_id;
        END IF;
    END IF;
END//

-- Update driver total trips when trip is completed
CREATE TRIGGER update_driver_stats_after_trip 
AFTER UPDATE ON trips 
FOR EACH ROW 
BEGIN
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        UPDATE drivers 
        SET total_trips = total_trips + 1 
        WHERE user_id = NEW.driver_id;
    END IF;
END//

DELIMITER ;

-- =====================================================
-- VIEWS FOR COMMON QUERIES
-- =====================================================

-- Active trips view
CREATE VIEW active_trips AS
SELECT 
    t.*,
    r.name as route_name,
    r.origin,
    r.destination,
    b.plate_number,
    b.model as bus_model,
    u.name as driver_name,
    c.name as company_name
FROM trips t
JOIN routes r ON t.route_id = r.id
JOIN buses b ON t.bus_id = b.id
JOIN users u ON t.driver_id = u.id
JOIN companies c ON t.company_id = c.id
WHERE t.status IN ('scheduled', 'boarding', 'in_progress');

-- Company dashboard view
CREATE VIEW company_dashboard AS
SELECT 
    c.id,
    c.name,
    c.status,
    COUNT(DISTINCT u.id) as total_users,
    COUNT(DISTINCT b.id) as total_buses,
    COUNT(DISTINCT r.id) as total_routes,
    COUNT(DISTINCT t.id) as total_trips,
    COUNT(DISTINCT bk.id) as total_bookings,
    SUM(CASE WHEN bk.status = 'confirmed' THEN bk.total_amount ELSE 0 END) as total_revenue,
    AVG(rev.rating) as average_rating
FROM companies c
LEFT JOIN users u ON c.id = u.company_id
LEFT JOIN buses b ON c.id = b.company_id
LEFT JOIN routes r ON c.id = r.company_id
LEFT JOIN trips t ON c.id = t.company_id
LEFT JOIN bookings bk ON c.id = bk.company_id
LEFT JOIN reviews rev ON c.id = rev.company_id
GROUP BY c.id;

-- User booking history view
CREATE VIEW user_booking_history AS
SELECT 
    bk.*,
    t.departure_time,
    t.arrival_time,
    r.origin,
    r.destination,
    c.name as company_name,
    b.plate_number,
    u_driver.name as driver_name
FROM bookings bk
JOIN trips t ON bk.trip_id = t.id
JOIN routes r ON t.route_id = r.id
JOIN companies c ON bk.company_id = c.id
JOIN buses b ON t.bus_id = b.id
JOIN users u_driver ON t.driver_id = u_driver.id;

COMMIT;

-- =====================================================
-- END OF SCHEMA
-- =====================================================