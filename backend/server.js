const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());

// Set up basic health route
app.get('/api/health', (req, res) => {
    res.json({ status: 'healthy', message: 'Backend is running' });
});

// Import and use routes
const uploadRouter = require('./routes/upload');
app.use('/api/upload', uploadRouter);

// Start server
app.listen(port, () => {
    console.log(`Backend server listening at http://localhost:${port}`);
});
