const express = require('express');
const router = express.Router();
const { pool } = require('../db');

// POST /api/records — save extracted student records
router.post('/', async (req, res) => {
    const { filename, students, columns } = req.body;
    if (!students || !students.length) {
        return res.status(400).json({ error: 'No student data provided' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const sessionResult = await client.query(
            'INSERT INTO scan_sessions (filename) VALUES ($1) RETURNING id',
            [filename || 'unknown']
        );
        const sessionId = sessionResult.rows[0].id;

        for (const student of students) {
            const { first_name, last_name, ...scores } = student;
            await client.query(
                'INSERT INTO student_records (session_id, first_name, last_name, scores) VALUES ($1, $2, $3, $4)',
                [sessionId, first_name || '', last_name || '', JSON.stringify(scores)]
            );
        }

        await client.query('COMMIT');
        res.json({ success: true, session_id: sessionId, saved: students.length });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Save error:', err);
        res.status(500).json({ error: 'Failed to save records', details: err.message });
    } finally {
        client.release();
    }
});

// GET /api/records — list all sessions with record counts
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT s.id, s.filename, s.created_at, COUNT(r.id)::int AS record_count
            FROM scan_sessions s
            LEFT JOIN student_records r ON r.session_id = s.id
            GROUP BY s.id ORDER BY s.created_at DESC
        `);
        res.json({ sessions: result.rows });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch records', details: err.message });
    }
});

// GET /api/records/:sessionId — get all students in a session
router.get('/:sessionId', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM student_records WHERE session_id = $1 ORDER BY id',
            [req.params.sessionId]
        );
        res.json({ students: result.rows });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch session', details: err.message });
    }
});

module.exports = router;
