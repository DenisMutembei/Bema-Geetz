require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: 'postgresql://postgres:uzuu8nwwX@localhost:5432/bemageetz'
});

async function seedAdmin() {
  try {
    console.log('Seeding admin user...');
    
    // Generate password hash
    const password = 'admin123';
    const hashed = await bcrypt.hash(password, 10);
    
    // Delete existing admin if exists
    await pool.query('DELETE FROM users WHERE email=$1', ['admin@bemageetz.com']);
    
    // Insert new admin
    const result = await pool.query(
      'INSERT INTO users (name, email, password, role, phone) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, role',
      ['Admin', 'admin@bemageetz.com', hashed, 'admin', '254700000000']
    );
    
    console.log('✓ Admin user created successfully');
    console.log('Credentials:');
    console.log('  Email: admin@bemageetz.com');
    console.log('  Password: admin123');
    console.log('  Role: admin');
    
    await pool.end();
  } catch (err) {
    console.error('✗ Error:', err.message);
    process.exit(1);
  }
}

seedAdmin();
