const { pool } = require('../db_pg');

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
    console.log('Migration applied');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed', err);
  } finally {
    client.release();
    process.exit(0);
  }
}

migrate();
