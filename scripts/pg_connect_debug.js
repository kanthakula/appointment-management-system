const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { Pool } = require('pg');

const envPath = path.join(__dirname, '..', '.env');
const env = dotenv.parse(fs.readFileSync(envPath));

const host = (env.PGHOST || 'localhost').trim();
const port = env.PGPORT ? parseInt(env.PGPORT,10) : 5432;
const user = (env.PGUSER || process.env.USER || '').trim();
const passRaw = env.PGPASSWORD;
const passType = typeof passRaw;
const passLen = passRaw ? passRaw.length : 0;
const database = (env.PGDATABASE || 'appointmentapp').trim();

console.log('PG config: host=%s port=%s user=%s database=%s', host, port, user, database);
console.log('Password type:', passType, 'length:', passLen);

const config = { host, port, user, database };
if (passRaw !== undefined && passRaw !== '') config.password = String(passRaw);

console.log('Config object (masked):', Object.assign({}, config, { password: config.password ? '*****' : undefined }));

async function run(){
  const pool = new Pool(config);
  try {
    const client = await pool.connect();
    console.log('Connected ok');
    client.release();
  } catch (err) {
    console.error('Connect error:', err && err.message);
    console.error(err);
  } finally {
    await pool.end();
  }
}

run();
