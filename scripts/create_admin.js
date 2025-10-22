const db = require('../db');
const crypto = require('crypto');

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}$${derived}`;
}

async function run(){
  const email = 'akuladatta@gmail.com';
  const password = 'Appaji@1942';
  const existing = await db.devotees.findOne({ email });
  const hash = hashPassword(password);
  if (existing) {
    await db.devotees.update({ id: existing.id }, { $set: { password: hash, role: 'admin' } });
    console.log('Updated admin account for', email);
  } else {
    const id = 'admin-' + Date.now();
    await db.devotees.insert({ id, name: 'Admin', email, phone: null, recurring: 0, password: hash, role: 'admin' });
    console.log('Created admin account for', email);
  }
  process.exit(0);
}

run().catch(err=>{ console.error(err); process.exit(1); });
