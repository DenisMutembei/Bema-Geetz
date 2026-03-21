const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Connection string without database name
const connectionString = 'postgresql://postgres:uzuu8nwwX@localhost:5432/postgres';

async function setupDatabase() {
  const client = new Client({ connectionString });

  try {
    console.log('Connecting to PostgreSQL...');
    await client.connect();
    console.log('✓ Connected to PostgreSQL');

    // Create database
    console.log('Creating database...');
    try {
      await client.query('CREATE DATABASE bemageetz;');
      console.log('✓ Database "bemageetz" created');
    } catch (err) {
      if (err.message.includes('already exists')) {
        console.log('✓ Database "bemageetz" already exists');
      } else {
        throw err;
      }
    }

    await client.end();

    // Connect to bemageetz database and run schema
    const dbClient = new Client({ connectionString: 'postgresql://postgres:uzuu8nwwX@localhost:5432/bemageetz' });
    await dbClient.connect();
    console.log('✓ Connected to bemageetz database');

    // Read and execute schema
    const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('Running schema...');
    await dbClient.query(schema);
    console.log('✓ Database schema created successfully');

    await dbClient.end();
    console.log('✓ Setup complete!');
  } catch (err) {
    console.error('✗ Error setting up database:', err.message);
    process.exit(1);
  }
}

setupDatabase();
