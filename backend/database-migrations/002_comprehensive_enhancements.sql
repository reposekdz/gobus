-- =====================================================
-- COMPREHENSIVE SYSTEM ENHANCEMENTS MIGRATION
-- =====================================================
-- This migration adds all required features:
-- - Passenger wallet PIN protection
-- - Enhanced serial codes (3 capital letters + 4 unique numbers)
-- - Company-car-driver assignment by routes/stations
-- - Bus stations management
-- - Company gallery enhancements
-- - Enhanced withdrawal system with 3% admin fee
-- - Agent deposit system with 1.5% company fee
-- - Passenger-to-passenger transfers
-- =====================================================

SET FOREIGN_KEY_CHECKS = 0;

-- Add phone_verifications table for OTP if not exists
CREATE TABLE IF NOT EXISTS `phone_verifications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `phone_number` varchar(20) NOT NULL,
  `otp_code` varchar(6) NOT NULL,
  `verified` tinyint(1) DEFAULT '0',
  `verified_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NOT NULL,
  `attempts` int DEFAULT '0',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_phone_verifications_phone` (`phone_number`),
  KEY `idx_phone_verifications_expires` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Enhance wallets table for PIN protection
ALTER TABLE `wallets` 
  ADD COLUMN IF NOT EXISTS `pin_set` tinyint(1) DEFAULT '0',
  ADD COLUMN IF NOT EXISTS `pin_hash` varchar(255) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `failed_pin_attempts` int DEFAULT '0',
  ADD COLUMN IF NOT EXISTS `pin_locked_until` timestamp NULL DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `can_deposit` tinyint(1) DEFAULT '0' COMMENT 'Passengers cannot deposit, only platform/agents can',
  ADD COLUMN IF NOT EXISTS `total_deposits` decimal(15,2) DEFAULT '0.00',
  ADD COLUMN IF NOT EXISTS `total_withdrawals` decimal(15,2) DEFAULT '0.00',
  ADD COLUMN IF NOT EXISTS `last_transaction_at` timestamp NULL DEFAULT NULL;

-- Enhance users table for serial code validation
ALTER TABLE `users`
  MODIFY COLUMN `serial_code` varchar(20) UNIQUE NOT NULL COMMENT 'Format: 3 capital letters + 4 unique numbers',
  ADD COLUMN IF NOT EXISTS `otp_verified_at` timestamp NULL DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `wallet_setup_completed` tinyint(1) DEFAULT '0';

-- Add bus_stations table
CREATE TABLE IF NOT EXISTS `bus_stations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `name_rw` varchar(255) DEFAULT NULL,
  `name_fr` varchar(255) DEFAULT NULL,
  `city_id` int DEFAULT NULL,
  `address` text,
  `latitude` decimal(10,8) DEFAULT NULL,
  `longitude` decimal(11,8) DEFAULT NULL,
  `facilities` json DEFAULT NULL,
  `operating_hours` varchar(50) DEFAULT NULL,
  `phone_number` varchar(20) DEFAULT NULL,
  `is_main_station` tinyint(1) DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_bus_stations_city` (`city_id`),
  KEY `idx_bus_stations_active` (`is_active`),
  CONSTRAINT `fk_bus_stations_city` FOREIGN KEY (`city_id`) REFERENCES `cities` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add route_bus_stations junction table
CREATE TABLE IF NOT EXISTS `route_bus_stations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `route_id` int NOT NULL,
  `bus_station_id` int NOT NULL,
  `stop_order` int NOT NULL,
  `is_origin` tinyint(1) DEFAULT '0',
  `is_destination` tinyint(1) DEFAULT '0',
  `arrival_time_offset` int DEFAULT '0' COMMENT 'Minutes from route start',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_route_station_order` (`route_id`, `stop_order`),
  KEY `fk_route_bus_stations_route` (`route_id`),
  KEY `fk_route_bus_stations_station` (`bus_station_id`),
  CONSTRAINT `fk_route_bus_stations_route` FOREIGN KEY (`route_id`) REFERENCES `routes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_route_bus_stations_station` FOREIGN KEY (`bus_station_id`) REFERENCES `bus_stations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Enhance company_wallets with admin fee tracking
ALTER TABLE `company_wallets`
  ADD COLUMN IF NOT EXISTS `total_admin_fees` decimal(15,2) DEFAULT '0.00',
  ADD COLUMN IF NOT EXISTS `admin_fee_rate` decimal(5,2) DEFAULT '3.00' COMMENT '3% admin fee on withdrawals';

