const bcrypt = require('bcryptjs');
const pool = require('./db');

async function createTestHost() {
  try {
    const hash = await bcrypt.hash('host123', 10);
    await pool.query(
      'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) ON CONFLICT (email) DO NOTHING',
      ['Test Host', 'host@test.com', hash, 'host']
    );
    console.log('Test host user created: host@test.com / host123');
    await pool.end();
  } catch (err) {
    console.error('Error:', err.message);
  }
}

createTestHost();