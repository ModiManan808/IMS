const jwt = require('jsonwebtoken');
require('dotenv').config();

/**
 * Authorization middleware factory.
 * @param {string|string[]} requiredRole Role(s) required to access the route
 *   - 'Admin' for admin only
 *   - 'Intern' for any intern role
 *   - ['Admin', 'Intern'] for both
 * @returns Express middleware
 */
const auth = (requiredRole) => {
    return (req, res, next) => {
        try {
            // SECURITY: Validate JWT_SECRET is properly configured
            const JWT_SECRET = process.env.JWT_SECRET;
            if (!JWT_SECRET || JWT_SECRET === 'sample-key-test-purposes' || JWT_SECRET.length < 32) {
                console.error('SECURITY ERROR: JWT_SECRET is not properly configured!');
                return res.status(500).json({ error: 'Server configuration error. Contact administrator.' });
            }

            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return res.status(401).json({ error: 'Authorization token missing.' });
            }

            const token = authHeader.split(' ')[1];
            const payload = jwt.verify(token, JWT_SECRET);
            req.user = payload;

            if (requiredRole) {
                const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];

                // Check if user role matches any allowed role
                let hasAccess = false;

                if (allowedRoles.includes('Admin') && payload.role === 'Admin') {
                    hasAccess = true;
                } else if (allowedRoles.includes('Intern') && payload.role && payload.role.startsWith('Intern_')) {
                    hasAccess = true;
                } else if (allowedRoles.includes(payload.role)) {
                    hasAccess = true;
                }

                if (!hasAccess) {
                    return res.status(403).json({ error: 'Insufficient privileges.' });
                }
            }

            next();
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({
                    error: 'Your session has expired. Please login again.',
                    code: 'TOKEN_EXPIRED'
                });
            } else if (error.name === 'JsonWebTokenError') {
                return res.status(401).json({
                    error: 'Invalid authentication token. Please login again.',
                    code: 'INVALID_TOKEN'
                });
            }
            return res.status(401).json({ error: 'Authentication failed.' });
        }
    };
};

module.exports = auth;

