const { Pool } = require('pg');
require('dotenv').config({ override: true });
const url = require('url');

let pool;
if (process.env.DATABASE_URL || process.env.PG_CONNECTION) {
  const cs = process.env.DATABASE_URL || process.env.PG_CONNECTION;
  pool = new Pool({ connectionString: cs });
} else {
  // build config from individual env vars or fallback to localhost DB name
  const config = {
    host: process.env.PGHOST || 'localhost',
    port: process.env.PGPORT ? parseInt(process.env.PGPORT, 10) : 5432,
    user: process.env.PGUSER || process.env.USER,
    database: process.env.PGDATABASE || 'appointmentapp'
  };
  // only add password when it's provided and non-empty
  if (typeof process.env.PGPASSWORD !== 'undefined' && process.env.PGPASSWORD !== '') {
    config.password = String(process.env.PGPASSWORD);
  }
  pool = new Pool(config);
}

async function query(text, params) {
  const res = await pool.query(text, params);
  return res;
}

module.exports = { pool, query };
