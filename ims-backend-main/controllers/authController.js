const jwt = require('jsonwebtoken');
const { Intern, Admin } = require('../models');
const { verifyPassword } = require('../utils/passwordService');
const Validator = require('../utils/validator');
require('dotenv').config();

/**
 * Login for both Admin and Intern
 * Admin: username + password
 * Intern: applicationNo (username) + password
 */
exports.login = async (req, res) => {
    const logger = require('../utils/logger');

    try {
        // Validate and sanitize inputs
        const validation = Validator.validateLogin(req.body);

        if (!validation.valid) {
            // Log validation errors for debugging, but return generic message
            logger.warn('Login validation failed', {
                errors: validation.errors,
                ip: req.ip,
                userAgent: req.get('user-agent')
            });

            // Use generic error message to prevent user enumeration
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const { username, password, userType } = validation.sanitized;

        let user;
        let role;

        // Database query with timeout handling
        const queryTimeout = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Database query timeout')), 5000)
        );

        if (userType === 'admin') {
            user = await Promise.race([
                Admin.findOne({ where: { username } }),
                queryTimeout
            ]);
            role = 'Admin';
        } else {
            // Intern login with applicationNo as username
            user = await Promise.race([
                Intern.findOne({ where: { applicationNo: username } }),
                queryTimeout
            ]);

            if (user) {
                // Check if intern is approved and active
                if (user.status !== 'Active' || user.role !== 'Intern_approved&ongoing') {
                    logger.info('Inactive intern login attempt', {
                        applicationNo: username,
                        status: user.status,
                        role: user.role
                    });

                    return res.status(403).json({
                        error: 'Your account is not active. Please contact administrator.'
                    });
                }
                role = user.role;
            }
        }

        if (!user) {
            logger.info('Login attempt for non-existent user', {
                username,
                userType,
                ip: req.ip
            });
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Verify password with timeout protection
        const passwordTimeout = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Password verification timeout')), 3000)
        );

        let isValidPassword;
        try {
            isValidPassword = await Promise.race([
                verifyPassword(password, user.password),
                passwordTimeout
            ]);
        } catch (error) {
            logger.error('Password verification error', {
                error: error.message,
                username,
                userType
            });
            return res.status(500).json({ error: 'Authentication service temporarily unavailable' });
        }

        if (!isValidPassword) {
            logger.info('Invalid password attempt', {
                username,
                userType,
                ip: req.ip
            });
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate JWT token
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            logger.error('FATAL: JWT_SECRET is not defined in environment variables');
            return res.status(500).json({ error: 'Server configuration error. Contact administrator.' });
        }

        const token = jwt.sign(
            {
                id: user.id,
                username: userType === 'admin' ? user.username : user.applicationNo,
                role: role,
                userType: userType
            },
            jwtSecret,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        // Return user info (without password)
        const userInfo = userType === 'admin'
            ? {
                id: user.id,
                username: user.username,
                email: user.email,
                fullName: user.fullName,
                role: 'Admin'
            }
            : {
                id: user.id,
                applicationNo: user.applicationNo,
                fullName: user.fullName,
                email: user.personalEmail,
                role: user.role,
                status: user.status
            };

        logger.info('Successful login', {
            userId: user.id,
            userType,
            ip: req.ip
        });

        res.json({
            message: 'Login successful',
            token,
            user: userInfo
        });
    } catch (error) {
        logger.error('Login error', {
            error: error.message,
            stack: error.stack,
            ip: req.ip
        });

        // Don't expose internal errors to client
        res.status(500).json({ error: 'An error occurred during login. Please try again.' });
    }
};

/**
 * Logout (client-side token removal, but can add token blacklist here)
 */
exports.logout = async (req, res) => {
    // In a stateless JWT system, logout is handled client-side by removing the token
    // For enhanced security, you could implement a token blacklist here
    res.json({ message: 'Logged out successfully' });
};
