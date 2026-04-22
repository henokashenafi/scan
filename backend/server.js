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

const { initSchema } = require('./db');

// Import and use routes
const uploadRouter = require('./routes/upload');
const exportRouter = require('./routes/export');
const recordsRouter = require('./routes/records');
app.use('/api/upload', uploadRouter);
app.use('/api/export', exportRouter);
app.use('/api/records', recordsRouter);

// Init DB schema then start server
initSchema().then(() => {
    app.listen(port, () => {
        console.log(`Backend server listening at http://localhost:${port}`);
    });
}).catch(err => {
    console.error('Failed to initialize database:', err.message);
    console.log('Starting server without database...');
    app.listen(port, () => {
        console.log(`Backend server listening at http://localhost:${port}`);
    });
});
