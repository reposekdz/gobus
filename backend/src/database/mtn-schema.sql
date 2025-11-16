-- Add MTN Mobile Money specific columns to transactions table
ALTER TABLE transactions 
ADD COLUMN mtn_reference_id VARCHAR(255) NULL,
ADD COLUMN external_reference VARCHAR(255) NULL,
ADD COLUMN mtn_status VARCHAR(50) NULL DEFAULT 'pending',
ADD COLUMN mtn_error_message TEXT NULL,
ADD COLUMN retry_count INT DEFAULT 0,
ADD INDEX idx_mtn_reference (mtn_reference_id),
ADD INDEX idx_external_reference (external_reference);

-- Create MTN transaction logs table for detailed tracking
CREATE TABLE mtn_transaction_logs (
    id VARCHAR(36) PRIMARY KEY,
    transaction_id VARCHAR(36) NOT NULL,
    mtn_reference_id VARCHAR(255) NOT NULL,
    request_type ENUM('collection', 'disbursement') NOT NULL,
    api_endpoint VARCHAR(255) NOT NULL,
    request_payload JSON NOT NULL,
    response_payload JSON NULL,
    status_code INT NULL,
    error_message TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
    INDEX idx_mtn_ref (mtn_reference_id),
    INDEX idx_transaction (transaction_id),
    INDEX idx_created_at (created_at)
);

-- Create MTN webhook events table for status updates
CREATE TABLE mtn_webhook_events (
    id VARCHAR(36) PRIMARY KEY,
    reference_id VARCHAR(255) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL,
    amount DECIMAL(15,2) NULL,
    currency VARCHAR(3) NULL,
    reason TEXT NULL,
    financial_transaction_id VARCHAR(255) NULL,
    external_id VARCHAR(255) NULL,
    payer_party_id VARCHAR(50) NULL,
    payee_party_id VARCHAR(50) NULL,
    raw_payload JSON NOT NULL,
    processed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_reference (reference_id),
    INDEX idx_status (status),
    INDEX idx_processed (processed),
    INDEX idx_created_at (created_at)
);

-- Create agent commission tracking table
CREATE TABLE agent_commissions (
    id VARCHAR(36) PRIMARY KEY,
    agent_id VARCHAR(36) NOT NULL,
    transaction_id VARCHAR(36) NOT NULL,
    commission_amount DECIMAL(10,2) NOT NULL,
    commission_rate DECIMAL(5,4) NOT NULL,
    transaction_amount DECIMAL(15,2) NOT NULL,
    status ENUM('pending', 'paid', 'cancelled') DEFAULT 'pending',
    paid_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (agent_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
    INDEX idx_agent (agent_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
);

-- Create company revenue tracking table
CREATE TABLE company_revenues (
    id VARCHAR(36) PRIMARY KEY,
    company_id VARCHAR(36) NOT NULL,
    booking_id VARCHAR(36) NOT NULL,
    trip_id VARCHAR(36) NOT NULL,
    gross_amount DECIMAL(15,2) NOT NULL,
    platform_fee DECIMAL(10,2) NOT NULL,
    net_amount DECIMAL(15,2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    payment_status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
    settled_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
    INDEX idx_company (company_id),
    INDEX idx_payment_status (payment_status),
    INDEX idx_created_at (created_at)
);

-- Update users table to support MTN integration
ALTER TABLE users 
ADD COLUMN mtn_phone VARCHAR(20) NULL,
ADD COLUMN mtn_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN agent_commission_rate DECIMAL(5,4) DEFAULT 0.0200,
ADD COLUMN company_settlement_schedule ENUM('daily', 'weekly', 'monthly') DEFAULT 'weekly',
ADD COLUMN last_mtn_verification TIMESTAMP NULL,
ADD INDEX idx_mtn_phone (mtn_phone);

-- Insert sample MTN configuration data
INSERT INTO system_settings (setting_key, setting_value, description) VALUES
('mtn_collection_subscription_key', '8c1c562bfbe241458e3b0bdc4d05d40e', 'MTN Collection API Subscription Key'),
('mtn_collection_api_key', '13b6baa354c044f9a0159b74642b7791', 'MTN Collection API Key'),
('mtn_disbursement_subscription_key', 'a34dd9b3f5b74e729fddf3cf47941795', 'MTN Disbursement API Subscription Key'),
('mtn_disbursement_api_key', '6ff111de84b5464492ce970caf16fa30', 'MTN Disbursement API Key'),
('mtn_api_user_id', 'gobus', 'MTN API User ID'),
('mtn_target_environment', 'sandbox', 'MTN Target Environment'),
('mtn_base_url_collection', 'https://sandbox.momodeveloper.mtn.com/collection', 'MTN Collection Base URL'),
('mtn_base_url_disbursement', 'https://sandbox.momodeveloper.mtn.com/disbursement', 'MTN Disbursement Base URL'),
('platform_fee_percentage', '2.5', 'Platform fee percentage for transactions'),
('agent_commission_rate', '2.0', 'Default agent commission rate percentage'),
('min_deposit_amount', '100', 'Minimum deposit amount in RWF'),
('max_deposit_amount', '1000000', 'Maximum deposit amount in RWF'),
('min_withdrawal_amount', '500', 'Minimum withdrawal amount in RWF'),
('max_withdrawal_amount', '500000', 'Maximum withdrawal amount in RWF');

-- Create system_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS system_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    description TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_setting_key (setting_key)
);