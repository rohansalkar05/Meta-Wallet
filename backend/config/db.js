const { Pool } = require('pg');
require('dotenv').config();

// Initialize PostgreSQL connection pool
// Neon requires SSL connection: ssl: { rejectUnauthorized: false }
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('neon.tech') 
    ? { rejectUnauthorized: false } 
    : false
});

pool.on('connect', () => {
  console.log('Connected to PostgreSQL database successfully.');
});

pool.on('error', (err) => {
  console.error('Unexpected database pool error:', err);
});

module.exports = pool;
