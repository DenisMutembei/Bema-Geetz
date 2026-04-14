-- Bema Geetz MySQL Database Schema for Shared Hosting
-- Run this in phpMyAdmin on your hosting

CREATE DATABASE IF NOT EXISTS bemageetz_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE bemageetz_db;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(32) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role ENUM('admin', 'host', 'customer') DEFAULT 'customer',
    is_verified TINYINT(1) DEFAULT 0,
    verification_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Listings table
CREATE TABLE IF NOT EXISTS listings (
    id VARCHAR(32) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    type ENUM('car', 'house') NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    location VARCHAR(255) NOT NULL,
    description TEXT,
    host_id VARCHAR(32),
    make VARCHAR(100),
    model VARCHAR(100),
    year INT,
    bedrooms INT,
    bathrooms INT,
    images JSON,
    available TINYINT(1) DEFAULT 1,
    requires_verification TINYINT(1) DEFAULT 0,
    verification_type VARCHAR(50),
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
    invoice_id VARCHAR(50) UNIQUE NOT NULL,
    check_in DATE,
    check_out DATE,
    message TEXT,
    status ENUM('pending', 'confirmed', 'cancelled') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Airport services table
CREATE TABLE IF NOT EXISTS airport_services (
    id VARCHAR(32) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    vehicle_type ENUM('sedan', 'luxury', 'van', 'suv') DEFAULT 'sedan',
    price DECIMAL(10,2) NOT NULL,
    max_passengers INT DEFAULT 4,
    max_luggage INT DEFAULT 2,
    is_active TINYINT(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Airport bookings table
CREATE TABLE IF NOT EXISTS airport_bookings (
    id VARCHAR(32) PRIMARY KEY,
    user_id VARCHAR(32),
    service_id VARCHAR(32),
    flight_number VARCHAR(50),
    airport_name VARCHAR(255) NOT NULL,
    pickup_address VARCHAR(255),
    dropoff_address VARCHAR(255),
    booking_date DATE,
    booking_time TIME,
    passenger_count INT DEFAULT 1,
    luggage_count INT DEFAULT 0,
    special_requests TEXT,
    total_price DECIMAL(10,2) NOT NULL,
    status ENUM('pending', 'confirmed', 'cancelled') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (service_id) REFERENCES airport_services(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create indexes for better performance
CREATE INDEX idx_listings_type ON listings(type);
CREATE INDEX idx_listings_location ON listings(location);
CREATE INDEX idx_listings_available ON listings(available);
CREATE INDEX idx_bookings_user ON bookings(user_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_airport_bookings_user ON airport_bookings(user_id);

-- Insert default admin user (password: admin123)
INSERT INTO users (id, name, email, password, phone, role, is_verified) VALUES
('admin001admin001admin001admin001', 'Administrator', 'admin@bemageetz.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '254700000000', 'admin', 1)
ON DUPLICATE KEY UPDATE id=id;

-- Insert sample airport services
INSERT INTO airport_services (id, name, description, vehicle_type, price, max_passengers, max_luggage) VALUES
('sedan001sedan001sedan001sedan001', 'Airport Sedan', 'Comfortable sedan for airport transfers. Perfect for 1-3 passengers with moderate luggage.', 'sedan', 45.00, 3, 2),
('luxury001luxury001luxury001lux001', 'Luxury Transfer', 'Premium luxury vehicle for executive airport transfers. Maximum comfort and style.', 'luxury', 85.00, 2, 2),
('van001van001van001van001van001van', 'Airport Van', 'Spacious van for groups and families. Can accommodate up to 7 passengers.', 'van', 75.00, 7, 5),
('suv001suv001suv001suv001suv001su', 'Airport SUV', 'Versatile SUV with extra space for luggage and passengers.', 'suv', 65.00, 5, 4)
ON DUPLICATE KEY UPDATE id=id;
