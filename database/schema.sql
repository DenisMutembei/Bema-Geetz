-- Bema Geetz COMPLETE Database Schema
-- Includes all base tables + professional booking features

-- ============================================
-- BASE TABLES (Original)
-- ============================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(32) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'customer',
    phone VARCHAR(20),
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Listings table (cars and houses)
CREATE TABLE IF NOT EXISTS listings (
    id VARCHAR(32) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    type ENUM('car', 'house') NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    location VARCHAR(255) NOT NULL,
    images JSON,
    description TEXT,
    host_id VARCHAR(32),
    available BOOLEAN DEFAULT TRUE,
    make VARCHAR(100),
    model VARCHAR(100),
    year INTEGER,
    bedrooms INTEGER,
    bathrooms INTEGER,
    requires_verification BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (host_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
    id VARCHAR(32) PRIMARY KEY,
    user_id VARCHAR(32),
    customer_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255) NOT NULL,
    listing_id VARCHAR(32),
    invoice_id VARCHAR(50) UNIQUE,
    check_in DATE,
    check_out DATE,
    message TEXT,
    status ENUM('pending', 'confirmed', 'cancelled') DEFAULT 'pending',
    total_amount DECIMAL(10,2),
    deposit_amount DECIMAL(10,2),
    balance_amount DECIMAL(10,2),
    payment_status ENUM('unpaid', 'partial', 'paid', 'refunded') DEFAULT 'unpaid',
    cancellation_reason TEXT,
    cancelled_at TIMESTAMP NULL,
    checked_in_at TIMESTAMP NULL,
    checked_out_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Airport services table
CREATE TABLE IF NOT EXISTS airport_services (
    id VARCHAR(32) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    vehicle_type VARCHAR(50),
    price DECIMAL(10,2) NOT NULL,
    max_passengers INTEGER DEFAULT 4,
    max_luggage INTEGER DEFAULT 2,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Airport bookings table
CREATE TABLE IF NOT EXISTS airport_bookings (
    id VARCHAR(32) PRIMARY KEY,
    user_id VARCHAR(32),
    service_id VARCHAR(32),
    flight_number VARCHAR(50),
    airport_name VARCHAR(100) NOT NULL,
    pickup_date DATE NOT NULL,
    pickup_time TIME NOT NULL,
    passenger_count INTEGER DEFAULT 1,
    luggage_count INTEGER DEFAULT 0,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    special_requests TEXT,
    status ENUM('pending', 'confirmed', 'completed', 'cancelled') DEFAULT 'pending',
    payment_status ENUM('unpaid', 'partial', 'paid', 'refunded') DEFAULT 'unpaid',
    cancellation_reason TEXT,
    cancelled_at TIMESTAMP NULL,
    total_price DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES airport_services(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Verifications table
CREATE TABLE IF NOT EXISTS verifications (
    id VARCHAR(32) PRIMARY KEY,
    user_id VARCHAR(32),
    verification_type ENUM('driving_license', 'national_id') NOT NULL,
    legal_name VARCHAR(255) NOT NULL,
    document_number VARCHAR(100) NOT NULL,
    document_image_url VARCHAR(500) NOT NULL,
    selfie_image_url VARCHAR(500),
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    match_status ENUM('pending', 'matched', 'mismatch') DEFAULT 'pending',
    admin_notes TEXT,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- PROFESSIONAL BOOKING TABLES (New)
-- ============================================

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

-- Invoices table
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

-- Receipts table
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

-- Settings table
CREATE TABLE IF NOT EXISTS settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    setting_group VARCHAR(50) DEFAULT 'general',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- DEFAULT DATA
-- ============================================

-- Insert default admin user (password: admin123)
INSERT INTO users (id, name, email, password, role) VALUES
('admin001', 'Admin User', 'admin@bemageetz.com', '$2y$10$YourHashedPasswordHere', 'admin')
ON DUPLICATE KEY UPDATE email=email;

-- Insert default settings
INSERT INTO settings (setting_key, setting_value, setting_group) VALUES
('company_name', 'Bema Geetz Limited', 'general'),
('company_email', 'bookings@bemageetz.com', 'general'),
('company_phone', '+254 700 000 000', 'general'),
('company_address', 'Nairobi, Kenya', 'general'),
('company_kra_pin', 'P000000000X', 'general'),
('flutterwave_public_key', '', 'payment'),
('flutterwave_secret_key', '', 'payment'),
('flutterwave_encryption_key', '', 'payment'),
('flutterwave_environment', 'sandbox', 'payment'),
('smtp_host', 'smtp.gmail.com', 'email'),
('smtp_port', '587', 'email'),
('smtp_username', '', 'email'),
('smtp_password', '', 'email'),
('currency', 'KES', 'general'),
('tax_rate', '0', 'general')
ON DUPLICATE KEY UPDATE setting_key=setting_key;

-- Insert sample airport services
INSERT INTO airport_services (id, name, description, vehicle_type, price, max_passengers, max_luggage) VALUES
('svc001', 'Airport Pickup - Sedan', 'Comfortable sedan for airport transfers', 'sedan', 2500, 3, 2),
('svc002', 'Airport Pickup - SUV', 'Spacious SUV for families or groups', 'suv', 4000, 6, 4),
('svc003', 'Airport Pickup - Van', 'Large van for big groups with luggage', 'van', 6000, 10, 8)
ON DUPLICATE KEY UPDATE name=name;

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX idx_bookings_user ON bookings(user_id);
CREATE INDEX idx_bookings_listing ON bookings(listing_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_payment ON bookings(payment_status);
CREATE INDEX idx_payments_booking ON payments(booking_id);
CREATE INDEX idx_payments_status ON payments(payment_status);
CREATE INDEX idx_invoices_booking ON invoices(booking_id);
CREATE INDEX idx_invoices_number ON invoices(invoice_number);
CREATE INDEX idx_receipts_booking ON receipts(booking_id);
CREATE INDEX idx_receipts_number ON receipts(receipt_number);
CREATE INDEX idx_listings_host ON listings(host_id);
CREATE INDEX idx_listings_type ON listings(type);
CREATE INDEX idx_airport_bookings_user ON airport_bookings(user_id);
CREATE INDEX idx_history_booking ON booking_status_history(booking_id);
