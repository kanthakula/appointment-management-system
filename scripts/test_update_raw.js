const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main(){
  const id = 'cmgugvqta0000itiyz70ero7a';
  const res = await prisma.$queryRaw`UPDATE "Timeslot" SET remaining = remaining - 1 WHERE id = ${id} AND remaining > 0 RETURNING *`;
  console.log('raw result:', res);
  const ts = await prisma.timeslot.findUnique({ where: { id } });
  console.log('timeslot now:', ts);
  process.exit(0);
}

main().catch(e=>{ console.error(e); process.exit(1); });
