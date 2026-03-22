'use strict';

const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { Intern, Admin, PasswordReset } = require('../models');
const { verifyPassword, hashPassword } = require('../utils/passwordService');
const Validator = require('../utils/validator');
const sendEmail = require('../utils/emailService');
const logger = require('../utils/logger');
require('dotenv').config();

// ── Token blacklist (in-memory) ───────────────────────────────────────────────
// NOTE: This resets on server restart — tokens issued before restart remain valid
// until they naturally expire. For multi-instance production, replace with Redis.
// E.g.: const redis = require('./utils/redis'); redis.set(token, '1', 'EX', ttlSeconds);
const tokenBlacklist = new Set();

exports.isTokenBlacklisted = (token) => tokenBlacklist.has(token);

// ── Helpers ───────────────────────────────────────────────────────────────────
/**
 * Returns { valid, message } for a password string.
 * Used on password reset and change.
 */
function validatePasswordStrength(password) {
  if (!password || typeof password !== 'string')
    return { valid: false, message: 'Password is required' };
  if (password.length < 8)
    return { valid: false, message: 'Password must be at least 8 characters' };
  if (password.length > 128)
    return { valid: false, message: 'Password too long (max 128 characters)' };
  if (!/[A-Z]/.test(password))
    return { valid: false, message: 'Password must contain at least one uppercase letter' };
  if (!/[a-z]/.test(password))
    return { valid: false, message: 'Password must contain at least one lowercase letter' };
  if (!/[0-9]/.test(password))
    return { valid: false, message: 'Password must contain at least one number' };
  if (!/[^A-Za-z0-9]/.test(password))
    return { valid: false, message: 'Password must contain at least one special character' };
  return { valid: true };
}

