const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const swaggerUi = require('swagger-ui-express');
require('dotenv').config();

// 1. Import Database & Models
const { initDB } = require('./models'); // Imports index.js from models

// 2. Import Your Routes
const apiRoutes = require('./routes/apiRoutes'); // <--- IMPORTED HERE
const swaggerSpec = require('./docs/swagger');

const app = express();
const PORT = parseInt(process.env.PORT, 10) || 5000;

// Middleware - CORS Configuration
const allowedOrigins = [
    'http://localhost:3759',
    'https://hydraulic-visiting-patents-rejected.trycloudflare.com',
    'https://issue-engaged-anything-supporting.trycloudflare.com',
    process.env.FRONTEND_URL
].filter(Boolean);

// SECURITY: Add security headers (fixes missing X-Frame-Options, CSP, etc.)
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "blob:"],
        }
    },
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            console.warn(`CORS blocked request from origin: ${origin}`);
            callback(null, true); // Allow for now, but log it
        }
    },
    credentials: true
}));
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true }));

// Serve Static files (for accessing uploaded photos later if needed)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rate Limiting - Prevent Brute Force Attacks (S-03)
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 requests per windowMs
    message: 'Too many login attempts from this IP, please try again after 15 minutes',
    standardHeaders: true,
    legacyHeaders: false,
});

// Apply rate limiting to login endpoint specifically
app.use('/api/login', loginLimiter);

// 3. Mount Routes
// This prefixes all routes in that file with '/api'
// Example: The route '/apply' becomes 'localhost:5000/api/apply'
app.use('/api', apiRoutes);  // <--- MOUNTED HERE

// API Documentation
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true }));
app.get('/docs.json', (req, res) => res.json(swaggerSpec));

// Global Error Handler (Catches Multer File Size Errors)
app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'File too large. Maximum size is 1MB.' });
        }
    }
    if (err) {
        return res.status(500).json({ error: err.message });
    }
    next();
});

// Start Server
const startServer = async () => {
    try {
        // Sync Database (Sequelize)
        await initDB();

        const server = app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });

        server.on('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                const fallbackPort = PORT + 1;
                console.warn(`Port ${PORT} in use. Retrying on ${fallbackPort}...`);
                app.listen(fallbackPort, () => {
                    console.log(`Server running on fallback port ${fallbackPort}`);
                });
                return;
            }
            console.error('Server failed to start:', err);
        });
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
};

startServer();