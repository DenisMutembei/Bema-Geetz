const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:uzuu8nwwX@localhost:5432/bemageetz',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

module.exports = pool;
