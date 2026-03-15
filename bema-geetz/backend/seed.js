const bcrypt = require('bcryptjs');
const pool = require('./db');

async function seed() {
  try {
    console.log('🌱 Seeding database...');

    // Create tables
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
    `);

    // Seed admin
    const adminPass = await bcrypt.hash('admin123', 10);
    await pool.query(`
      INSERT INTO users (name, email, password, role)
      VALUES ('Admin', 'admin@bemageetz.com', $1, 'admin')
      ON CONFLICT (email) DO NOTHING
    `, [adminPass]);

    // Seed host
    const hostPass = await bcrypt.hash('host123', 10);
    const hostResult = await pool.query(`
      INSERT INTO users (name, email, password, role, phone)
      VALUES ('John Kamau', 'host@bemageetz.com', $1, 'host', '+254712345678')
      ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
      RETURNING id
    `, [hostPass]);

    const hostId = hostResult.rows[0]?.id;

    if (hostId) {
      // Seed sample listings
      await pool.query(`
        INSERT INTO listings (title, type, price, location, description, host_id, make, model, year, images)
        VALUES
          ('2022 Toyota Prado – Executive 4x4', 'car', 8500, 'Nairobi, Westlands',
           'Luxury Toyota Prado in pristine condition. Perfect for business travel and safaris. Includes driver option.',
           $1, 'Toyota', 'Prado', 2022,
           ARRAY['https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=800&q=80']),

          ('Mercedes C-Class – Weekend Special', 'car', 5500, 'Nairobi, Karen',
           'Sleek Mercedes C-Class perfect for weekend getaways. Fuel efficient and comfortable.',
           $1, 'Mercedes', 'C-Class', 2021,
           ARRAY['https://images.unsplash.com/photo-1553440569-bcc63803a83d?auto=format&fit=crop&w=800&q=80']),

          ('Modern 3BR Apartment – Westlands', 'house', 9000, 'Nairobi, Westlands',
           'Stunning fully furnished 3-bedroom apartment with city views. WiFi, Netflix, fully equipped kitchen.',
           $1, NULL, NULL, NULL,
           ARRAY['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80'])
        ON CONFLICT DO NOTHING
      `, [hostId]);
    }

    console.log('✅ Database seeded successfully!');
    console.log('📧 Admin: admin@bemageetz.com / admin123');
    console.log('📧 Host:  host@bemageetz.com  / host123');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  }
}

seed();
