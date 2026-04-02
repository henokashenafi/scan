const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all records with filtering and searching
router.get('/', async (req, res) => {
    try {
        const { search, grade, sortField, sortOrder } = req.query;
        let queryText = 'SELECT * FROM student_records WHERE 1=1';
        const params = [];

        if (search) {
            params.push(`%${search}%`);
            queryText += ` AND (first_name ILIKE $${params.length} OR last_name ILIKE $${params.length})`;
        }

        if (grade) {
            params.push(grade);
            queryText += ` AND grade = $${params.length}`;
        }

        if (sortField) {
            const order = sortOrder === 'desc' ? 'DESC' : 'ASC';
            // Basic protection against SQL injection for column names
            const allowedFields = ['first_name', 'last_name', 'grade', 'age', 'created_at'];
            if (allowedFields.includes(sortField)) {
                queryText += ` ORDER BY ${sortField} ${order}`;
            }
        } else {
            queryText += ' ORDER BY created_at DESC';
        }

        const result = await db.query(queryText, params);
        res.json(result.rows);
    } catch (err) {
        console.error('Analytics Error:', err);
        res.status(500).json({ error: 'Failed to fetch analytics data' });
    }
});

module.exports = router;
