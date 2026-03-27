const express = require('express');
const router = express.Router();
const multer = require('multer');
const FormData = require('form-data');
// node-fetch v3 is ESM-only; use dynamic import() inside the async handler

// Setup Multer for handling file uploads in memory
const upload = multer({ storage: multer.memoryStorage() });

router.post('/', upload.single('document'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // Forward the file to the Python AI Worker
        const formData = new FormData();
        formData.append('file', req.file.buffer, {
            filename: req.file.originalname,
            contentType: req.file.mimetype,
            knownLength: req.file.size
        });

        // The AI Worker runs on port 8000 by default
        const { default: fetch } = await import('node-fetch');
        const aiResponse = await fetch('http://127.0.0.1:8000/process', {
            method: 'POST',
            body: formData,
            // headers are automatically set by form-data including boundry
        });

        if (!aiResponse.ok) {
            console.error('AI Worker error status:', aiResponse.statusText);
            throw new Error(`AI Worker returned ${aiResponse.status}`);
        }

        const data = await aiResponse.json();

        // Return the parsed data to the Next.js frontend
        res.json({ success: true, data: data });

    } catch (error) {
        console.error('Upload Error:', error);
        res.status(500).json({ error: 'Failed to process document', details: error.message });
    }
});

module.exports = router;
