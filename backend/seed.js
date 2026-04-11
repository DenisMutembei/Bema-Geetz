const bcrypt = require('bcryptjs');
const pool = require('./db');

async function seed() {
  try {
    console.log('Seeding database...');

    await pool.query(`
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
    `);

    const adminPass = await bcrypt.hash('admin123', 10);
    await pool.query(
      `INSERT INTO users (name, email, password, role)
       VALUES ('Admin', 'admin@bemageetz.com', $1, 'admin')
       ON CONFLICT (email) DO NOTHING`,
      [adminPass]
    );

    const hostPass = await bcrypt.hash('host123', 10);
    const hostResult = await pool.query(
      `INSERT INTO users (name, email, password, role, phone)
       VALUES ('John Kamau', 'host@bemageetz.com', $1, 'host', '+254712345678')
       ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      [hostPass]
    );

    const hostId = hostResult.rows[0]?.id;

    if (hostId) {
      await pool.query(
        `INSERT INTO listings (title, type, price, location, description, host_id, make, model, year, images)
         VALUES
           ('2022 Toyota Prado - Executive 4x4', 'car', 8500, 'Nairobi, Westlands',
            'Luxury Toyota Prado in pristine condition. Perfect for business travel and safaris. Includes driver option.',
            $1, 'Toyota', 'Prado', 2022,
            ARRAY['https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=800&q=80']),
           ('Mercedes C-Class - Weekend Special', 'car', 5500, 'Nairobi, Karen',
            'Sleek Mercedes C-Class perfect for weekend getaways. Fuel efficient and comfortable.',
            $1, 'Mercedes', 'C-Class', 2021,
            ARRAY['https://images.unsplash.com/photo-1553440569-bcc63803a83d?auto=format&fit=crop&w=800&q=80']),
           ('Modern 3BR Apartment - Westlands', 'house', 9000, 'Nairobi, Westlands',
            'Stunning fully furnished 3-bedroom apartment with city views. WiFi, Netflix, fully equipped kitchen.',
            $1, NULL, NULL, NULL,
            ARRAY['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80'])
         ON CONFLICT DO NOTHING`,
        [hostId]
      );
    }

    await pool.query(`
      UPDATE listings
      SET
        requires_verification = true,
        verification_type = CASE
          WHEN type = 'car' THEN 'driving_license'
          WHEN type = 'house' THEN 'national_id'
          ELSE verification_type
        END
      WHERE type IN ('car', 'house');
    `);

    await pool.query(`
      INSERT INTO airport_services (name, description, vehicle_type, price, max_passengers, max_luggage)
      SELECT * FROM (
        VALUES
          ('Economy Pickup', 'Affordable airport transfer', 'sedan', 25.00, 4, 2),
          ('Business Class', 'Premium luxury sedan', 'luxury', 60.00, 3, 3),
          ('Family Van', 'Spacious for groups', 'van', 45.00, 8, 6),
          ('Round Trip', 'Pickup and return', 'sedan', 45.00, 4, 2)
      ) AS seed(name, description, vehicle_type, price, max_passengers, max_luggage)
      WHERE NOT EXISTS (SELECT 1 FROM airport_services);
    `);

    await pool.query(`
      INSERT INTO reviews (listing_id, user_id, rating, comment)
      SELECT l.id, $1, seed.rating, seed.comment
      FROM listings l
      CROSS JOIN (
        VALUES
          (5, 'Excellent experience and smooth booking process.'),
          (4, 'Clean, reliable, and exactly as advertised.')
      ) AS seed(rating, comment)
      WHERE NOT EXISTS (SELECT 1 FROM reviews)
      LIMIT 2;
    `, [hostId]);

    console.log('Database seeded successfully!');
    console.log('Admin: admin@bemageetz.com / admin123');
    console.log('Host: host@bemageetz.com / host123');
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exit(1);
  }
}

seed();
