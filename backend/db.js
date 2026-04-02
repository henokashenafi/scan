const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

const initDb = async () => {
    const queryText = `
    CREATE TABLE IF NOT EXISTS student_records (
      id SERIAL PRIMARY KEY,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      grade TEXT,
      age INTEGER,
      subjects JSONB,
      filename TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
    try {
        await pool.query(queryText);
        console.log('Database initialized successfully');
    } catch (err) {
        console.error('Error initializing database', err);
    }
};

module.exports = {
    query: (text, params) => pool.query(text, params),
    initDb,
};
