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
    try {
        // Validate and sanitize inputs
        const validation = Validator.validateLogin(req.body);

        if (!validation.valid) {
            // Use generic error message to prevent user enumeration
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const { username, password, userType } = validation.sanitized;

        console.log('Login attempt:', { username, userType, hasPassword: !!password });

        let user;
        let role;

        if (userType === 'admin') {
            user = await Admin.findOne({ where: { username } });
            console.log('Admin lookup:', user ? `Found admin ID ${user.id}` : 'Admin not found');
            role = 'Admin';
        } else {
            // Intern login with applicationNo as username
            user = await Intern.findOne({ where: { applicationNo: username } });

            if (!user) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            // Check if intern is approved and active
            if (user.status !== 'Active' || user.role !== 'Intern_approved&ongoing') {
                return res.status(403).json({
                    error: 'Your account is not active. Please contact administrator.'
                });
            }

            role = user.role;
        }

        if (!user) {
            console.log('User not found');
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Verify password
        console.log('Verifying password...');
        const isValidPassword = await verifyPassword(password, user.password);
        console.log('Password verification result:', isValidPassword);

        if (!isValidPassword) {
            console.log('Password verification failed');
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        console.log('Login successful for:', username);

        // Generate JWT token
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            console.error('FATAL ERROR: JWT_SECRET is not defined in environment variables');
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

        res.json({
            message: 'Login successful',
            token,
            user: userInfo
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
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
