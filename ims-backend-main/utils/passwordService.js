const bcrypt = require('bcrypt');
const crypto = require('crypto');

/**
 * Generate a random password
 * @returns {string} Random password
 */
exports.generateRandomPassword = () => {
    // Generate 8-character random password
    return crypto.randomBytes(4).toString('hex');
};

/**
 * Hash a password using bcrypt
 * @param {string} password - Plain text password
 * @returns {Promise<string>} Hashed password
 */
exports.hashPassword = async (password) => {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
};

/**
 * Verify a password against a hash
 * @param {string} password - Plain text password
 * @param {string} hash - Hashed password
 * @returns {Promise<boolean>} True if password matches
 */
exports.verifyPassword = async (password, hash) => {
    return await bcrypt.compare(password, hash);
};
