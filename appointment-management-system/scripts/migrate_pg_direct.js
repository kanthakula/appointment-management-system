const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { Pool } = require('pg');

const envPath = path.join(__dirname, '..', '.env');
if (!fs.existsSync(envPath)) {
  console.error('.env not found at', envPath); process.exit(1);
}
const env = dotenv.parse(fs.readFileSync(envPath));

function get(key){ return (env[key] || '').trim(); }

let conn;
if (get('DATABASE_URL')) conn = get('DATABASE_URL');
else {
  const user = get('PGUSER') || process.env.USER || '';
  const pass = get('PGPASSWORD') || '';
  const host = get('PGHOST') || 'localhost';
  const port = get('PGPORT') || '5432';
  const db = get('PGDATABASE') || 'appointmentapp';
  const auth = user ? `${encodeURIComponent(user)}:${encodeURIComponent(pass)}@` : '';
  conn = `postgresql://${auth}${host}:${port}/${db}`;
}

console.log('Using connection string:', conn ? '[masked]' : '<none>');

const pool = new Pool({ connectionString: conn });

async function migrate(){
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`
      CREATE TABLE IF NOT EXISTS timeslots (
        id TEXT PRIMARY KEY,
        date DATE NOT NULL,
        start TEXT NOT NULL,
        end TEXT,
        capacity INTEGER NOT NULL DEFAULT 1,
        published BOOLEAN NOT NULL DEFAULT false
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS devotees (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE,
        phone TEXT,
        recurring BOOLEAN DEFAULT false,
        password TEXT,
        role TEXT
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS registrations (
        id TEXT PRIMARY KEY,
        timeslot_id TEXT REFERENCES timeslots(id) ON DELETE SET NULL,
        devotee_id TEXT REFERENCES devotees(id) ON DELETE CASCADE,
        created_at TIMESTAMP NOT NULL,
        checked_in BOOLEAN DEFAULT false,
        method TEXT
      );
    `);
    await client.query('COMMIT');
    console.log('Migration applied (direct)');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed', err);
  } finally {
    client.release();
    await pool.end();
    process.exit(0);
  }
}

migrate();
