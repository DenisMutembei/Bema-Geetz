-- Bema Geetz Database Schema
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'customer' CHECK (role IN ('admin', 'host', 'customer')),
  phone VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_id INTEGER;

CREATE TABLE IF NOT EXISTS listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('car', 'house')),
  price DECIMAL(10,2) NOT NULL,
  location VARCHAR(255) NOT NULL,
  images TEXT[] DEFAULT '{}',
  description TEXT,
  host_id UUID REFERENCES users(id) ON DELETE CASCADE,
  available BOOLEAN DEFAULT true,
  make VARCHAR(100),
  model VARCHAR(100),
  year INTEGER,
  bedrooms INTEGER,
  bathrooms INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE listings ADD COLUMN IF NOT EXISTS requires_verification BOOLEAN DEFAULT false;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS verification_type VARCHAR(50);

CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  customer_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(255) NOT NULL,
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
  invoice_id VARCHAR(50) UNIQUE NOT NULL,
  check_in DATE,
  check_out DATE,
  message TEXT,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS verifications (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  verification_type VARCHAR(50) NOT NULL CHECK (verification_type IN ('driving_license', 'national_id')),
  legal_name VARCHAR(255) NOT NULL,
  document_number VARCHAR(100) NOT NULL,
  document_image_url VARCHAR(500) NOT NULL,
  selfie_image_url VARCHAR(500),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  match_status VARCHAR(20) DEFAULT 'pending' CHECK (match_status IN ('pending', 'matched', 'mismatch')),
  admin_notes TEXT,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMP
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'users_verification_id_fkey'
      AND table_name = 'users'
  ) THEN
    ALTER TABLE users
    ADD CONSTRAINT users_verification_id_fkey
    FOREIGN KEY (verification_id)
    REFERENCES verifications(id);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS airport_services (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  vehicle_type VARCHAR(50),
  price DECIMAL(10,2) NOT NULL,
  max_passengers INTEGER DEFAULT 4,
  max_luggage INTEGER DEFAULT 2,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS airport_bookings (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  service_id INTEGER REFERENCES airport_services(id),
  flight_number VARCHAR(50),
  airport_name VARCHAR(100) NOT NULL,
  pickup_address TEXT,
  dropoff_address TEXT,
  booking_date DATE NOT NULL,
  booking_time TIME NOT NULL,
  passenger_count INTEGER DEFAULT 1,
  luggage_count INTEGER DEFAULT 0,
  special_requests TEXT,
  status VARCHAR(20) DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'completed')),
  total_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reviews (
  id SERIAL PRIMARY KEY,
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (listing_id, user_id)
);

UPDATE listings
SET
  requires_verification = true,
  verification_type = CASE
    WHEN type = 'car' THEN 'driving_license'
    WHEN type = 'house' THEN 'national_id'
    ELSE verification_type
  END
WHERE type IN ('car', 'house');

INSERT INTO airport_services (name, description, vehicle_type, price, max_passengers, max_luggage)
SELECT * FROM (
  VALUES
    ('Economy Pickup', 'Affordable airport transfer', 'sedan', 25.00, 4, 2),
    ('Business Class', 'Premium luxury sedan', 'luxury', 60.00, 3, 3),
    ('Family Van', 'Spacious for groups', 'van', 45.00, 8, 6),
    ('Round Trip', 'Pickup and return', 'sedan', 45.00, 4, 2)
) AS seed(name, description, vehicle_type, price, max_passengers, max_luggage)
WHERE NOT EXISTS (SELECT 1 FROM airport_services);

-- Seed admin user (password: admin123)
INSERT INTO users (name, email, password, role) VALUES
('Admin', 'admin@bemageetz.com', '$2b$10$rOzJqJvJvJvJvJvJvJvJvOzJqJvJvJvJvJvJvJvJvJvJvJvJvJvJv', 'admin')
ON CONFLICT DO NOTHING;
