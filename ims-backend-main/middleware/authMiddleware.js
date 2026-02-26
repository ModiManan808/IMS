'use strict';

const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
require('dotenv').config();

/**
 * Authorization middleware factory.
 *
 * @param {string|string[]|undefined} requiredRole
 *   - undefined  → any authenticated user
 *   - 'Admin'    → admin only
 *   - 'Intern'   → any Intern_* role
 *   - ['Admin', 'Intern'] → both
 */
const auth = (requiredRole) => {
  return (req, res, next) => {
    try {
      // Fail-fast: verify secret is properly set
      const JWT_SECRET = process.env.JWT_SECRET;
      if (!JWT_SECRET || JWT_SECRET.length < 32) {
        logger.error('SECURITY: JWT_SECRET misconfigured');
        return res.status(500).json({ error: 'Server configuration error. Contact administrator.' });
      }

      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authorization token missing.' });
      }

      const token = authHeader.slice(7); // safer than split()[1]

      // Check in-memory blacklist (tokens invalidated on logout)
      const { isTokenBlacklisted } = require('../controllers/authController');
      if (isTokenBlacklisted(token)) {
        return res.status(401).json({
          error: 'Your session has been invalidated. Please login again.',
          code: 'TOKEN_BLACKLISTED',
        });
      }

      const payload = jwt.verify(token, JWT_SECRET, {
        algorithms: ['HS256'], // Explicitly allow only HS256 – prevents alg:none attack
      });

      req.user = payload;

      // ── Role check ───────────────────────────────────────────────────────
      if (requiredRole) {
        const allowed = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
        const { role } = payload;
        const hasAccess =
          (allowed.includes('Admin') && role === 'Admin') ||
          (allowed.includes('Intern') && typeof role === 'string' && role.startsWith('Intern_')) ||
          allowed.includes(role);

        if (!hasAccess) {
          logger.warn('Forbidden: insufficient privileges', {
            userId: payload.id,
            userRole: role,
            requiredRole,
            path: req.path,
          });
          return res.status(403).json({ error: 'Insufficient privileges.' });
        }
      }

      next();
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          error: 'Your session has expired. Please login again.',
          code: 'TOKEN_EXPIRED',
        });
      }
      if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
          error: 'Invalid authentication token. Please login again.',
          code: 'INVALID_TOKEN',
        });
      }
      logger.error('Auth middleware error', { message: err.message });
      return res.status(401).json({ error: 'Authentication failed.' });
    }
  };
};

module.exports = auth;
