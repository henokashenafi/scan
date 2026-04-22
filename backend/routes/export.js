const express = require('express');
const router = express.Router();

// POST /api/export/csv
router.post('/csv', (req, res) => {
    const { students, columns } = req.body;
    if (!students || !students.length) {
        return res.status(400).json({ error: 'No data to export' });
    }

    const headers = ['first_name', 'last_name', ...(columns || [])];
    const csvRows = [
        headers.join(','),
        ...students.map(s =>
            headers.map(h => {
                const val = s[h] ?? '';
                // Wrap in quotes if contains comma or is a string with spaces
                return typeof val === 'string' && (val.includes(',') || val.includes('"'))
                    ? `"${val.replace(/"/g, '""')}"`
                    : val;
            }).join(',')
        )
    ];

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="student_records.csv"');
    res.send('\uFEFF' + csvRows.join('\n')); // BOM for Excel UTF-8 compatibility
});

// POST /api/export/json
router.post('/json', (req, res) => {
    const { students, columns } = req.body;
    if (!students || !students.length) {
        return res.status(400).json({ error: 'No data to export' });
    }
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="student_records.json"');
    res.json({ columns, students });
});

module.exports = router;
