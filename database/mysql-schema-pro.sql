-- Bema Geetz PRO Database Schema - Professional Booking System
-- Enhanced with payments, invoices, receipts, and notifications

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
    id VARCHAR(32) PRIMARY KEY,
    booking_id VARCHAR(32),
    booking_type ENUM('listing', 'airport') DEFAULT 'listing',
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'KES',
    payment_method ENUM('mpesa', 'card', 'bank_transfer', 'cash') DEFAULT 'mpesa',
    payment_status ENUM('pending', 'processing', 'completed', 'failed', 'refunded') DEFAULT 'pending',
    transaction_code VARCHAR(100),
    mpesa_receipt VARCHAR(100),
    mpesa_phone VARCHAR(20),
    mpesa_merchant_request_id VARCHAR(100),
    mpesa_checkout_request_id VARCHAR(100),
    paid_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Invoices table (generated PDF invoices)
CREATE TABLE IF NOT EXISTS invoices (
    id VARCHAR(32) PRIMARY KEY,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    booking_id VARCHAR(32),
    user_id VARCHAR(32),
    customer_name VARCHAR(255),
    customer_email VARCHAR(255),
    customer_phone VARCHAR(20),
    item_description TEXT,
    amount DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    due_date DATE,
    status ENUM('draft', 'sent', 'paid', 'overdue', 'cancelled') DEFAULT 'draft',
    pdf_path VARCHAR(255),
    sent_at TIMESTAMP NULL,
    paid_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Receipts table (after payment confirmation)
CREATE TABLE IF NOT EXISTS receipts (
    id VARCHAR(32) PRIMARY KEY,
    receipt_number VARCHAR(50) UNIQUE NOT NULL,
    invoice_id VARCHAR(32),
    payment_id VARCHAR(32),
    booking_id VARCHAR(32),
    user_id VARCHAR(32),
    customer_name VARCHAR(255),
    amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(50),
    transaction_reference VARCHAR(100),
    pdf_path VARCHAR(255),
    sent_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
    FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE SET NULL,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Email notifications log
CREATE TABLE IF NOT EXISTS email_notifications (
    id VARCHAR(32) PRIMARY KEY,
    recipient_email VARCHAR(255) NOT NULL,
    recipient_name VARCHAR(255),
    email_type ENUM('booking_confirmation', 'payment_received', 'invoice', 'receipt', 'booking_reminder', 'admin_alert') NOT NULL,
    subject VARCHAR(255),
    template VARCHAR(100),
    booking_id VARCHAR(32),
    sent_at TIMESTAMP NULL,
    opened_at TIMESTAMP NULL,
    status ENUM('queued', 'sent', 'failed', 'bounced') DEFAULT 'queued',
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- SMS notifications log
CREATE TABLE IF NOT EXISTS sms_notifications (
    id VARCHAR(32) PRIMARY KEY,
    phone_number VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    sms_type ENUM('booking_confirmation', 'payment_received', 'reminder', 'admin_alert') NOT NULL,
    booking_id VARCHAR(32),
    sent_at TIMESTAMP NULL,
    status ENUM('queued', 'sent', 'failed') DEFAULT 'queued',
    provider_response TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Booking status history tracking
CREATE TABLE IF NOT EXISTS booking_status_history (
    id VARCHAR(32) PRIMARY KEY,
    booking_id VARCHAR(32) NOT NULL,
    old_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    changed_by VARCHAR(32),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Settings table for configuration
CREATE TABLE IF NOT EXISTS settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    setting_group VARCHAR(50) DEFAULT 'general',
    is_encrypted TINYINT(1) DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert default settings
INSERT INTO settings (setting_key, setting_value, setting_group) VALUES
('company_name', 'Bema Geetz Limited', 'general'),
('company_email', 'bookings@bemageetz.com', 'general'),
('company_phone', '+254 700 000 000', 'general'),
('company_address', 'Nairobi, Kenya', 'general'),
('company_kra_pin', 'P000000000X', 'general'),
('mpesa_shortcode', '174379', 'payment'),
('mpesa_passkey', 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919', 'payment'),
('mpesa_consumer_key', '', 'payment'),
('mpesa_consumer_secret', '', 'payment'),
('mpesa_environment', 'sandbox', 'payment'),
('smtp_host', 'smtp.gmail.com', 'email'),
('smtp_port', '587', 'email'),
('smtp_username', '', 'email'),
('smtp_password', '', 'email'),
('smtp_from_name', 'Bema Geetz', 'email'),
('sms_provider', 'africastalking', 'sms'),
('sms_api_key', '', 'sms'),
('sms_username', '', 'sms'),
('currency', 'KES', 'general'),
('tax_rate', '0', 'general'),
('booking_deposit_percent', '100', 'general'),
('cancellation_policy', 'Full refund if cancelled 48 hours before booking', 'general')
ON DUPLICATE KEY UPDATE setting_key=setting_key;

-- Update existing bookings table with new fields
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS total_amount DECIMAL(10,2) AFTER message,
ADD COLUMN IF NOT EXISTS deposit_amount DECIMAL(10,2) AFTER total_amount,
ADD COLUMN IF NOT EXISTS balance_amount DECIMAL(10,2) AFTER deposit_amount,
ADD COLUMN IF NOT EXISTS payment_status ENUM('unpaid', 'partial', 'paid', 'refunded') DEFAULT 'unpaid' AFTER balance_amount,
ADD COLUMN IF NOT EXISTS cancellation_reason TEXT AFTER payment_status,
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP NULL AFTER cancellation_reason,
ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS checked_out_at TIMESTAMP NULL;

-- Update airport_bookings similarly
ALTER TABLE airport_bookings 
ADD COLUMN IF NOT EXISTS payment_status ENUM('unpaid', 'partial', 'paid', 'refunded') DEFAULT 'unpaid' AFTER status,
ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP NULL;

-- Create indexes for performance
CREATE INDEX idx_payments_booking ON payments(booking_id);
CREATE INDEX idx_payments_status ON payments(payment_status);
CREATE INDEX idx_invoices_booking ON invoices(booking_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_receipts_booking ON receipts(booking_id);
CREATE INDEX idx_booking_status_history_booking ON booking_status_history(booking_id);

-- Add indexes for better performance
CREATE INDEX idx_bookings_payment_status ON bookings(payment_status);
CREATE INDEX idx_bookings_dates ON bookings(check_in, check_out);
