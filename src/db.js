const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'postgres',
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'dongpeng_crm',
  max: 20,
});

module.exports = { pool };
