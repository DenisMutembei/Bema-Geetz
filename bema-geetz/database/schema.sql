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

CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- Seed admin user (password: admin123)
INSERT INTO users (name, email, password, role) VALUES
('Admin', 'admin@bemageetz.com', '$2b$10$rOzJqJvJvJvJvJvJvJvJvOzJqJvJvJvJvJvJvJvJvJvJvJvJvJvJv', 'admin')
ON CONFLICT DO NOTHING;
