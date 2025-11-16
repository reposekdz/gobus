-- GoBus Production Database Schema
-- Enhanced with all features for robust production deployment

SET FOREIGN_KEY_CHECKS = 0;

-- Drop existing tables if they exist
DROP TABLE IF EXISTS `reviews`;
DROP TABLE IF EXISTS `notifications`;
DROP TABLE IF EXISTS `price_alerts`;
DROP TABLE IF EXISTS `loyalty_points`;
DROP TABLE IF EXISTS `wallet_transactions`;
DROP TABLE IF EXISTS `wallets`;
DROP TABLE IF EXISTS `bookings`;
DROP TABLE IF EXISTS `boarding_passes`;
DROP TABLE IF EXISTS `trips`;
DROP TABLE IF EXISTS `routes`;
DROP TABLE IF EXISTS `buses`;
DROP TABLE IF EXISTS `drivers`;
DROP TABLE IF EXISTS `agents`;
DROP TABLE IF EXISTS `companies`;
DROP TABLE IF EXISTS `cities`;
DROP TABLE IF EXISTS `provinces`;
DROP TABLE IF EXISTS `users`;
DROP TABLE IF EXISTS `settings`;
DROP TABLE IF EXISTS `advertisements`;
DROP TABLE IF EXISTS `messages`;
DROP TABLE IF EXISTS `lost_and_found`;
DROP TABLE IF EXISTS `packages`;
DROP TABLE IF EXISTS `charters`;
DROP TABLE IF EXISTS `destinations`;

-- Enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- Provinces table
CREATE TABLE `provinces` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `code` varchar(10) NOT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_provinces_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Cities table
CREATE TABLE `cities` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `province_id` int NOT NULL,
  `latitude` decimal(10,8) DEFAULT NULL,
  `longitude` decimal(11,8) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_cities_province` (`province_id`),
  CONSTRAINT `fk_cities_province` FOREIGN KEY (`province_id`) REFERENCES `provinces` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Users table (enhanced)
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) UNIQUE DEFAULT NULL,
  `phone_number` varchar(20) UNIQUE DEFAULT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('passenger','driver','company','agent','admin') NOT NULL DEFAULT 'passenger',
  `serial_code` varchar(20) UNIQUE NOT NULL,
  `profile_picture` text DEFAULT NULL,
  `address` text DEFAULT NULL,
  `date_of_birth` date DEFAULT NULL,
  `gender` enum('male','female','other') DEFAULT NULL,
  `is_verified` tinyint(1) DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `last_login` timestamp NULL DEFAULT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `phone_verified_at` timestamp NULL DEFAULT NULL,
  `two_factor_enabled` tinyint(1) DEFAULT '0',
  `two_factor_secret` varchar(255) DEFAULT NULL,
  `language_preference` varchar(5) DEFAULT 'EN',
  `timezone` varchar(50) DEFAULT 'Africa/Kigali',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_users_email` (`email`),
  KEY `idx_users_phone` (`phone_number`),
  KEY `idx_users_serial` (`serial_code`),
  KEY `idx_users_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Companies table (enhanced)
CREATE TABLE `companies` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `logo` text DEFAULT NULL,
  `cover_image` text DEFAULT NULL,
  `license_number` varchar(100) UNIQUE NOT NULL,
  `tax_number` varchar(100) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `city_id` int DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `website` varchar(255) DEFAULT NULL,
  `established_year` year DEFAULT NULL,
  `fleet_size` int DEFAULT '0',
  `rating` decimal(3,2) DEFAULT '0.00',
  `total_reviews` int DEFAULT '0',
  `is_verified` tinyint(1) DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `commission_rate` decimal(5,2) DEFAULT '10.00',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_companies_license` (`license_number`),
  KEY `fk_companies_user` (`user_id`),
  KEY `fk_companies_city` (`city_id`),
  CONSTRAINT `fk_companies_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_companies_city` FOREIGN KEY (`city_id`) REFERENCES `cities` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Agents table (enhanced)
