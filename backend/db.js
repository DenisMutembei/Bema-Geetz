const { Pool } = require('pg');

// Use DATABASE_URL from environment, fallback to local for development
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:uzuu8nwwX@localhost:5432/bemageetz';

const pool = new Pool({
  connectionString,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Log connection status (without sensitive info)
console.log('Database connecting to:', connectionString.replace(/:[^:@]+@/, ':****@'));

module.exports = pool;
