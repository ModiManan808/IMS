'use strict';

const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const logger = require('./utils/logger');
require('dotenv').config();

// ── Startup env validation ───────────────────────────────────────────────────
const REQUIRED_ENV = ['JWT_SECRET', 'NODE_ENV'];
const missing = REQUIRED_ENV.filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`FATAL: Missing required environment variables: ${missing.join(', ')}`);
  process.exit(1);
}

// SECURITY: Refuse to start in production with weak secrets
if (
  process.env.NODE_ENV === 'production' &&
  (
    !process.env.JWT_SECRET ||
    process.env.JWT_SECRET.length < 32 ||
    process.env.JWT_SECRET === 'sample-key-test-purposes'
  )
) {
  console.error('FATAL: JWT_SECRET is too weak for production. Use a 32+ char random string.');
  process.exit(1);
}

// ── Imports ──────────────────────────────────────────────────────────────────
const { initDB } = require('./models');
const apiRoutes = require('./routes/apiRoutes');
const swaggerSpec = require('./docs/swagger');

const app = express();
const PORT = parseInt(process.env.PORT, 10) || 5000;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// ── Trust proxy (needed for rate-limiting behind Nginx/Render/Railway) ───────
// Set to 1 if behind one proxy, or true if behind many. Adjust as needed.
app.set('trust proxy', 1);

// ── CORS ─────────────────────────────────────────────────────────────────────
const ALLOWED_ORIGINS = [
  process.env.FRONTEND_URL,
  ...(IS_PRODUCTION ? [] : ['http://localhost:3000', 'http://localhost:3759']),
].filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      // Allow REST clients / mobile apps with no origin header
      if (!origin) return callback(null, true);
      if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
      logger.warn('CORS blocked', { origin });
      callback(new Error('CORS policy: origin not allowed'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ── Security headers (Helmet) ────────────────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'blob:'],
      },
    },
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    hidePoweredBy: true,
    frameguard: { action: 'deny' },
    noSniff: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    hsts: IS_PRODUCTION
      ? { maxAge: 31_536_000, includeSubDomains: true, preload: true }
      : false,
  })
);

// ── HTTP request logging ─────────────────────────────────────────────────────
app.use(
  morgan(IS_PRODUCTION ? 'combined' : 'dev', {
    stream: logger.stream,
    // Skip health-check noise in logs
    skip: (req) => req.path === '/health',
  })
);

// ── Body parsers ─────────────────────────────────────────────────────────────
// Keep payloads small to prevent DoS
app.use(express.json({ limit: '15kb' }));
app.use(express.urlencoded({ extended: true, limit: '15kb' }));

// ── Global rate limiter ───────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: IS_PRODUCTION ? 100 : 500,
  standardHeaders: true,
  legacyHeaders: false,
  handler(req, res) {
    logger.warn('Global rate limit exceeded', { ip: req.ip, path: req.path });
    res.status(429).json({
      error: 'Too many requests from this IP. Please try again after 15 minutes.',
    });
  },
});
app.use('/api', globalLimiter);

// ── Health check (before routes, no auth) ────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// ── API routes ────────────────────────────────────────────────────────────────
app.use('/api', apiRoutes);

// ── Swagger docs (disable in production or protect behind auth) ───────────────
if (!IS_PRODUCTION) {
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true }));
  app.get('/docs.json', (_req, res) => res.json(swaggerSpec));
}

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ── Global error handler ──────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _next) => {
  // Multer file-size error
  if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
    logger.warn('File too large', { ip: req.ip });
    return res.status(400).json({ error: 'File too large. Maximum size is 1 MB.' });
  }

  // Body-parser payload-too-large
  if (err.type === 'entity.too.large') {
    logger.warn('Payload too large', { ip: req.ip });
    return res.status(413).json({ error: 'Payload too large. Maximum 15 kb.' });
  }

  // CORS rejection
  if (err.message && err.message.startsWith('CORS')) {
    return res.status(403).json({ error: err.message });
  }

  // Everything else
  logger.error('Unhandled error', {
    message: err.message,
    stack: IS_PRODUCTION ? undefined : err.stack,
    path: req.path,
    ip: req.ip,
  });
  res.status(500).json({ error: 'Internal server error' });
});

// ── Process-level safety nets ─────────────────────────────────────────────────
process.on('uncaughtException', (error) => {
  logger.error('UNCAUGHT EXCEPTION – shutting down', { message: error.message, stack: error.stack });
  setTimeout(() => process.exit(1), 1000);
});

process.on('unhandledRejection', (reason) => {
  logger.error('UNHANDLED REJECTION', { reason: String(reason) });
});

// ── Bootstrap ─────────────────────────────────────────────────────────────────
const startServer = async () => {
  try {
    await initDB();
    logger.info('Database initialised');

    const server = app.listen(PORT, () => {
      logger.info(`Server listening on port ${PORT} [${process.env.NODE_ENV}]`);
      if (!IS_PRODUCTION) {
        logger.info(`Swagger UI → http://localhost:${PORT}/docs`);
      }
    });

    // Guard against Slowloris attacks
    server.setTimeout(10_000);

    // Graceful shutdown
    const shutdown = (signal) => {
      logger.info(`${signal} received – shutting down gracefully`);
      server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
      });
      // Force quit after 10 s if connections hang
      setTimeout(() => process.exit(1), 10_000);
    };
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (err) {
    logger.error('Failed to start server', { message: err.message, stack: err.stack });
    process.exit(1);
  }
};

startServer();