CREATE TABLE `agents` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `agent_code` varchar(20) UNIQUE NOT NULL,
  `commission_rate` decimal(5,2) DEFAULT '5.00',
  `total_transactions` int DEFAULT '0',
  `total_commission` decimal(15,2) DEFAULT '0.00',
  `status` enum('active','inactive','suspended') DEFAULT 'active',
  `location` varchar(255) DEFAULT NULL,
  `supervisor_id` int DEFAULT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_agents_code` (`agent_code`),
  KEY `fk_agents_user` (`user_id`),
  KEY `fk_agents_supervisor` (`supervisor_id`),
  CONSTRAINT `fk_agents_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_agents_supervisor` FOREIGN KEY (`supervisor_id`) REFERENCES `agents` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Drivers table (enhanced)
CREATE TABLE `drivers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `company_id` int NOT NULL,
  `license_number` varchar(100) UNIQUE NOT NULL,
  `license_expiry` date NOT NULL,
  `license_class` varchar(10) DEFAULT 'D',
  `experience_years` int DEFAULT '0',
  `emergency_contact_name` varchar(255) DEFAULT NULL,
  `emergency_contact_phone` varchar(20) DEFAULT NULL,
  `status` enum('active','inactive','suspended','on_leave') DEFAULT 'active',
  `rating` decimal(3,2) DEFAULT '0.00',
  `total_trips` int DEFAULT '0',
  `total_reviews` int DEFAULT '0',
  `total_distance` decimal(10,2) DEFAULT '0.00',
  `current_location_lat` decimal(10,8) DEFAULT NULL,
  `current_location_lng` decimal(11,8) DEFAULT NULL,
  `last_location_update` timestamp NULL DEFAULT NULL,
  `medical_certificate_expiry` date DEFAULT NULL,
  `background_check_date` date DEFAULT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_drivers_license` (`license_number`),
  KEY `fk_drivers_user` (`user_id`),
  KEY `fk_drivers_company` (`company_id`),
  KEY `idx_drivers_status` (`status`),
  CONSTRAINT `fk_drivers_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_drivers_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Buses table (enhanced)
