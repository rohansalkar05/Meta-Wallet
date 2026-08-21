const pool = require('../config/db');

const createUsersTableQuery = `
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password TEXT NOT NULL
);
`;

async function initDatabase() {
  try {
    console.log('Testing PostgreSQL connection and initializing table schema...');
    await pool.query(createUsersTableQuery);
    console.log('✅ "users" table initialized successfully in PostgreSQL database.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error initializing database schema:', err.message);
    process.exit(1);
  }
}

initDatabase();
