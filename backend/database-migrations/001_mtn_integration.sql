-- MTN Mobile Money Integration Database Schema
-- Migration: 001_mtn_integration
-- Date: 2024
-- Description: Add tables and columns for MTN Mobile Money integration

-- ============================================
-- 1. MTN Transactions Table
-- ============================================
CREATE TABLE IF NOT EXISTS `mtn_transactions` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `transaction_type` ENUM('collection', 'disbursement') NOT NULL COMMENT 'collection=deposits, disbursement=withdrawals',
  `operation_type` ENUM('request_to_pay', 'deposit', 'transfer') NOT NULL,
  `reference_id` VARCHAR(36) NOT NULL COMMENT 'MTN Reference ID (UUID)',
  `external_id` VARCHAR(100) NOT NULL COMMENT 'Our internal reference',
  `financial_transaction_id` VARCHAR(100) DEFAULT NULL COMMENT 'MTN Financial Transaction ID',
  `amount` DECIMAL(15,2) NOT NULL,
  `currency` VARCHAR(3) DEFAULT 'EUR' COMMENT 'EUR for sandbox, RWF for production',
  `phone_number` VARCHAR(20) NOT NULL,
  `payer_message` VARCHAR(255) DEFAULT NULL,
  `payee_note` VARCHAR(255) DEFAULT NULL,
  `status` ENUM('pending', 'successful', 'failed', 'cancelled') DEFAULT 'pending',
  `failure_reason` TEXT DEFAULT NULL,
  `request_data` JSON DEFAULT NULL COMMENT 'Original request payload',
  `response_data` JSON DEFAULT NULL COMMENT 'MTN API response',
  `webhook_data` JSON DEFAULT NULL COMMENT 'Webhook callback data',
  `related_booking_id` INT DEFAULT NULL,
  `related_wallet_transaction_id` INT DEFAULT NULL,
  `related_company_wallet_id` INT DEFAULT NULL,
  `initiated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `completed_at` TIMESTAMP NULL DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_mtn_reference_id` (`reference_id`),
  UNIQUE KEY `uk_mtn_external_id` (`external_id`),
  KEY `idx_mtn_user_id` (`user_id`),
  KEY `idx_mtn_status` (`status`),
  KEY `idx_mtn_transaction_type` (`transaction_type`),
  KEY `idx_mtn_phone_number` (`phone_number`),
  KEY `idx_mtn_created_at` (`created_at`),
  KEY `fk_mtn_booking` (`related_booking_id`),
  KEY `fk_mtn_wallet_transaction` (`related_wallet_transaction_id`),
  CONSTRAINT `fk_mtn_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_mtn_booking` FOREIGN KEY (`related_booking_id`) REFERENCES `bookings` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_mtn_wallet_transaction` FOREIGN KEY (`related_wallet_transaction_id`) REFERENCES `wallet_transactions` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='MTN Mobile Money transactions for both collections and disbursements';

-- ============================================
-- 2. Company Wallets Table
-- ============================================
CREATE TABLE IF NOT EXISTS `company_wallets` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `company_id` INT NOT NULL,
  `balance` DECIMAL(15,2) DEFAULT '0.00' COMMENT 'Available balance',
  `pending_balance` DECIMAL(15,2) DEFAULT '0.00' COMMENT 'Pending withdrawals',
  `total_earned` DECIMAL(15,2) DEFAULT '0.00' COMMENT 'Total revenue earned',
  `total_withdrawn` DECIMAL(15,2) DEFAULT '0.00' COMMENT 'Total amount withdrawn',
  `total_commission_paid` DECIMAL(15,2) DEFAULT '0.00' COMMENT 'Total platform commission paid',
  `currency` VARCHAR(3) DEFAULT 'RWF',
  `withdrawal_phone` VARCHAR(20) DEFAULT NULL COMMENT 'Default phone for withdrawals',
  `min_withdrawal_amount` DECIMAL(15,2) DEFAULT '10000.00',
  `max_withdrawal_amount` DECIMAL(15,2) DEFAULT '5000000.00',
  `daily_withdrawal_limit` DECIMAL(15,2) DEFAULT '10000000.00',
  `is_active` TINYINT(1) DEFAULT '1',
  `is_locked` TINYINT(1) DEFAULT '0' COMMENT 'Lock wallet for security',
  `last_withdrawal_at` TIMESTAMP NULL DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_company_wallet` (`company_id`),
  KEY `idx_company_wallet_balance` (`balance`),
  KEY `idx_company_wallet_active` (`is_active`),
  CONSTRAINT `fk_company_wallet_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Company wallets for managing ticket sales revenue';

-- ============================================
-- 3. Company Wallet Transactions Table
-- ============================================
CREATE TABLE IF NOT EXISTS `company_wallet_transactions` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `company_wallet_id` INT NOT NULL,
  `transaction_type` ENUM('credit', 'debit', 'commission', 'refund') NOT NULL,
  `amount` DECIMAL(15,2) NOT NULL,
  `balance_before` DECIMAL(15,2) NOT NULL,
  `balance_after` DECIMAL(15,2) NOT NULL,
  `description` VARCHAR(255) NOT NULL,
  `reference` VARCHAR(100) DEFAULT NULL,
  `related_booking_id` INT DEFAULT NULL,
  `related_mtn_transaction_id` INT DEFAULT NULL,
  `commission_rate` DECIMAL(5,2) DEFAULT NULL COMMENT 'Commission percentage if applicable',
  `commission_amount` DECIMAL(15,2) DEFAULT NULL,
  `metadata` JSON DEFAULT NULL,
  `status` ENUM('pending', 'completed', 'failed', 'reversed') DEFAULT 'completed',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_company_wallet_trans_wallet` (`company_wallet_id`),
  KEY `fk_company_wallet_trans_booking` (`related_booking_id`),
  KEY `fk_company_wallet_trans_mtn` (`related_mtn_transaction_id`),
  KEY `idx_company_wallet_trans_type` (`transaction_type`),
  KEY `idx_company_wallet_trans_status` (`status`),
  KEY `idx_company_wallet_trans_created` (`created_at`),
  CONSTRAINT `fk_company_wallet_trans_wallet` FOREIGN KEY (`company_wallet_id`) REFERENCES `company_wallets` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_company_wallet_trans_booking` FOREIGN KEY (`related_booking_id`) REFERENCES `bookings` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_company_wallet_trans_mtn` FOREIGN KEY (`related_mtn_transaction_id`) REFERENCES `mtn_transactions` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Transaction history for company wallets';