CREATE TABLE `buses` (
  `id` int NOT NULL AUTO_INCREMENT,
  `company_id` int NOT NULL,
  `plate_number` varchar(20) UNIQUE NOT NULL,
  `model` varchar(100) NOT NULL,
  `manufacturer` varchar(100) DEFAULT NULL,
  `year` year DEFAULT NULL,
  `capacity` int NOT NULL,
  `bus_type` enum('standard','luxury','vip','sleeper') DEFAULT 'standard',
  `amenities` json DEFAULT NULL,
  `status` enum('active','maintenance','retired','out_of_service') DEFAULT 'active',
  `last_maintenance` date DEFAULT NULL,
  `next_maintenance` date DEFAULT NULL,
  `insurance_expiry` date DEFAULT NULL,
  `inspection_expiry` date DEFAULT NULL,
  `fuel_type` enum('diesel','petrol','electric','hybrid') DEFAULT 'diesel',
  `gps_device_id` varchar(100) DEFAULT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_buses_plate` (`plate_number`),
  KEY `fk_buses_company` (`company_id`),
  KEY `idx_buses_status` (`status`),
  CONSTRAINT `fk_buses_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Routes table (enhanced)
CREATE TABLE `routes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `company_id` int NOT NULL,
  `from_city_id` int NOT NULL,
  `to_city_id` int NOT NULL,
  `distance` decimal(8,2) NOT NULL,
  `duration` varchar(20) NOT NULL,
  `base_price` decimal(10,2) NOT NULL,
  `route_code` varchar(20) DEFAULT NULL,
  `waypoints` json DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_routes_company` (`company_id`),
  KEY `fk_routes_from_city` (`from_city_id`),
  KEY `fk_routes_to_city` (`to_city_id`),
  KEY `idx_routes_active` (`is_active`),
  CONSTRAINT `fk_routes_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_routes_from_city` FOREIGN KEY (`from_city_id`) REFERENCES `cities` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_routes_to_city` FOREIGN KEY (`to_city_id`) REFERENCES `cities` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Trips table (enhanced)
CREATE TABLE `trips` (
  `id` int NOT NULL AUTO_INCREMENT,
  `route_id` int NOT NULL,
  `bus_id` int NOT NULL,
  `driver_id` int DEFAULT NULL,
  `trip_code` varchar(20) UNIQUE NOT NULL,
  `departure_date` date NOT NULL,
  `departure_time` time NOT NULL,
  `arrival_time` time NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `total_seats` int NOT NULL,
  `available_seats` int NOT NULL,
  `status` enum('scheduled','boarding','in_progress','completed','cancelled','delayed') DEFAULT 'scheduled',
  `actual_departure` timestamp NULL DEFAULT NULL,
  `actual_arrival` timestamp NULL DEFAULT NULL,
  `delay_reason` text DEFAULT NULL,
  `cancellation_reason` text DEFAULT NULL,
  `weather_conditions` varchar(100) DEFAULT NULL,
  `fuel_consumed` decimal(8,2) DEFAULT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_trips_code` (`trip_code`),
  KEY `fk_trips_route` (`route_id`),
  KEY `fk_trips_bus` (`bus_id`),
  KEY `fk_trips_driver` (`driver_id`),
  KEY `idx_trips_date` (`departure_date`),
  KEY `idx_trips_status` (`status`),
  CONSTRAINT `fk_trips_route` FOREIGN KEY (`route_id`) REFERENCES `routes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_trips_bus` FOREIGN KEY (`bus_id`) REFERENCES `buses` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_trips_driver` FOREIGN KEY (`driver_id`) REFERENCES `drivers` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Wallets table (enhanced)
CREATE TABLE `wallets` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `balance` decimal(15,2) DEFAULT '0.00',
  `currency` varchar(3) DEFAULT 'RWF',
  `pin_hash` varchar(255) DEFAULT NULL,
  `is_locked` tinyint(1) DEFAULT '0',
  `daily_limit` decimal(15,2) DEFAULT '100000.00',
  `monthly_limit` decimal(15,2) DEFAULT '1000000.00',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_wallets_user` (`user_id`),
  CONSTRAINT `fk_wallets_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bookings table (enhanced)
CREATE TABLE `bookings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `trip_id` int NOT NULL,
  `agent_id` int DEFAULT NULL,
  `booking_reference` varchar(20) UNIQUE NOT NULL,
  `passenger_name` varchar(255) NOT NULL,
  `passenger_phone` varchar(20) NOT NULL,
  `passenger_email` varchar(255) DEFAULT NULL,
  `seat_numbers` json NOT NULL,
  `total_amount` decimal(10,2) NOT NULL,
  `discount_amount` decimal(10,2) DEFAULT '0.00',
  `commission_amount` decimal(10,2) DEFAULT '0.00',
  `payment_method` enum('wallet','mobile_money','card','cash','agent') NOT NULL,
  `payment_status` enum('pending','completed','failed','refunded') DEFAULT 'pending',
  `payment_reference` varchar(100) DEFAULT NULL,
  `status` enum('confirmed','cancelled','completed','no_show') DEFAULT 'confirmed',
  `booking_source` enum('web','mobile','agent','admin') DEFAULT 'web',
  `special_requests` text DEFAULT NULL,
  `cancellation_reason` text DEFAULT NULL,
  `cancelled_at` timestamp NULL DEFAULT NULL,
  `checked_in_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_bookings_reference` (`booking_reference`),
  KEY `fk_bookings_user` (`user_id`),
  KEY `fk_bookings_trip` (`trip_id`),
  KEY `fk_bookings_agent` (`agent_id`),
  KEY `idx_bookings_status` (`status`),
  KEY `idx_bookings_payment_status` (`payment_status`),
  CONSTRAINT `fk_bookings_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_bookings_trip` FOREIGN KEY (`trip_id`) REFERENCES `trips` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_bookings_agent` FOREIGN KEY (`agent_id`) REFERENCES `agents` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Wallet Transactions table (enhanced)
CREATE TABLE `wallet_transactions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `wallet_id` int NOT NULL,
  `transaction_type` enum('credit','debit') NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `balance_before` decimal(15,2) NOT NULL,
  `balance_after` decimal(15,2) NOT NULL,
  `description` varchar(255) NOT NULL,
  `reference` varchar(100) DEFAULT NULL,
  `related_booking_id` int DEFAULT NULL,
  `payment_method` varchar(50) DEFAULT NULL,
  `external_reference` varchar(100) DEFAULT NULL,
  `status` enum('pending','completed','failed','reversed') DEFAULT 'completed',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_wallet_transactions_wallet` (`wallet_id`),
  KEY `fk_wallet_transactions_booking` (`related_booking_id`),
  KEY `idx_wallet_transactions_type` (`transaction_type`),
  KEY `idx_wallet_transactions_status` (`status`),
  CONSTRAINT `fk_wallet_transactions_wallet` FOREIGN KEY (`wallet_id`) REFERENCES `wallets` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_wallet_transactions_booking` FOREIGN KEY (`related_booking_id`) REFERENCES `bookings` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Reviews table (enhanced)
CREATE TABLE `reviews` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `booking_id` int NOT NULL,
  `driver_id` int DEFAULT NULL,
  `company_id` int DEFAULT NULL,
  `trip_id` int DEFAULT NULL,
  `rating` tinyint NOT NULL CHECK (`rating` >= 1 AND `rating` <= 5),
  `comment` text DEFAULT NULL,
  `aspects` json DEFAULT NULL,
  `is_verified` tinyint(1) DEFAULT '0',
  `is_anonymous` tinyint(1) DEFAULT '0',
  `helpful_count` int DEFAULT '0',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_reviews_user` (`user_id`),
  KEY `fk_reviews_booking` (`booking_id`),
  KEY `fk_reviews_driver` (`driver_id`),
  KEY `fk_reviews_company` (`company_id`),
  KEY `fk_reviews_trip` (`trip_id`),
  KEY `idx_reviews_rating` (`rating`),
  CONSTRAINT `fk_reviews_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_reviews_booking` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_reviews_driver` FOREIGN KEY (`driver_id`) REFERENCES `drivers` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_reviews_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_reviews_trip` FOREIGN KEY (`trip_id`) REFERENCES `trips` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Notifications table
CREATE TABLE `notifications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `type` enum('info','success','warning','error','booking','payment','trip','system') DEFAULT 'info',
  `data` json DEFAULT NULL,
  `is_read` tinyint(1) DEFAULT '0',
  `read_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_notifications_user` (`user_id`),
  KEY `idx_notifications_read` (`is_read`),
  KEY `idx_notifications_type` (`type`),
  CONSTRAINT `fk_notifications_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Price Alerts table
CREATE TABLE `price_alerts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `from_city_id` int NOT NULL,
  `to_city_id` int NOT NULL,
  `target_price` decimal(10,2) NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `last_checked` timestamp NULL DEFAULT NULL,
  `triggered_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_price_alerts_user` (`user_id`),
  KEY `fk_price_alerts_from_city` (`from_city_id`),
  KEY `fk_price_alerts_to_city` (`to_city_id`),
  CONSTRAINT `fk_price_alerts_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_price_alerts_from_city` FOREIGN KEY (`from_city_id`) REFERENCES `cities` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_price_alerts_to_city` FOREIGN KEY (`to_city_id`) REFERENCES `cities` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Loyalty Points table
CREATE TABLE `loyalty_points` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `points` int NOT NULL,
  `transaction_type` enum('earned','redeemed','expired','bonus') NOT NULL,
  `description` varchar(255) NOT NULL,
  `related_booking_id` int DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_loyalty_points_user` (`user_id`),
  KEY `fk_loyalty_points_booking` (`related_booking_id`),
  CONSTRAINT `fk_loyalty_points_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_loyalty_points_booking` FOREIGN KEY (`related_booking_id`) REFERENCES `bookings` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Settings table
CREATE TABLE `settings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `setting_key` varchar(100) UNIQUE NOT NULL,
  `setting_value` text DEFAULT NULL,
  `setting_type` enum('string','number','boolean','json') DEFAULT 'string',
  `description` text DEFAULT NULL,
  `is_public` tinyint(1) DEFAULT '0',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_settings_key` (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Additional service tables
CREATE TABLE `lost_and_found` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `trip_id` int DEFAULT NULL,
  `item_type` varchar(100) NOT NULL,
  `description` text NOT NULL,
  `location_found` varchar(255) DEFAULT NULL,
  `contact_info` varchar(255) DEFAULT NULL,
  `status` enum('reported','found','claimed','closed') DEFAULT 'reported',
  `images` json DEFAULT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_lost_and_found_user` (`user_id`),
  KEY `fk_lost_and_found_trip` (`trip_id`),
  CONSTRAINT `fk_lost_and_found_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_lost_and_found_trip` FOREIGN KEY (`trip_id`) REFERENCES `trips` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `packages` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `tracking_id` varchar(20) UNIQUE NOT NULL,
  `sender_name` varchar(255) NOT NULL,
  `sender_phone` varchar(20) NOT NULL,
  `recipient_name` varchar(255) NOT NULL,
  `recipient_phone` varchar(20) NOT NULL,
  `from_city_id` int NOT NULL,
  `to_city_id` int NOT NULL,
  `package_type` varchar(100) NOT NULL,
  `weight` decimal(8,2) DEFAULT NULL,
  `dimensions` varchar(100) DEFAULT NULL,
  `declared_value` decimal(10,2) DEFAULT NULL,
  `delivery_fee` decimal(10,2) NOT NULL,
  `status` enum('pending','picked_up','in_transit','delivered','cancelled') DEFAULT 'pending',
  `special_instructions` text DEFAULT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_packages_tracking` (`tracking_id`),
  KEY `fk_packages_user` (`user_id`),
  KEY `fk_packages_from_city` (`from_city_id`),
  KEY `fk_packages_to_city` (`to_city_id`),
  CONSTRAINT `fk_packages_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_packages_from_city` FOREIGN KEY (`from_city_id`) REFERENCES `cities` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_packages_to_city` FOREIGN KEY (`to_city_id`) REFERENCES `cities` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `charters` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `company_id` int DEFAULT NULL,
  `charter_type` enum('full_bus','partial','luxury') NOT NULL,
  `from_location` varchar(255) NOT NULL,
  `to_location` varchar(255) NOT NULL,
  `departure_date` date NOT NULL,
  `return_date` date DEFAULT NULL,
  `passenger_count` int NOT NULL,
  `special_requirements` text DEFAULT NULL,
  `estimated_cost` decimal(10,2) DEFAULT NULL,
  `final_cost` decimal(10,2) DEFAULT NULL,
  `status` enum('requested','quoted','confirmed','completed','cancelled') DEFAULT 'requested',
  `notes` text DEFAULT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_charters_user` (`user_id`),
  KEY `fk_charters_company` (`company_id`),
  CONSTRAINT `fk_charters_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_charters_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert initial data
INSERT INTO `provinces` (`name`, `code`) VALUES
('Kigali City', 'KGL'),
('Eastern Province', 'EST'),
('Northern Province', 'NTH'),
('Southern Province', 'STH'),
('Western Province', 'WST');

INSERT INTO `cities` (`name`, `province_id`, `latitude`, `longitude`) VALUES
('Kigali', 1, -1.9441, 30.0619),
('Musanze', 3, -1.4991, 29.6357),
('Huye', 4, -2.5967, 29.7394),
('Rubavu', 5, -1.6792, 29.2667),
('Rusizi', 5, -2.4667, 28.9000),
('Rwamagana', 2, -1.9489, 30.4348),
('Nyagatare', 2, -1.2928, 30.3256),
('Muhanga', 4, -2.0853, 29.7559),
('Kayonza', 2, -1.8833, 30.6167),
('Kibungo', 2, -2.2167, 30.5333);

INSERT INTO `settings` (`setting_key`, `setting_value`, `setting_type`, `description`, `is_public`) VALUES
('app_name', 'GoBus Rwanda', 'string', 'Application name', 1),
('app_version', '1.0.0', 'string', 'Application version', 1),
('maintenance_mode', 'false', 'boolean', 'Maintenance mode status', 0),
('booking_advance_days', '90', 'number', 'Maximum days in advance for booking', 1),
('cancellation_hours', '24', 'number', 'Hours before departure for free cancellation', 1),
('loyalty_points_rate', '1', 'number', 'Points earned per 100 RWF spent', 1),
('hero_image', 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?q=80&w=2048&auto=format&fit=crop', 'string', 'Hero section background image', 1),
('support_email', 'support@gobus.rw', 'string', 'Support email address', 1),
('support_phone', '+250788123456', 'string', 'Support phone number', 1);

-- Create indexes for better performance
CREATE INDEX idx_bookings_created_at ON bookings(created_at);
CREATE INDEX idx_trips_departure_date_time ON trips(departure_date, departure_time);
CREATE INDEX idx_wallet_transactions_created_at ON wallet_transactions(created_at);
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_companies_rating ON companies(rating);
CREATE INDEX idx_drivers_rating ON drivers(rating);

-- Create admin user
INSERT INTO `users` (`name`, `email`, `password_hash`, `role`, `serial_code`, `is_verified`, `is_active`) VALUES
('System Administrator', 'admin@gobus.rw', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 'ADM001', 1, 1);

-- Create wallet for admin
INSERT INTO `wallets` (`user_id`, `balance`) VALUES (1, 0.00);

-- Blockchain transactions table
CREATE TABLE `blockchain_transactions` (
  `id` varchar(36) NOT NULL,
  `from_address` varchar(100) NOT NULL,
  `to_address` varchar(100) NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `type` enum('transfer','deposit','withdrawal','payment') NOT NULL,
  `timestamp` bigint NOT NULL,
  `hash` varchar(64) NOT NULL,
  `previous_hash` varchar(64) NOT NULL,
  `nonce` int NOT NULL,
  `related_id` int DEFAULT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_blockchain_hash` (`hash`),
  KEY `idx_blockchain_addresses` (`from_address`, `to_address`),
  KEY `idx_blockchain_timestamp` (`timestamp`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Payments table for mobile money
CREATE TABLE `payments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `booking_id` int NOT NULL,
  `provider` enum('mtn','airtel','stripe','wallet') NOT NULL,
  `phone_number` varchar(20) DEFAULT NULL,
  `amount` decimal(10,2) NOT NULL,
  `external_id` varchar(100) NOT NULL,
  `reference_id` varchar(100) DEFAULT NULL,
  `status` enum('pending','completed','failed','cancelled') DEFAULT 'pending',
  `provider_response` json DEFAULT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_payments_booking` (`booking_id`),
  KEY `idx_payments_status` (`status`),
  KEY `idx_payments_provider` (`provider`),
  CONSTRAINT `fk_payments_booking` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Push notification subscriptions
CREATE TABLE `push_subscriptions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `endpoint` text NOT NULL,
  `p256dh_key` text NOT NULL,
  `auth_key` text NOT NULL,
  `user_agent` text DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_push_subscriptions_user` (`user_id`),
  CONSTRAINT `fk_push_subscriptions_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add assigned_driver_id to buses table
ALTER TABLE `buses` ADD COLUMN `assigned_driver_id` int DEFAULT NULL AFTER `gps_device_id`;
ALTER TABLE `buses` ADD KEY `fk_buses_assigned_driver` (`assigned_driver_id`);
ALTER TABLE `buses` ADD CONSTRAINT `fk_buses_assigned_driver` FOREIGN KEY (`assigned_driver_id`) REFERENCES `drivers` (`id`) ON DELETE SET NULL;