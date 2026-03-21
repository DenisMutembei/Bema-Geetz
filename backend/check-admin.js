const pool = require('./db');

async function checkAdmin() {
  try {
    const result = await pool.query('SELECT id, name, email, password, role FROM users WHERE email=$1', ['admin@bemageetz.com']);
    console.log('Admin user found:', result.rows.length > 0 ? 'YES' : 'NO');
    if (result.rows.length > 0) {
      console.log('User data:', {
        id: result.rows[0].id,
        name: result.rows[0].name,
        email: result.rows[0].email,
        role: result.rows[0].role,
        passwordHash: result.rows[0].password ? '(hashed)' : 'NONE'
      });
    }
    
    // Check all users
    const allUsers = await pool.query('SELECT id, email, role FROM users');
    console.log('\nAll users in database:', allUsers.rows.length);
    allUsers.rows.forEach(u => console.log(`  - ${u.email} (${u.role})`));
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
}

checkAdmin();
