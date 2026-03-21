const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:uzuu8nwwX@localhost:5432/bemageetz'
});

async function checkListings() {
  try {
    console.log('Checking listings...');
    const result = await pool.query('SELECT COUNT(*) FROM listings');
    console.log('Total listings:', result.rows[0].count);

    if (result.rows[0].count > 0) {
      const all = await pool.query('SELECT id, title, type, available, host_id FROM listings ORDER BY created_at DESC LIMIT 5');
      console.log('Recent listings:');
      all.rows.forEach(l => console.log(`  - ${l.title} (${l.type}) - Available: ${l.available}`));
    }

    await pool.end();
  } catch (err) {
    console.error('Error:', err.message);
  }
}

checkListings();
