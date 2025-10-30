require('dotenv').config({ override: true });
const { Pool } = require('pg');

const config = {};
if (process.env.DATABASE_URL && process.env.DATABASE_URL.trim() !== '') {
  config.connectionString = process.env.DATABASE_URL;
} else if (process.env.PG_CONNECTION && process.env.PG_CONNECTION.trim() !== '') {
  config.connectionString = process.env.PG_CONNECTION;
} else {
  config.host = process.env.PGHOST || 'localhost';
  config.port = process.env.PGPORT ? parseInt(process.env.PGPORT,10) : 5432;
  config.user = process.env.PGUSER || process.env.USER;
  config.database = process.env.PGDATABASE || 'appointmentapp';
  if (typeof process.env.PGPASSWORD !== 'undefined' && process.env.PGPASSWORD !== '') {
    config.password = String(process.env.PGPASSWORD);
  }
}

console.log('Using PG config (masked):', Object.assign({}, config, { password: config.password ? '*****' : undefined, connectionString: config.connectionString ? '[provided]' : undefined }));

async function test(){
  const pool = new Pool(config);
  try {
    const client = await pool.connect();
    console.log('Connected OK');
    client.release();
  } catch (err) {
    console.error('Connect error:', err && err.message);
    console.error(err);
  } finally {
    await pool.end();
  }
}

test();
