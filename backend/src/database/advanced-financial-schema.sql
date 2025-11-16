-- Advanced financial management schema

-- Company withdrawal schedules
CREATE TABLE company_withdrawal_schedules (
    id VARCHAR(36) PRIMARY KEY,
    company_id VARCHAR(36) NOT NULL,
    frequency ENUM('daily', 'weekly', 'monthly', 'threshold') NOT NULL,
    min_amount DECIMAL(15,2) NOT NULL DEFAULT 10000,
    max_amount DECIMAL(15,2) NOT NULL DEFAULT 1000000,
    method ENUM('mtn', 'bank', 'manual') NOT NULL DEFAULT 'mtn',
    phone_number VARCHAR(20) NULL,
    bank_account VARCHAR(50) NULL,
    enabled BOOLEAN DEFAULT TRUE,
    last_executed TIMESTAMP NULL,
    next_execution TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_company_schedule (company_id),
    INDEX idx_next_execution (next_execution),
    INDEX idx_enabled (enabled)
);

-- Company withdrawal logs for audit trail
CREATE TABLE company_withdrawal_logs (
    id VARCHAR(36) PRIMARY KEY,
    company_id VARCHAR(36) NOT NULL,
    transaction_id VARCHAR(36) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    method ENUM('mtn', 'bank', 'manual', 'bulk') NOT NULL,
    reference_id VARCHAR(255) NULL,
    status ENUM('pending', 'processing', 'completed', 'failed', 'cancelled') NOT NULL,
    initiated_by VARCHAR(36) NULL, -- admin user who initiated bulk withdrawal
    failure_reason TEXT NULL,
    processing_time INT NULL, -- seconds taken to process
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    FOREIGN KEY (company_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
    FOREIGN KEY (initiated_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_company_date (company_id, created_at),
    INDEX idx_status (status),
    INDEX idx_method (method)
);

-- Enhanced transactions table for advanced features
ALTER TABLE transactions 
ADD COLUMN withdrawal_method ENUM('mtn', 'bank', 'manual', 'scheduled') NULL,
ADD COLUMN withdrawal_details JSON NULL,
ADD COLUMN scheduled_at TIMESTAMP NULL,
ADD COLUMN processing_fee DECIMAL(10,2) DEFAULT 0,
ADD COLUMN exchange_rate DECIMAL(10,6) DEFAULT 1.0,
ADD COLUMN original_currency VARCHAR(3) DEFAULT 'RWF',
ADD COLUMN batch_id VARCHAR(36) NULL,
ADD COLUMN priority ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal',
ADD INDEX idx_withdrawal_method (withdrawal_method),
ADD INDEX idx_scheduled_at (scheduled_at),
ADD INDEX idx_batch_id (batch_id),
ADD INDEX idx_priority (priority);

-- Real-time financial metrics cache
CREATE TABLE financial_metrics_cache (
    id VARCHAR(36) PRIMARY KEY,
    company_id VARCHAR(36) NOT NULL,
    metric_type ENUM('daily_revenue', 'weekly_revenue', 'monthly_revenue', 'pending_withdrawals', 'available_balance') NOT NULL,
    metric_value DECIMAL(20,2) NOT NULL,
    calculation_date DATE NOT NULL,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_company_metric_date (company_id, metric_type, calculation_date),
    INDEX idx_company_type (company_id, metric_type),
    INDEX idx_calculation_date (calculation_date)
);

-- Advanced payment processing queue
CREATE TABLE payment_processing_queue (
    id VARCHAR(36) PRIMARY KEY,
    transaction_id VARCHAR(36) NOT NULL,
    queue_type ENUM('withdrawal', 'refund', 'settlement', 'commission') NOT NULL,
    priority ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal',
    scheduled_for TIMESTAMP NOT NULL,
    attempts INT DEFAULT 0,
    max_attempts INT DEFAULT 3,
    status ENUM('queued', 'processing', 'completed', 'failed', 'cancelled') DEFAULT 'queued',
    processor_id VARCHAR(100) NULL, -- which service/worker is processing
    error_message TEXT NULL,
    metadata JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
    INDEX idx_queue_status (queue_type, status),
    INDEX idx_scheduled_for (scheduled_for),
    INDEX idx_priority (priority),
    INDEX idx_processor (processor_id)
);

-- Multi-currency support
CREATE TABLE currency_rates (
    id VARCHAR(36) PRIMARY KEY,
    from_currency VARCHAR(3) NOT NULL,
    to_currency VARCHAR(3) NOT NULL,
    rate DECIMAL(15,8) NOT NULL,
    source VARCHAR(50) NOT NULL, -- API source
    valid_from TIMESTAMP NOT NULL,
    valid_until TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_currency_pair_time (from_currency, to_currency, valid_from),
    INDEX idx_currency_pair (from_currency, to_currency),
    INDEX idx_valid_period (valid_from, valid_until)
);

-- Financial alerts and notifications
CREATE TABLE financial_alerts (
    id VARCHAR(36) PRIMARY KEY,
    company_id VARCHAR(36) NOT NULL,
    alert_type ENUM('low_balance', 'high_withdrawal', 'failed_transaction', 'revenue_milestone', 'suspicious_activity') NOT NULL,
    threshold_value DECIMAL(15,2) NULL,
    current_value DECIMAL(15,2) NULL,
    message TEXT NOT NULL,
    severity ENUM('info', 'warning', 'critical') DEFAULT 'info',
    status ENUM('active', 'acknowledged', 'resolved') DEFAULT 'active',
    triggered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    acknowledged_at TIMESTAMP NULL,
    acknowledged_by VARCHAR(36) NULL,
    resolved_at TIMESTAMP NULL,
    metadata JSON NULL,
    FOREIGN KEY (company_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (acknowledged_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_company_status (company_id, status),
    INDEX idx_alert_type (alert_type),
    INDEX idx_severity (severity),
    INDEX idx_triggered_at (triggered_at)
);

-- Advanced revenue tracking with detailed breakdown
CREATE TABLE revenue_breakdown (
    id VARCHAR(36) PRIMARY KEY,
    company_revenue_id VARCHAR(36) NOT NULL,
    category ENUM('base_fare', 'distance_fee', 'time_fee', 'surge_pricing', 'booking_fee', 'insurance', 'tax') NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    percentage DECIMAL(5,2) NULL, -- percentage of total fare
    calculation_method VARCHAR(100) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_revenue_id) REFERENCES company_revenues(id) ON DELETE CASCADE,
    INDEX idx_company_revenue (company_revenue_id),
    INDEX idx_category (category)
);

-- Financial reconciliation tracking
CREATE TABLE financial_reconciliation (
    id VARCHAR(36) PRIMARY KEY,
    company_id VARCHAR(36) NOT NULL,
    reconciliation_date DATE NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    expected_revenue DECIMAL(15,2) NOT NULL,
    actual_revenue DECIMAL(15,2) NOT NULL,
    variance DECIMAL(15,2) NOT NULL,
    variance_percentage DECIMAL(5,2) NOT NULL,
    total_withdrawals DECIMAL(15,2) NOT NULL,
    pending_amount DECIMAL(15,2) NOT NULL,
    reconciled_by VARCHAR(36) NOT NULL,
    status ENUM('pending', 'reconciled', 'disputed') DEFAULT 'pending',
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reconciled_by) REFERENCES users(id) ON DELETE RESTRICT,
    UNIQUE KEY unique_company_period (company_id, period_start, period_end),
    INDEX idx_reconciliation_date (reconciliation_date),
    INDEX idx_status (status)
);

-- Automated financial rules engine
CREATE TABLE financial_automation_rules (
    id VARCHAR(36) PRIMARY KEY,
    company_id VARCHAR(36) NOT NULL,
    rule_name VARCHAR(100) NOT NULL,
    rule_type ENUM('auto_withdrawal', 'alert_trigger', 'fee_calculation', 'revenue_split') NOT NULL,
    conditions JSON NOT NULL, -- conditions to trigger the rule
    actions JSON NOT NULL, -- actions to execute
    enabled BOOLEAN DEFAULT TRUE,
    priority INT DEFAULT 100,
    execution_count INT DEFAULT 0,
    last_executed TIMESTAMP NULL,
    created_by VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_company_enabled (company_id, enabled),
    INDEX idx_rule_type (rule_type),
    INDEX idx_priority (priority)
);

-- Insert default financial settings
INSERT INTO system_settings (setting_key, setting_value, description) VALUES
('withdrawal_processing_fee_percentage', '0.5', 'Fee percentage for withdrawal processing'),
('withdrawal_processing_fee_fixed', '100', 'Fixed fee for withdrawal processing in RWF'),
('min_withdrawal_amount', '1000', 'Minimum withdrawal amount in RWF'),
('max_withdrawal_amount_daily', '5000000', 'Maximum daily withdrawal amount in RWF'),
('auto_withdrawal_threshold', '100000', 'Auto withdrawal threshold in RWF'),
('financial_reconciliation_frequency', 'weekly', 'How often to run financial reconciliation'),
('currency_update_frequency', '3600', 'Currency rate update frequency in seconds'),
('payment_processing_timeout', '300', 'Payment processing timeout in seconds'),
('bulk_withdrawal_batch_size', '50', 'Maximum number of withdrawals per batch'),
('financial_alert_email_enabled', 'true', 'Enable email alerts for financial events');

-- Create indexes for better performance
CREATE INDEX idx_company_revenues_date_status ON company_revenues(company_id, created_at, payment_status);
CREATE INDEX idx_transactions_company_type_date ON transactions(from_user_id, type, created_at);
CREATE INDEX idx_users_role_wallet_balance ON users(role, wallet_balance);

-- Create views for common financial queries
CREATE VIEW company_financial_summary AS
SELECT 
    u.id as company_id,
    u.name as company_name,
    u.wallet_balance,
    COALESCE(SUM(CASE WHEN DATE(cr.created_at) = CURDATE() THEN cr.net_amount END), 0) as today_revenue,
    COALESCE(SUM(CASE WHEN WEEK(cr.created_at) = WEEK(NOW()) THEN cr.net_amount END), 0) as week_revenue,
    COALESCE(SUM(CASE WHEN MONTH(cr.created_at) = MONTH(NOW()) THEN cr.net_amount END), 0) as month_revenue,
    COALESCE(SUM(CASE WHEN t.status = 'pending' AND t.type = 'withdrawal' THEN t.amount END), 0) as pending_withdrawals,
    COUNT(CASE WHEN DATE(cr.created_at) = CURDATE() THEN 1 END) as today_bookings
FROM users u
LEFT JOIN company_revenues cr ON u.id = cr.company_id AND cr.payment_status = 'completed'
LEFT JOIN transactions t ON u.id = t.from_user_id
WHERE u.role = 'company'
GROUP BY u.id, u.name, u.wallet_balance;

-- Triggers for automatic financial calculations
DELIMITER //

CREATE TRIGGER update_financial_metrics_after_revenue 
AFTER INSERT ON company_revenues
FOR EACH ROW
BEGIN
    INSERT INTO financial_metrics_cache (id, company_id, metric_type, metric_value, calculation_date)
    VALUES (UUID(), NEW.company_id, 'daily_revenue', NEW.net_amount, DATE(NEW.created_at))
    ON DUPLICATE KEY UPDATE 
        metric_value = metric_value + NEW.net_amount,
        last_updated = NOW();
END//

CREATE TRIGGER check_withdrawal_limits 
BEFORE INSERT ON transactions
FOR EACH ROW
BEGIN
    DECLARE daily_total DECIMAL(15,2) DEFAULT 0;
    DECLARE max_daily DECIMAL(15,2) DEFAULT 5000000;
    
    IF NEW.type = 'withdrawal' THEN
        SELECT COALESCE(SUM(amount), 0) INTO daily_total
        FROM transactions 
        WHERE from_user_id = NEW.from_user_id 
        AND type = 'withdrawal' 
        AND DATE(created_at) = CURDATE()
        AND status != 'failed';
        
        IF (daily_total + NEW.amount) > max_daily THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Daily withdrawal limit exceeded';
        END IF;
    END IF;
END//

DELIMITER ;