-- ============================================
-- 4. Withdrawal Requests Table
-- ============================================
CREATE TABLE IF NOT EXISTS `withdrawal_requests` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `company_id` INT NOT NULL,
  `company_wallet_id` INT NOT NULL,
  `request_reference` VARCHAR(50) UNIQUE NOT NULL,
  `amount` DECIMAL(15,2) NOT NULL,
  `phone_number` VARCHAR(20) NOT NULL,
  `status` ENUM('pending', 'processing', 'completed', 'failed', 'cancelled') DEFAULT 'pending',
  `mtn_transaction_id` INT DEFAULT NULL,
  `failure_reason` TEXT DEFAULT NULL,
  `requested_by_user_id` INT NOT NULL,
  `approved_by_user_id` INT DEFAULT NULL,
  `processed_by_user_id` INT DEFAULT NULL,
  `notes` TEXT DEFAULT NULL,
  `requested_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `approved_at` TIMESTAMP NULL DEFAULT NULL,
  `processed_at` TIMESTAMP NULL DEFAULT NULL,
  `completed_at` TIMESTAMP NULL DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_withdrawal_reference` (`request_reference`),
  KEY `fk_withdrawal_company` (`company_id`),
  KEY `fk_withdrawal_company_wallet` (`company_wallet_id`),
  KEY `fk_withdrawal_mtn` (`mtn_transaction_id`),
  KEY `fk_withdrawal_requested_by` (`requested_by_user_id`),
  KEY `idx_withdrawal_status` (`status`),
  KEY `idx_withdrawal_created` (`created_at`),
  CONSTRAINT `fk_withdrawal_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_withdrawal_company_wallet` FOREIGN KEY (`company_wallet_id`) REFERENCES `company_wallets` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_withdrawal_mtn` FOREIGN KEY (`mtn_transaction_id`) REFERENCES `mtn_transactions` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_withdrawal_requested_by` FOREIGN KEY (`requested_by_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Company withdrawal requests tracking';

-- ============================================
-- 5. Update existing wallet_transactions table
-- ============================================
ALTER TABLE `wallet_transactions` 
ADD COLUMN IF NOT EXISTS `mtn_transaction_id` INT DEFAULT NULL AFTER `related_booking_id`,
ADD COLUMN IF NOT EXISTS `transaction_reference` VARCHAR(100) DEFAULT NULL AFTER `reference`,
ADD KEY `fk_wallet_trans_mtn` (`mtn_transaction_id`),
ADD CONSTRAINT `fk_wallet_trans_mtn` FOREIGN KEY (`mtn_transaction_id`) REFERENCES `mtn_transactions` (`id`) ON DELETE SET NULL;

-- ============================================
-- 6. Update bookings table for MTN tracking
-- ============================================
ALTER TABLE `bookings`
ADD COLUMN IF NOT EXISTS `mtn_transaction_id` INT DEFAULT NULL AFTER `payment_reference`,
ADD KEY `fk_booking_mtn` (`mtn_transaction_id`),
ADD CONSTRAINT `fk_booking_mtn` FOREIGN KEY (`mtn_transaction_id`) REFERENCES `mtn_transactions` (`id`) ON DELETE SET NULL;

-- ============================================
-- 7. Create indexes for better performance
-- ============================================
CREATE INDEX IF NOT EXISTS `idx_mtn_financial_id` ON `mtn_transactions` (`financial_transaction_id`);
CREATE INDEX IF NOT EXISTS `idx_company_wallet_company` ON `company_wallets` (`company_id`, `is_active`);
CREATE INDEX IF NOT EXISTS `idx_withdrawal_company_status` ON `withdrawal_requests` (`company_id`, `status`);

-- ============================================
-- 8. Create company wallets for existing companies
-- ============================================
INSERT INTO `company_wallets` (`company_id`, `balance`, `currency`, `is_active`)
SELECT 
  `id`,
  0.00,
  'RWF',
  1
FROM `companies`
WHERE `id` NOT IN (SELECT `company_id` FROM `company_wallets`)
ON DUPLICATE KEY UPDATE `company_id` = `company_id`;

-- ============================================
-- 9. Create views for reporting
-- ============================================

-- View: Company Revenue Summary
CREATE OR REPLACE VIEW `v_company_revenue_summary` AS
SELECT 
  c.id AS company_id,
  c.name AS company_name,
  cw.balance AS current_balance,
  cw.pending_balance,
  cw.total_earned,
  cw.total_withdrawn,
  cw.total_commission_paid,
  (cw.total_earned - cw.total_commission_paid) AS net_revenue,
  COUNT(DISTINCT b.id) AS total_bookings,
  SUM(CASE WHEN b.payment_status = 'completed' THEN b.total_amount ELSE 0 END) AS total_booking_amount,
  cw.last_withdrawal_at,
  cw.updated_at AS last_updated
FROM companies c
LEFT JOIN company_wallets cw ON c.id = cw.company_id
LEFT JOIN trips t ON t.route_id IN (SELECT id FROM routes WHERE company_id = c.id)
LEFT JOIN bookings b ON b.trip_id = t.id
GROUP BY c.id, c.name, cw.balance, cw.pending_balance, cw.total_earned, 
         cw.total_withdrawn, cw.total_commission_paid, cw.last_withdrawal_at, cw.updated_at;

-- View: MTN Transaction Summary
CREATE OR REPLACE VIEW `v_mtn_transaction_summary` AS
SELECT 
  DATE(created_at) AS transaction_date,
  transaction_type,
  operation_type,
  status,
  COUNT(*) AS transaction_count,
  SUM(amount) AS total_amount,
  AVG(amount) AS average_amount,
  SUM(CASE WHEN status = 'successful' THEN amount ELSE 0 END) AS successful_amount,
  SUM(CASE WHEN status = 'failed' THEN amount ELSE 0 END) AS failed_amount
FROM mtn_transactions
GROUP BY DATE(created_at), transaction_type, operation_type, status;

-- View: Pending Withdrawals
CREATE OR REPLACE VIEW `v_pending_withdrawals` AS
SELECT 
  wr.id,
  wr.request_reference,
  c.name AS company_name,
  wr.amount,
  wr.phone_number,
  wr.status,
  u.name AS requested_by,
  wr.requested_at,
  TIMESTAMPDIFF(HOUR, wr.requested_at, NOW()) AS hours_pending
FROM withdrawal_requests wr
JOIN companies c ON wr.company_id = c.id
JOIN users u ON wr.requested_by_user_id = u.id
WHERE wr.status IN ('pending', 'processing')
ORDER BY wr.requested_at ASC;

-- ============================================
-- 10. Insert initial settings
-- ============================================
INSERT INTO `settings` (`setting_key`, `setting_value`, `setting_type`, `description`, `is_public`)
VALUES 
  ('mtn_enabled', 'true', 'boolean', 'Enable MTN Mobile Money integration', 0),
  ('mtn_environment', 'sandbox', 'string', 'MTN API environment (sandbox/production)', 0),
  ('mtn_currency', 'EUR', 'string', 'Currency for MTN transactions (EUR for sandbox, RWF for production)', 0),
  ('mtn_min_deposit', '1000', 'number', 'Minimum deposit amount in RWF', 1),
  ('mtn_max_deposit', '5000000', 'number', 'Maximum deposit amount in RWF', 1),
  ('mtn_min_withdrawal', '10000', 'number', 'Minimum withdrawal amount for companies in RWF', 1),
  ('mtn_max_withdrawal', '10000000', 'number', 'Maximum withdrawal amount for companies in RWF', 1),
  ('platform_commission_rate', '10.00', 'number', 'Platform commission rate percentage', 0),
  ('auto_approve_withdrawals', 'false', 'boolean', 'Automatically approve withdrawal requests', 0),
  ('withdrawal_processing_hours', '24', 'number', 'Hours to process withdrawal requests', 1)
ON DUPLICATE KEY UPDATE `setting_key` = `setting_key`;

-- ============================================
-- 11. Create stored procedures
-- ============================================

DELIMITER $$

-- Procedure: Process Booking Payment
CREATE PROCEDURE IF NOT EXISTS `sp_process_booking_payment`(
  IN p_booking_id INT,
  IN p_mtn_transaction_id INT,
  IN p_amount DECIMAL(15,2)
)
BEGIN
  DECLARE v_company_id INT;
  DECLARE v_company_wallet_id INT;
  DECLARE v_commission_rate DECIMAL(5,2);
  DECLARE v_commission_amount DECIMAL(15,2);
  DECLARE v_net_amount DECIMAL(15,2);
  DECLARE v_current_balance DECIMAL(15,2);
  
  -- Get company and commission rate
  SELECT c.id, c.commission_rate, cw.id, cw.balance
  INTO v_company_id, v_commission_rate, v_company_wallet_id, v_current_balance
  FROM bookings b
  JOIN trips t ON b.trip_id = t.id
  JOIN routes r ON t.route_id = r.id
  JOIN companies c ON r.company_id = c.id
  JOIN company_wallets cw ON c.id = cw.company_id
  WHERE b.id = p_booking_id;
  
  -- Calculate commission and net amount
  SET v_commission_amount = (p_amount * v_commission_rate) / 100;
  SET v_net_amount = p_amount - v_commission_amount;
  
  -- Update company wallet
  UPDATE company_wallets
  SET 
    balance = balance + v_net_amount,
    total_earned = total_earned + p_amount,
    total_commission_paid = total_commission_paid + v_commission_amount
  WHERE id = v_company_wallet_id;
  
  -- Record credit transaction
  INSERT INTO company_wallet_transactions (
    company_wallet_id, transaction_type, amount, balance_before, balance_after,
    description, related_booking_id, related_mtn_transaction_id,
    commission_rate, commission_amount, status
  ) VALUES (
    v_company_wallet_id, 'credit', v_net_amount, v_current_balance, 
    v_current_balance + v_net_amount,
    CONCAT('Booking payment - ', (SELECT booking_reference FROM bookings WHERE id = p_booking_id)),
    p_booking_id, p_mtn_transaction_id, v_commission_rate, v_commission_amount, 'completed'
  );
  
  -- Record commission transaction
  INSERT INTO company_wallet_transactions (
    company_wallet_id, transaction_type, amount, balance_before, balance_after,
    description, related_booking_id, commission_rate, commission_amount, status
  ) VALUES (
    v_company_wallet_id, 'commission', v_commission_amount, 
    v_current_balance + v_net_amount, v_current_balance + v_net_amount,
    CONCAT('Platform commission - ', (SELECT booking_reference FROM bookings WHERE id = p_booking_id)),
    p_booking_id, v_commission_rate, v_commission_amount, 'completed'
  );
END$$

DELIMITER ;

-- ============================================
-- 12. Grant necessary permissions (if needed)
-- ============================================
-- GRANT SELECT, INSERT, UPDATE ON mtn_transactions TO 'gobus_app'@'localhost';
-- GRANT SELECT, INSERT, UPDATE ON company_wallets TO 'gobus_app'@'localhost';
-- GRANT SELECT, INSERT, UPDATE ON company_wallet_transactions TO 'gobus_app'@'localhost';
-- GRANT SELECT, INSERT, UPDATE ON withdrawal_requests TO 'gobus_app'@'localhost';

-- ============================================
-- Migration Complete
-- ============================================
SELECT 'MTN Mobile Money Integration Migration Completed Successfully' AS status;
