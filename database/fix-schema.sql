-- Fix missing columns and tables that are causing backend crashes

-- Fix users table - add is_verified if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'is_verified'
  ) THEN
    ALTER TABLE users ADD COLUMN is_verified BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Fix listings table - add verification columns if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'listings' AND column_name = 'requires_verification'
  ) THEN
    ALTER TABLE listings ADD COLUMN requires_verification BOOLEAN DEFAULT false;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'listings' AND column_name = 'verification_type'
  ) THEN
    ALTER TABLE listings ADD COLUMN verification_type VARCHAR(50);
  END IF;
END $$;

-- Create airport_services table if not exists
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

-- Create reviews table if not exists
CREATE TABLE IF NOT EXISTS reviews (
  id SERIAL PRIMARY KEY,
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (listing_id, user_id)
);

-- Create verifications table if not exists
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

-- Update listings with verification requirements
UPDATE listings
SET
  requires_verification = true,
  verification_type = CASE
    WHEN type = 'car' THEN 'driving_license'
    WHEN type = 'house' THEN 'national_id'
    ELSE verification_type
  END
WHERE type IN ('car', 'house') AND requires_verification IS NULL;

-- Seed airport services if empty
INSERT INTO airport_services (name, description, vehicle_type, price, max_passengers, max_luggage)
SELECT * FROM (
  VALUES
    ('Economy Pickup', 'Affordable airport transfer', 'sedan', 25.00, 4, 2),
    ('Business Class', 'Premium luxury sedan', 'luxury', 60.00, 3, 3),
    ('Family Van', 'Spacious for groups', 'van', 45.00, 8, 6),
    ('Round Trip', 'Pickup and return', 'sedan', 45.00, 4, 2)
) AS seed(name, description, vehicle_type, price, max_passengers, max_luggage)
WHERE NOT EXISTS (SELECT 1 FROM airport_services);

-- Add verification_id to users if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'verification_id'
  ) THEN
    ALTER TABLE users ADD COLUMN verification_id INTEGER;
    
    -- Add foreign key constraint
    ALTER TABLE users
    ADD CONSTRAINT users_verification_id_fkey
    FOREIGN KEY (verification_id)
    REFERENCES verifications(id);
  END IF;
END $$;

-- Fix any existing data issues
UPDATE listings SET requires_verification = false WHERE requires_verification IS NULL;
UPDATE users SET is_verified = false WHERE is_verified IS NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_listings_host_id ON listings(host_id);
CREATE INDEX IF NOT EXISTS idx_listings_type ON listings(type);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_listing_id ON bookings(listing_id);
CREATE INDEX IF NOT EXISTS idx_reviews_listing_id ON reviews(listing_id);
CREATE INDEX IF NOT EXISTS idx_verifications_user_id ON verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_verifications_status ON verifications(status);

COMMIT;

-- Verify the fixes
SELECT 'Schema fixes applied successfully!' as status;
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('users', 'listings', 'verifications', 'reviews', 'airport_services')
ORDER BY table_name, ordinal_position;