-- Add admin_fees table for tracking admin fees from company withdrawals
CREATE TABLE IF NOT EXISTS `admin_fees` (
  `id` int NOT NULL AUTO_INCREMENT,
  `withdrawal_request_id` int NOT NULL,
  `company_id` int NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `fee_rate` decimal(5,2) DEFAULT '3.00',
  `status` enum('pending','collected') DEFAULT 'pending',
  `collected_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_admin_fees_withdrawal` (`withdrawal_request_id`),
  KEY `fk_admin_fees_company` (`company_id`),
  KEY `idx_admin_fees_status` (`status`),
  CONSTRAINT `fk_admin_fees_withdrawal` FOREIGN KEY (`withdrawal_request_id`) REFERENCES `withdrawal_requests` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_admin_fees_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Enhance company_gallery table if it exists, otherwise create
CREATE TABLE IF NOT EXISTS `company_gallery` (
  `id` int NOT NULL AUTO_INCREMENT,
  `company_id` int NOT NULL,
  `image_url` text NOT NULL,
  `image_type` enum('bus','station','office','team','other') DEFAULT 'other',
  `title` varchar(255) DEFAULT NULL,
  `description` text,
  `display_order` int DEFAULT '0',
  `is_featured` tinyint(1) DEFAULT '0',
  `uploaded_by` int DEFAULT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_company_gallery_company` (`company_id`),
  KEY `fk_company_gallery_uploader` (`uploaded_by`),
  KEY `idx_company_gallery_featured` (`is_featured`),
  KEY `idx_company_gallery_order` (`display_order`),
  CONSTRAINT `fk_company_gallery_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_company_gallery_uploader` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add bus_driver_assignments table for route-based assignments
CREATE TABLE IF NOT EXISTS `bus_driver_assignments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `company_id` int NOT NULL,
  `bus_id` int NOT NULL,
  `driver_id` int NOT NULL,
  `route_id` int DEFAULT NULL,
  `bus_station_id` int DEFAULT NULL,
  `assignment_type` enum('route','station','general') DEFAULT 'general',
  `start_date` date NOT NULL,
  `end_date` date DEFAULT NULL,
  `status` enum('active','completed','cancelled') DEFAULT 'active',
  `assigned_by` int NOT NULL,
  `notes` text,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_bus_driver_assignments_company` (`company_id`),
  KEY `fk_bus_driver_assignments_bus` (`bus_id`),
  KEY `fk_bus_driver_assignments_driver` (`driver_id`),
  KEY `fk_bus_driver_assignments_route` (`route_id`),
  KEY `fk_bus_driver_assignments_station` (`bus_station_id`),
  KEY `fk_bus_driver_assignments_assigner` (`assigned_by`),
  KEY `idx_bus_driver_assignments_status` (`status`),
  CONSTRAINT `fk_bus_driver_assignments_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_bus_driver_assignments_bus` FOREIGN KEY (`bus_id`) REFERENCES `buses` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_bus_driver_assignments_driver` FOREIGN KEY (`driver_id`) REFERENCES `drivers` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_bus_driver_assignments_route` FOREIGN KEY (`route_id`) REFERENCES `routes` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_bus_driver_assignments_station` FOREIGN KEY (`bus_station_id`) REFERENCES `bus_stations` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_bus_driver_assignments_assigner` FOREIGN KEY (`assigned_by`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add driver_trip_passengers view table for driver to see passengers
CREATE TABLE IF NOT EXISTS `driver_passenger_checkins` (
  `id` int NOT NULL AUTO_INCREMENT,
  `trip_id` int NOT NULL,
  `driver_id` int NOT NULL,
  `booking_id` int NOT NULL,
  `passenger_name` varchar(255) NOT NULL,
  `seat_number` varchar(10) NOT NULL,
  `check_in_status` enum('pending','checked_in','no_show','cancelled') DEFAULT 'pending',
  `check_in_time` timestamp NULL DEFAULT NULL,
  `notes` text,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_driver_passenger_booking` (`trip_id`, `booking_id`),
  KEY `fk_driver_passenger_checkins_trip` (`trip_id`),
  KEY `fk_driver_passenger_checkins_driver` (`driver_id`),
  KEY `fk_driver_passenger_checkins_booking` (`booking_id`),
  KEY `idx_driver_passenger_checkins_status` (`check_in_status`),
  CONSTRAINT `fk_driver_passenger_checkins_trip` FOREIGN KEY (`trip_id`) REFERENCES `trips` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_driver_passenger_checkins_driver` FOREIGN KEY (`driver_id`) REFERENCES `drivers` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_driver_passenger_checkins_booking` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add agent_deposits table for tracking agent deposits with fees
CREATE TABLE IF NOT EXISTS `agent_deposits` (
  `id` int NOT NULL AUTO_INCREMENT,
  `agent_id` int NOT NULL,
  `company_id` int NOT NULL,
  `passenger_id` int NOT NULL,
  `passenger_serial_code` varchar(20) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `agent_fee_amount` decimal(10,2) DEFAULT '0.00',
  `agent_fee_rate` decimal(5,2) DEFAULT '1.50' COMMENT '1.5% fee from company',
  `transaction_reference` varchar(100) UNIQUE NOT NULL,
  `status` enum('pending','completed','failed') DEFAULT 'pending',
  `completed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_agent_deposits_reference` (`transaction_reference`),
  KEY `fk_agent_deposits_agent` (`agent_id`),
  KEY `fk_agent_deposits_company` (`company_id`),
  KEY `fk_agent_deposits_passenger` (`passenger_id`),
  KEY `idx_agent_deposits_status` (`status`),
  CONSTRAINT `fk_agent_deposits_agent` FOREIGN KEY (`agent_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_agent_deposits_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_agent_deposits_passenger` FOREIGN KEY (`passenger_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Enhance wallet_transactions table
ALTER TABLE `wallet_transactions`
  ADD COLUMN IF NOT EXISTS `transaction_reference` varchar(100) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `related_user_id` int DEFAULT NULL COMMENT 'For transfers between passengers',
  ADD COLUMN IF NOT EXISTS `serial_code_used` varchar(20) DEFAULT NULL COMMENT 'Serial code used in transfer',
  ADD COLUMN IF NOT EXISTS `fee_amount` decimal(10,2) DEFAULT '0.00',
  ADD COLUMN IF NOT EXISTS `fee_rate` decimal(5,2) DEFAULT '0.00';

-- Add index for better query performance
ALTER TABLE `wallet_transactions`
  ADD INDEX IF NOT EXISTS `idx_wallet_transactions_reference` (`transaction_reference`),
  ADD INDEX IF NOT EXISTS `idx_wallet_transactions_related_user` (`related_user_id`),
  ADD INDEX IF NOT EXISTS `idx_wallet_transactions_serial` (`serial_code_used`);

-- Update serial code format: ensure all existing codes are valid (3 letters + 4 numbers)
-- This is a one-time migration for existing data
UPDATE `users` 
SET `serial_code` = CONCAT(
  UPPER(SUBSTRING(`name`, 1, 3)), 
  LPAD(FLOOR(1000 + RAND() * 9000), 4, '0')
)
WHERE `serial_code` NOT REGEXP '^[A-Z]{3}[0-9]{4}$'
  AND `role` = 'passenger'
  AND LENGTH(`name`) >= 3;

-- Payment tokenization table (PCI-DSS compliant)
CREATE TABLE IF NOT EXISTS `payment_tokens` (
  `id` varchar(36) PRIMARY KEY,
  `token_hash` varchar(64) UNIQUE NOT NULL COMMENT 'SHA-256 hash of token',
  `user_id` int NOT NULL,
  `encrypted_data` text NOT NULL COMMENT 'AES-256-GCM encrypted payment data',
  `iv` varchar(32) NOT NULL COMMENT 'Initialization vector',
  `auth_tag` varchar(32) NOT NULL COMMENT 'Authentication tag',
  `last4` varchar(4) NOT NULL,
  `expiry_month` int DEFAULT NULL,
  `expiry_year` int DEFAULT NULL,
  `card_type` varchar(20) DEFAULT NULL,
  `billing_address` text DEFAULT NULL,
  `expires_at` timestamp NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  INDEX `idx_payment_tokens_user` (`user_id`),
  INDEX `idx_payment_tokens_hash` (`token_hash`),
  INDEX `idx_payment_tokens_active` (`is_active`),
  INDEX `idx_payment_tokens_expires` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Fraud analysis logs
CREATE TABLE IF NOT EXISTS `fraud_analysis_logs` (
  `id` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `user_id` int NOT NULL,
  `transaction_type` enum('payment','transfer','deposit','withdrawal') NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `currency` varchar(3) DEFAULT 'RWF',
  `risk_score` int NOT NULL COMMENT '0-100',
  `risk_level` enum('low','medium','high','critical') NOT NULL,
  `recommended_action` enum('allow','review','block') NOT NULL,
  `indicators_json` json DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `device_id` varchar(100) DEFAULT NULL,
  `location_lat` decimal(10,8) DEFAULT NULL,
  `location_lng` decimal(11,8) DEFAULT NULL,
  `location_city` varchar(100) DEFAULT NULL,
  `location_country` varchar(100) DEFAULT NULL,
  `transaction_id` int DEFAULT NULL,
  `was_blocked` tinyint(1) DEFAULT '0',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  INDEX `idx_fraud_logs_user` (`user_id`),
  INDEX `idx_fraud_logs_risk` (`risk_level`),
  INDEX `idx_fraud_logs_type` (`transaction_type`),
  INDEX `idx_fraud_logs_date` (`created_at`),
  INDEX `idx_fraud_logs_ip` (`ip_address`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Fraud reports table
CREATE TABLE IF NOT EXISTS `fraud_reports` (
  `id` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `reported_user_id` int NOT NULL,
  `reported_user_serial_code` varchar(20) DEFAULT NULL,
  `reported_by_user_id` int NOT NULL,
  `report_type` enum('suspicious_activity','unauthorized_transaction','scam','other') NOT NULL,
  `description` text NOT NULL,
  `transaction_id` int DEFAULT NULL,
  `status` enum('pending','investigating','confirmed','dismissed') DEFAULT 'pending',
  `investigated_by` int DEFAULT NULL,
  `investigation_notes` text DEFAULT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`reported_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`reported_by_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  INDEX `idx_fraud_reports_reported` (`reported_user_id`),
  INDEX `idx_fraud_reports_status` (`status`),
  INDEX `idx_fraud_reports_serial` (`reported_user_serial_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Transaction monitoring logs
CREATE TABLE IF NOT EXISTS `transaction_monitoring_logs` (
  `id` bigint NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `user_id` int DEFAULT NULL,
  `transaction_type` varchar(50) NOT NULL,
  `transaction_id` int DEFAULT NULL,
  `amount` decimal(10,2) DEFAULT NULL,
  `currency` varchar(3) DEFAULT 'RWF',
  `status` enum('pending','processing','completed','failed','blocked') NOT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `device_id` varchar(100) DEFAULT NULL,
  `location_data` json DEFAULT NULL,
  `risk_indicators` json DEFAULT NULL,
  `processing_time_ms` int DEFAULT NULL,
  `error_message` text DEFAULT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_monitoring_user` (`user_id`),
  INDEX `idx_monitoring_type` (`transaction_type`),
  INDEX `idx_monitoring_status` (`status`),
  INDEX `idx_monitoring_date` (`created_at`),
  INDEX `idx_monitoring_ip` (`ip_address`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Rate limiting tracking
CREATE TABLE IF NOT EXISTS `rate_limit_tracking` (
  `id` bigint NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `identifier` varchar(255) NOT NULL COMMENT 'IP, user_id, or API key',
  `endpoint` varchar(255) NOT NULL,
  `request_count` int DEFAULT '1',
  `window_start` timestamp NOT NULL,
  `blocked_until` timestamp NULL DEFAULT NULL,
  `last_request_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_rate_limit_identifier_endpoint` (`identifier`, `endpoint`),
  INDEX `idx_rate_limit_window` (`window_start`),
  INDEX `idx_rate_limit_blocked` (`blocked_until`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Security audit logs
CREATE TABLE IF NOT EXISTS `security_audit_logs` (
  `id` bigint NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `user_id` int DEFAULT NULL,
  `event_type` varchar(100) NOT NULL,
  `event_category` enum('authentication','authorization','transaction','configuration','security') NOT NULL,
  `severity` enum('info','warning','error','critical') DEFAULT 'info',
  `description` text NOT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `request_data` json DEFAULT NULL,
  `response_status` int DEFAULT NULL,
  `affected_resources` json DEFAULT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_audit_user` (`user_id`),
  INDEX `idx_audit_type` (`event_type`),
  INDEX `idx_audit_category` (`event_category`),
  INDEX `idx_audit_severity` (`severity`),
  INDEX `idx_audit_date` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================
-- INITIAL DATA FOR BUS STATIONS (Rwanda)
-- =====================================================
INSERT INTO `bus_stations` (`name`, `name_rw`, `city_id`, `address`, `latitude`, `longitude`, `facilities`, `operating_hours`, `phone_number`, `is_main_station`, `is_active`) VALUES
('Nyabugogo Bus Terminal', 'Sitasiyo ya Bisi ya Nyabugogo', NULL, 'KN 3 Ave, Kigali', -1.9706, 30.0444, '["waiting_area","toilets","food_vendors","atm","parking","ticket_office"]', '05:00 - 22:00', '+250788123456', 1, 1),
('Kimironko Bus Park', 'Parike ya Bisi ya Kimironko', NULL, 'KG 11 Ave, Kigali', -1.9442, 30.1272, '["waiting_area","toilets","food_vendors","market","parking"]', '05:00 - 21:00', '+250788123457', 1, 1),
('Musanze Bus Station', 'Sitasiyo ya Bisi ya Musanze', NULL, 'RN4, Musanze', -1.4992, 29.6342, '["waiting_area","toilets","food_vendors","parking","ticket_office"]', '05:30 - 21:00', '+250788234567', 1, 1)
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- =====================================================
-- END OF MIGRATION
-- =====================================================
