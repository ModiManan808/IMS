const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const swaggerUi = require('swagger-ui-express');
const logger = require('./utils/logger');
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

// SECURITY: Add strict security headers
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "blob:"],
        }
    },
    crossOriginResourcePolicy: { policy: "cross-origin" },
    // Hide X-Powered-By header to prevent attackers from knowing we use Express
    hidePoweredBy: true,
    // Prevent clickjacking
    frameguard: { action: 'deny' },
    // Prevent MIME type sniffing
    noSniff: true,
    // Enable HSTS (if using HTTPS)
    hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true
    }
}));

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            logger.warn(`CORS blocked request from origin: ${origin}`);
            callback(null, true); // Allow for now, but log it
        }
    },
    credentials: true
}));

// SECURITY: Enforce strict body size limits to prevent DoS attacks
// Limit payload to 15kb to prevent attackers from crashing memory with huge requests
app.use(express.json({ limit: '15kb' }));
app.use(express.urlencoded({ extended: true, limit: '15kb' }));

// SECURITY: REMOVED insecure static file serving
// Previously: app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// Now all file access requires JWT authentication via /api/files/:filename endpoint

// SECURITY: Global Rate Limiting - Prevent Brute Force and DoS Attacks
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per 15 minutes
    message: 'Too many requests from this IP, please try again after 15 minutes',
    standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
    legacyHeaders: false, // Disable `X-RateLimit-*` headers
    handler: (req, res) => {
        logger.warn('Rate limit exceeded', {
            ip: req.ip,
            path: req.path,
            userAgent: req.get('user-agent')
        });
        res.status(429).json({
            error: 'Too many requests from this IP, please try again after 15 minutes'
        });
    }
});

// Apply global rate limiting to all API routes
app.use('/api', globalLimiter);

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
            logger.warn('File upload size limit exceeded', { ip: req.ip });
            return res.status(400).json({ error: 'File too large. Maximum size is 1MB.' });
        }
    }

    // Handle body parser errors (payload too large)
    if (err.type === 'entity.too.large') {
        logger.warn('Request payload too large', { ip: req.ip });
        return res.status(413).json({ error: 'Payload too large. Maximum size is 15kb.' });
    }

    if (err) {
        logger.error('Unhandled error in middleware', {
            error: err.message,
            stack: err.stack,
            path: req.path,
            ip: req.ip
        });
        return res.status(500).json({ error: 'Internal server error' });
    }
    next();
});

// SECURITY: Global uncaught exception handler to prevent crashes
process.on('uncaughtException', (error) => {
    logger.error('UNCAUGHT EXCEPTION - Process will exit', {
        error: error.message,
        stack: error.stack
    });

    // Give the logger time to write, then exit
    setTimeout(() => {
        process.exit(1);
    }, 1000);
});

// SECURITY: Global unhandled rejection handler
process.on('unhandledRejection', (reason, promise) => {
    logger.error('UNHANDLED REJECTION', {
        reason: reason,
        promise: promise
    });
});

// Start Server
const startServer = async () => {
    try {
        // Sync Database (Sequelize)
        await initDB();
        logger.info('Database initialized successfully');

        const server = app.listen(PORT, () => {
            logger.info(`Server running on port ${PORT}`);
            logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
            logger.info(`API Documentation available at http://localhost:${PORT}/docs`);
        });

        // SECURITY: Set server timeout to prevent Slowloris attacks
        // Kill connections that hang for more than 5 seconds
        server.setTimeout(5000);

        server.on('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                const fallbackPort = PORT + 1;
                logger.warn(`Port ${PORT} in use. Retrying on ${fallbackPort}...`);
                app.listen(fallbackPort, () => {
                    logger.info(`Server running on fallback port ${fallbackPort}`);
                });
                return;
            }
            logger.error('Server failed to start', { error: err.message, stack: err.stack });
        });
    } catch (error) {
        logger.error('Unable to connect to the database', {
            error: error.message,
            stack: error.stack
        });
        process.exit(1);
    }
};

startServer();