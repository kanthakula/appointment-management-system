const fetch = require('node-fetch');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function sleep(ms){ return new Promise(r=>setTimeout(r, ms)); }

async function main(){
  // create a timeslot with small capacity
  const date = new Date(); date.setDate(date.getDate()+2);
  const ts = await prisma.timeslot.create({ data: { date, start: '09:00', end: '10:00', capacity: 3, remaining: 3, published: true } });
  console.log('Created timeslot', ts.id, 'cap', ts.capacity);

  const attempts = 10;
  const promises = [];
  for (let i=0;i<attempts;i++){
    const email = `concurrent${i}@example.com`;
    const body = `name=User${i}&email=${encodeURIComponent(email)}&phone=900${1000+i}`;
    promises.push(fetch(`http://localhost:3000/register/${ts.id}`, { method: 'POST', headers: { 'Content-Type':'application/x-www-form-urlencoded' }, body }).then(async r=>{
      const text = await r.text();
      return { status: r.status, body: text.slice(0,200) };
    }).catch(err=>({ error: err.message })));
  }

  const results = await Promise.all(promises);
  let success = 0, fail = 0;
  results.forEach(r=>{ if (r.status===200) success++; else fail++; });
  console.log('Results: attempts', attempts, 'success', success, 'fail', fail);

  const count = await prisma.registration.count({ where: { timeslotId: ts.id } });
  console.log('DB registrations for timeslot:', count);

  const regs = await prisma.registration.findMany({ where: { timeslotId: ts.id } });
  console.log('Registration ids:', regs.map(r=>r.id));
  process.exit(0);
}

main().catch(e=>{ console.error(e); process.exit(1); });
