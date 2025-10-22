require('dotenv').config();
const keys = ['DATABASE_URL','PG_CONNECTION','PGHOST','PGPORT','PGUSER','PGPASSWORD','PGDATABASE','USER'];
console.log('Postgres env check:');
keys.forEach(k=>{
  const v = process.env[k];
  console.log(k, '=>', v === undefined ? '<undefined>' : (v === '' ? '<empty string>' : v), ' (type:', typeof v, ')');
});
console.log('\nNode version:', process.version);