// ── Login ─────────────────────────────────────────────────────────────────────
exports.login = async (req, res) => {
  try {
    const validation = Validator.validateLogin(req.body);
    if (!validation.valid) {
      logger.warn('Login validation failed', { errors: validation.errors, ip: req.ip });
      // Generic message — don't hint at what was wrong (user enumeration prevention)
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const { username, password, userType } = validation.sanitized;

    // Parallel DB query + timeout guard
    const DB_TIMEOUT = 5_000;
    const timeout = (ms) => new Promise((_, rej) => setTimeout(() => rej(new Error('DB timeout')), ms));

    let user, role;

    if (userType === 'admin') {
      user = await Promise.race([
        Admin.findOne({ where: { username } }),
        timeout(DB_TIMEOUT),
      ]);
      role = 'Admin';
    } else {
      user = await Promise.race([
        Intern.findOne({ where: { applicationNo: username } }),
        timeout(DB_TIMEOUT),
      ]);
      if (user) {
        if (user.status !== 'Active' || user.role !== 'Intern_approved&ongoing') {
          logger.info('Inactive intern login attempt', { applicationNo: username, ip: req.ip });
          return res.status(403).json({ error: 'Your account is not active. Contact administrator.' });
        }
        // Prevent login before the internship start date
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        const joiningDate = new Date(user.dateOfJoining);
        joiningDate.setHours(0, 0, 0, 0);
        if (joiningDate > todayDate) {
          const formatted = joiningDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
          logger.info('Intern login before start date', { applicationNo: username, dateOfJoining: user.dateOfJoining, ip: req.ip });
          return res.status(403).json({ error: `Your internship begins on ${formatted}. Login will be available from that date.` });
        }
        role = user.role;
      }
    }

    if (!user) {
      logger.info('Login: user not found', { username, userType, ip: req.ip });
      // Add a small delay to resist timing attacks when user not found vs wrong password
      await new Promise((r) => setTimeout(r, 200));
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password (bcrypt timing is roughly constant, but guard with timeout)
    let isValid;
    try {
      isValid = await Promise.race([verifyPassword(password, user.password), timeout(3_000)]);
    } catch {
      return res.status(500).json({ error: 'Authentication service temporarily unavailable' });
    }

    if (!isValid) {
      logger.info('Login: wrong password', { username, userType, ip: req.ip });
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Sign JWT
    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      logger.error('FATAL: JWT_SECRET not defined');
      return res.status(500).json({ error: 'Server configuration error.' });
    }

    const token = jwt.sign(
      {
        id: user.id,
        username: userType === 'admin' ? user.username : user.applicationNo,
        role,
        userType,
      },
      JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d', algorithm: 'HS256' }
    );

    const userInfo =
      userType === 'admin'
        ? { id: user.id, username: user.username, email: user.email, fullName: user.fullName, role: 'Admin' }
        : { id: user.id, applicationNo: user.applicationNo, fullName: user.fullName, email: user.personalEmail, role, status: user.status, passportPhoto: user.passportPhoto || null };

    logger.info('Successful login', { userId: user.id, userType, ip: req.ip });

    return res.json({ message: 'Login successful', token, user: userInfo });
  } catch (err) {
    logger.error('Login error', { message: err.message, ip: req.ip });
    return res.status(500).json({ error: 'An error occurred during login. Please try again.' });
  }
};

// ── Request password reset ────────────────────────────────────────────────────
exports.requestPasswordReset = async (req, res) => {
  try {
    const { email, applicationNo, userType: reqType } = req.body;

    if (!reqType || !['admin', 'intern'].includes(reqType))
      return res.status(400).json({ error: 'Valid user type required (admin or intern)' });
    if (reqType === 'admin' && !email?.trim())
      return res.status(400).json({ error: 'Email is required for admin accounts' });
    if (reqType === 'intern' && !applicationNo?.trim())
      return res.status(400).json({ error: 'Application number is required for intern accounts' });

    let user = null;
    let userEmail = null;
    let identifier = null;

    if (reqType === 'admin') {
      user = await Admin.findOne({ where: { email: email.trim() } });
      userEmail = email.trim();
      identifier = email.trim();
    } else {
      user = await Intern.findOne({ where: { applicationNo: applicationNo.trim() } });
      if (user) {
        // Only active interns should be eligible for password reset
        if (user.status !== 'Active' || user.role !== 'Intern_approved&ongoing') {
          logger.info('Reset requested for inactive intern', {
            applicationNo: applicationNo.trim(),
            status: user.status,
            role: user.role,
          });
          user = null;
        } else {
          userEmail = user.personalEmail;
          identifier = applicationNo.trim();
        }
      }
    }

    // Always respond with the same message to prevent user enumeration
    const GENERIC_RESPONSE = { message: 'If an account exists, a password reset link has been sent.' };

    if (!user) {
      logger.info('Reset requested for unknown user', { identifier, reqType });
      return res.json(GENERIC_RESPONSE);
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 30 * 60_000); // 30 min

    await PasswordReset.create({ email: userEmail, token, expiresAt, userType: reqType, used: false });

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${token}`;

    // Fire-and-forget email
    setImmediate(async () => {
      try {
        await sendEmail(
          userEmail,
          'Password Reset Request – IMS Portal',
          `You requested a password reset. Click the link below (expires in 30 minutes):\n\n${resetUrl}\n\nIf you did not request this, ignore this email.\n\n– IMS Team`
        );
        logger.info('Reset email sent', { email: userEmail, reqType });

        // Notify super-admin when an admin resets password
        if (reqType === 'admin' && process.env.SUPER_ADMIN_EMAIL) {
          await sendEmail(
            process.env.SUPER_ADMIN_EMAIL,
            'SECURITY ALERT: Admin Password Reset – IMS',
            `Admin password reset requested.\nEmail: ${userEmail}\nTime: ${new Date().toUTCString()}\nAction required if unauthorised.`
          );
        }
      } catch (e) {
        logger.error('Reset email failed', { email: userEmail, message: e.message });
      }
    });

    return res.json(GENERIC_RESPONSE);
  } catch (err) {
    logger.error('requestPasswordReset error', { message: err.message });
    return res.status(500).json({ error: 'An error occurred. Please try again later.' });
  }
};

// ── Verify reset token ────────────────────────────────────────────────────────
exports.verifyResetToken = async (req, res) => {
  try {
    const { token } = req.params;
    if (!token) return res.status(400).json({ error: 'Token is required' });

    const record = await PasswordReset.findOne({ where: { token } });
    if (!record) return res.status(404).json({ error: 'Invalid or expired reset link' });
    if (record.used) return res.status(400).json({ error: 'This reset link has already been used' });
    if (new Date() > new Date(record.expiresAt))
      return res.status(400).json({ error: 'This reset link has expired' });

    return res.json({ message: 'Token is valid', email: record.email, userType: record.userType });
  } catch (err) {
    logger.error('verifyResetToken error', { message: err.message });
    return res.status(500).json({ error: 'An error occurred. Please try again later.' });
  }
};

// ── Reset password ────────────────────────────────────────────────────────────
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!token) return res.status(400).json({ error: 'Token is required' });

    const strength = validatePasswordStrength(password);
    if (!strength.valid) return res.status(400).json({ error: strength.message });

    const record = await PasswordReset.findOne({ where: { token } });
    if (!record) return res.status(404).json({ error: 'Invalid or expired reset link' });
    if (record.used) return res.status(400).json({ error: 'This reset link has already been used' });
    if (new Date() > new Date(record.expiresAt))
      return res.status(400).json({ error: 'This reset link has expired' });

    const hashed = await hashPassword(password);

    if (record.userType === 'admin') {
      const admin = await Admin.findOne({ where: { email: record.email } });
      if (!admin) return res.status(404).json({ error: 'User not found' });
      admin.password = hashed;
      await admin.save();
    } else {
      const intern = await Intern.findOne({ where: { personalEmail: record.email } });
      if (!intern) return res.status(404).json({ error: 'User not found' });
      intern.password = hashed;
      await intern.save();
    }

    record.used = true;
    await record.save();

    logger.info('Password reset successful', { email: record.email, userType: record.userType });
    return res.json({ message: 'Password reset successfully. You can now login.' });
  } catch (err) {
    logger.error('resetPassword error', { message: err.message });
    return res.status(500).json({ error: 'An error occurred. Please try again later.' });
  }
};

// ── Logout ────────────────────────────────────────────────────────────────────
exports.logout = async (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    tokenBlacklist.add(token);
    // Auto-remove after the max JWT lifetime (7 days default) to prevent unbounded growth
    const ttl = parseInt(process.env.JWT_TTL_MS, 10) || 7 * 24 * 60 * 60 * 1000;
    setTimeout(() => tokenBlacklist.delete(token), ttl);
  }
  return res.json({ message: 'Logged out successfully' });
};

// ── Change password ───────────────────────────────────────────────────────────
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const { id, userType } = req.user;

    if (!currentPassword || !newPassword)
      return res.status(400).json({ error: 'Current password and new password are required' });

    const strength = validatePasswordStrength(newPassword);
    if (!strength.valid) return res.status(400).json({ error: strength.message });

    let dbUser = userType === 'admin' ? await Admin.findByPk(id) : await Intern.findByPk(id);
    if (!dbUser) return res.status(404).json({ error: 'User not found' });

    const match = await bcrypt.compare(currentPassword, dbUser.password);
    if (!match) {
      logger.warn('changePassword: wrong current password', { userId: id, userType });
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Prevent reusing the same password
    const samePass = await bcrypt.compare(newPassword, dbUser.password);
    if (samePass)
      return res.status(400).json({ error: 'New password must be different from current password' });

    dbUser.password = await bcrypt.hash(newPassword, 12); // cost=12 for production
    await dbUser.save();

    logger.info('Password changed', { userId: id, userType });

    // Notify user via email (fire-and-forget)
    const email = userType === 'admin' ? dbUser.email : dbUser.personalEmail;
    setImmediate(async () => {
      try {
        await sendEmail(
          email,
          'Password Changed – IMS Portal',
          `Dear ${dbUser.fullName},\n\nYour password was changed on ${new Date().toUTCString()}.\n\nIf you did not do this, contact the administrator immediately.\n\n– IMS Security Team`
        );
      } catch (e) {
        logger.error('changePassword email failed', { userId: id, message: e.message });
      }
    });

    return res.json({ message: 'Password changed successfully' });
  } catch (err) {
    logger.error('changePassword error', { message: err.message, userId: req.user?.id });
    return res.status(500).json({ error: 'An error occurred while changing password' });
  }
};
