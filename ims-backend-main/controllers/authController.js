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
 * Request password reset - sends email with reset link
 */
exports.requestPasswordReset = async (req, res) => {
    const logger = require('../utils/logger');
    const crypto = require('crypto');
    const { PasswordReset, Intern, Admin } = require('../models');
    const sendEmail = require('../utils/emailService');

    try {
        const { email, applicationNo, userType: requestedUserType } = req.body;

        // Validation based on user type
        if (!requestedUserType || !['admin', 'intern'].includes(requestedUserType)) {
            return res.status(400).json({ error: 'Valid user type is required (admin or intern)' });
        }

        if (requestedUserType === 'admin' && (!email || !email.trim())) {
            return res.status(400).json({ error: 'Email is required for admin accounts' });
        }

        if (requestedUserType === 'intern' && (!applicationNo || !applicationNo.trim())) {
            return res.status(400).json({ error: 'Application number is required for intern accounts' });
        }

        // Check if user exists
        let user = null;
        let userEmail = null;
        let identifier = null;

        if (requestedUserType === 'admin') {
            user = await Admin.findOne({ where: { email: email.trim() } });
            userEmail = email.trim();
            identifier = email.trim();
        } else {
            user = await Intern.findOne({ where: { applicationNo: applicationNo.trim() } });
            if (user) {
                userEmail = user.personalEmail;
                identifier = applicationNo.trim();
            }
        }

        // Always return success to prevent enumeration
        if (!user) {
            logger.info('Password reset requested for non-existent user', {
                userType: requestedUserType,
                identifier: requestedUserType === 'admin' ? email : applicationNo
            });
            return res.json({
                message: 'If an account exists, a password reset link has been sent.'
            });
        }

        // Generate unique token
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes from now

        // Save token to database
        await PasswordReset.create({
            email: userEmail,
            token,
            expiresAt,
            userType: requestedUserType,
            used: false
        });

        // Send email with reset link (fire-and-forget)
        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${token}`;

        (async () => {
            try {
                await sendEmail(
                    userEmail,
                    'Password Reset Request - IMS Portal',
                    `Dear User,\n\nYou have requested to reset your password. Please click the link below to reset your password:\n\n${resetUrl}\n\nThis link will expire in 30 minutes.\n\nIf you did not request this password reset, please ignore this email.\n\nBest regards,\nIMS Team`
                );
                logger.info('Password reset email sent', {
                    email: userEmail,
                    userType: requestedUserType,
                    identifier
                });

                // If admin password reset, notify super admin
                if (requestedUserType === 'admin' && process.env.SUPER_ADMIN_EMAIL) {
                    await sendEmail(
                        process.env.SUPER_ADMIN_EMAIL,
                        'Admin Password Reset Alert - IMS Portal',
                        `SECURITY ALERT\n\nAn administrator has requested a password reset.\n\nAdmin Email: ${userEmail}\nTime: ${new Date().toLocaleString()}\nReset Link Sent: Yes\n\nIf this was not you or if you did not authorize this action, please investigate immediately.\n\nThis is an automated security notification.\n\nIMS Security Team`
                    );
                    logger.info('Super admin notified of admin password reset', {
                        adminEmail: userEmail,
                        superAdmin: process.env.SUPER_ADMIN_EMAIL
                    });
                }
            } catch (emailError) {
                logger.error('Failed to send password reset email', {
                    email: userEmail,
                    error: emailError.message
                });
            }
        })();

        res.json({
            message: 'If an account exists, a password reset link has been sent.'
        });

    } catch (error) {
        logger.error('Password reset request error', {
            error: error.message,
            stack: error.stack
        });
        res.status(500).json({ error: 'An error occurred. Please try again later.' });
    }
};

/**
 * Verify reset token validity
 */
exports.verifyResetToken = async (req, res) => {
    const logger = require('../utils/logger');
    const { PasswordReset } = require('../models');

    try {
        const { token } = req.params;

        if (!token) {
            return res.status(400).json({ error: 'Token is required' });
        }

        const resetToken = await PasswordReset.findOne({
            where: { token }
        });

        if (!resetToken) {
            return res.status(404).json({ error: 'Invalid or expired reset link' });
        }

        // Check if already used
        if (resetToken.used) {
            return res.status(400).json({ error: 'This reset link has already been used' });
        }

        // Check if expired
        if (new Date() > new Date(resetToken.expiresAt)) {
            return res.status(400).json({ error: 'This reset link has expired' });
        }

        res.json({
            message: 'Token is valid',
            email: resetToken.email,
            userType: resetToken.userType
        });

    } catch (error) {
        logger.error('Token verification error', {
            error: error.message
        });
        res.status(500).json({ error: 'An error occurred. Please try again later.' });
    }
};

/**
 * Reset password using valid token
 */
exports.resetPassword = async (req, res) => {
    const logger = require('../utils/logger');
    const { PasswordReset, Intern, Admin } = require('../models');
    const { hashPassword } = require('../utils/passwordService');

    try {
        const { token } = req.params;
        const { password } = req.body;

        if (!token) {
            return res.status(400).json({ error: 'Token is required' });
        }

        if (!password || password.length < 8) {
            return res.status(400).json({ error: 'Password must be at least 8 characters long' });
        }

        const resetToken = await PasswordReset.findOne({
            where: { token }
        });

        if (!resetToken) {
            return res.status(404).json({ error: 'Invalid or expired reset link' });
        }

        // Check if already used
        if (resetToken.used) {
            return res.status(400).json({ error: 'This reset link has already been used' });
        }

        // Check if expired
        if (new Date() > new Date(resetToken.expiresAt)) {
            return res.status(400).json({ error: 'This reset link has expired' });
        }

        // Hash new password
        const hashedPassword = await hashPassword(password);

        // Update user password based on userType
        if (resetToken.userType === 'admin') {
            const admin = await Admin.findOne({ where: { email: resetToken.email } });
            if (!admin) {
                return res.status(404).json({ error: 'User not found' });
            }
            admin.password = hashedPassword;
            await admin.save();
        } else {
            const intern = await Intern.findOne({ where: { personalEmail: resetToken.email } });
            if (!intern) {
                return res.status(404).json({ error: 'User not found' });
            }
            intern.password = hashedPassword;
            await intern.save();
        }

        // Mark token as used
        resetToken.used = true;
        await resetToken.save();

        logger.info('Password reset successful', {
            email: resetToken.email,
            userType: resetToken.userType
        });

        res.json({ message: 'Password has been reset successfully. You can now login with your new password.' });

    } catch (error) {
        logger.error('Password reset error', {
            error: error.message,
            stack: error.stack
        });
        res.status(500).json({ error: 'An error occurred. Please try again later.' });
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

/**
 * Change Password - allows authenticated users to change their password
 * Requires current password verification for security
 */
exports.changePassword = async (req, res) => {
    const logger = require('../utils/logger');
    const bcrypt = require('bcryptjs');
    const { Admin, Intern } = require('../models');
    const sendEmail = require('../utils/emailService');

    try {
        const { currentPassword, newPassword } = req.body;
        const user = req.user; // Set by authMiddleware

        // Validation
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Current password and new password are required' });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({ error: 'New password must be at least 8 characters long' });
        }

        // Fetch user from database based on userType
        let dbUser = null;
        if (user.userType === 'admin') {
            dbUser = await Admin.findByPk(user.id);
        } else if (user.userType === 'intern') {
            dbUser = await Intern.findByPk(user.id);
        }

        if (!dbUser) {
            logger.warn('User not found for password change', { userId: user.id, userType: user.userType });
            return res.status(404).json({ error: 'User not found' });
        }

        // Verify current password
        const passwordMatch = await bcrypt.compare(currentPassword, dbUser.password);
        if (!passwordMatch) {
            logger.warn('Failed password change attempt - incorrect current password', {
                userId: user.id,
                userType: user.userType
            });
            return res.status(400).json({ error: 'Current password is incorrect' });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password in database
        dbUser.password = hashedPassword;
        await dbUser.save();

        logger.info('Password changed successfully', {
            userId: user.id,
            userType: user.userType,
            timestamp: new Date().toISOString()
        });

        // Send email notification (fire-and-forget)
        const userEmail = user.userType === 'admin' ? dbUser.email : dbUser.personalEmail;
        const userName = dbUser.fullName;

        (async () => {
            try {
                await sendEmail(
                    userEmail,
                    'Password Changed - IMS Portal',
                    `Dear ${userName},

Your password was successfully changed on ${new Date().toLocaleString()}.

If you did not make this change, please contact the administrator immediately.

Account Details:
- User Type: ${user.userType === 'admin' ? 'Administrator' : 'Intern'}
- Email: ${userEmail}
- Changed At: ${new Date().toLocaleString()}

Best regards,
IMS Security Team`
                );
                logger.info('Password change notification email sent', {
                    userId: user.id,
                    email: userEmail
                });
            } catch (emailError) {
                logger.error('Failed to send password change notification', {
                    userId: user.id,
                    error: emailError.message
                });
            }
        })();

        res.json({
            message: 'Password changed successfully'
        });

    } catch (error) {
        logger.error('Password change error', {
            error: error.message,
            stack: error.stack,
            userId: req.user?.id
        });
        res.status(500).json({ error: 'An error occurred while changing password' });
    }
};
