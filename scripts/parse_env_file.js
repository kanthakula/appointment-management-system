const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const envPath = path.join(__dirname, '..', '.env');
if (!fs.existsSync(envPath)) {
  console.error('.env not found at', envPath);
  process.exit(1);
}
const content = fs.readFileSync(envPath, 'utf8');
const parsed = dotenv.parse(content);
console.log('Parsed .env file (raw):');
Object.keys(parsed).forEach(k=>{
  const v = parsed[k];
  console.log(k, '=>', v === '' ? '<empty string>' : v);
});
