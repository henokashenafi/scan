const express = require('express');
const axios = require('axios');
const router = express.Router();
const multer = require('multer');

// Setup Multer for handling file uploads in memory
const upload = multer({ storage: multer.memoryStorage() });

router.post('/', upload.single('document'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // Forward the file to the Python AI Worker
        const formData = new FormData();
        const blob = new Blob([req.file.buffer], { type: req.file.mimetype });
        formData.append('file', blob, req.file.originalname);

        // Using axios for more robust timeout handling
        console.log(`[${new Date().toISOString()}] Forwarding file to AI Worker: ${req.file.originalname}`);
        const startTime = Date.now();
        
        try {
            const aiResponse = await axios.post('http://127.0.0.1:8001/process', formData, {
                timeout: 600000, // 10 minutes
                headers: {
                    ...formData.getHeaders ? formData.getHeaders() : { 'Content-Type': 'multipart/form-data' }
                }
            });

            const duration = (Date.now() - startTime) / 1000;
            console.log(`[${new Date().toISOString()}] AI Worker responded in ${duration}s`);
            
            const data = aiResponse.data;
            res.json({ success: true, data: data });
        } catch (error) {
            const duration = (Date.now() - startTime) / 1000;
            console.error(`[${new Date().toISOString()}] AI Worker error after ${duration}s:`, error.message);
            throw error;
        }

    } catch (error) {
        console.error('Upload Error:', error);
        const errorMessage = error.response?.data?.detail || error.message;
        res.status(500).json({ error: 'Failed to process document', details: errorMessage });
    }
});

module.exports = router;
