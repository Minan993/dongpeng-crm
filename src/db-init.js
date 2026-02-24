require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { pool } = require('./db');

async function main() {
  const sql = fs.readFileSync(path.join(__dirname, '../sql/init.sql'), 'utf8');
  await pool.query(sql);
  console.log('Database initialized');
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
