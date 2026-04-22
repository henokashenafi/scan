const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

const initSchema = async () => {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS scan_sessions (
            id SERIAL PRIMARY KEY,
            filename TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS student_records (
            id SERIAL PRIMARY KEY,
            session_id INTEGER REFERENCES scan_sessions(id) ON DELETE CASCADE,
            first_name TEXT,
            last_name TEXT,
            scores JSONB,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
    `);
    console.log('Database schema ready.');
};

module.exports = { pool, initSchema };
