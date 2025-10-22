const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
require('dotenv').config();

const prisma = new PrismaClient();

function verifyPassword(password, stored){
  if (!stored) return false;
  const parts = stored.split('$');
  if (parts.length !== 2) return false;
  const [salt, hash] = parts;
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return derived === hash;
}

async function run(){
  const email = 'akuladatta@gmail.com';
  const user = await prisma.user.findUnique({ where: { email } });
  console.log('User record:', !!user);
  if (!user) { process.exit(1); }
  console.log('Stored password field:', user.password ? '[present]' : '[empty]');
  console.log('Raw stored password:', user.password);
  const test = verifyPassword('Appaji@1942', user.password);
  console.log('Password verification for Appaji@1942:', test);
  await prisma.$disconnect();
}

run().catch(e=>{ console.error(e); process.exit(1); });
