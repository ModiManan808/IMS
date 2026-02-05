const xss = require('xss');
const validator = require('validator');

/**
 * Input Sanitization Utility
 * Provides comprehensive sanitization for all user inputs
 */

class Sanitizer {
    /**
     * Sanitize string input to prevent XSS attacks
     * @param {string} input - Raw input string
     * @param {boolean} allowHTML - Whether to allow safe HTML tags
     * @returns {string} - Sanitized string
     */
    static sanitizeString(input, allowHTML = false) {
        if (!input || typeof input !== 'string') {
            return '';
        }

        // Trim whitespace
        let sanitized = input.trim();

        if (allowHTML) {
            // Allow only safe HTML tags
            sanitized = xss(sanitized, {
                whiteList: {
                    p: [],
                    br: [],
                    b: [],
                    i: [],
                    u: [],
                    strong: [],
                    em: []
                }
            });
        } else {
            // Remove all HTML tags
            sanitized = xss(sanitized, { whiteList: {} });
        }

        return sanitized;
    }

    /**
     * Sanitize email address
     * @param {string} email - Email address
     * @returns {string|null} - Sanitized email or null if invalid
     */
    static sanitizeEmail(email) {
        if (!email || typeof email !== 'string') {
            return null;
        }

        const trimmed = email.trim().toLowerCase();

        if (!validator.isEmail(trimmed)) {
            return null;
        }

        return validator.normalizeEmail(trimmed);
    }

    /**
     * Sanitize phone number
     * @param {string} phone - Phone number
     * @returns {string|null} - Sanitized phone or null if invalid
     */
    static sanitizePhone(phone) {
        if (!phone || typeof phone !== 'string') {
            return null;
        }

        // Remove all non-numeric characters except + at start
        let sanitized = phone.trim().replace(/[^\d+]/g, '');

        // Ensure + is only at the start
        if (sanitized.includes('+')) {
            const parts = sanitized.split('+');
            sanitized = '+' + parts.join('');
        }

        // Basic validation: should be 10-15 digits
        const digitCount = sanitized.replace(/\+/g, '').length;
        if (digitCount < 10 || digitCount > 15) {
            return null;
        }

        return sanitized;
    }

    /**
     * Sanitize enrollment number
     * @param {string} enrollmentNo - Enrollment number
     * @returns {string|null} - Sanitized enrollment number or null
     */
    static sanitizeEnrollmentNo(enrollmentNo) {
        if (!enrollmentNo || typeof enrollmentNo !== 'string') {
            return null;
        }

        // Allow only alphanumeric and hyphens/underscores
        const sanitized = enrollmentNo.trim().replace(/[^a-zA-Z0-9\-_]/g, '');

        if (sanitized.length === 0 || sanitized.length > 50) {
            return null;
        }

        return sanitized;
    }

    /**
     * Sanitize application number
     * @param {string} appNo - Application number
     * @returns {string|null} - Sanitized application number or null
     */
    static sanitizeApplicationNo(appNo) {
        if (!appNo || typeof appNo !== 'string') {
            return null;
        }

        // Allow only alphanumeric and hyphens
        const sanitized = appNo.trim().replace(/[^a-zA-Z0-9\-]/g, '');

        if (sanitized.length === 0 || sanitized.length > 30) {
            return null;
        }

        return sanitized;
    }

    /**
     * Sanitize text field with length limit
     * @param {string} text - Text input
     * @param {number} maxLength - Maximum allowed length
     * @returns {string} - Sanitized text
     */
    static sanitizeText(text, maxLength = 5000) {
        if (!text || typeof text !== 'string') {
            return '';
        }

        let sanitized = this.sanitizeString(text, false);

        // Enforce length limit to prevent DoS
        if (sanitized.length > maxLength) {
            sanitized = sanitized.substring(0, maxLength);
        }

        return sanitized;
    }

    /**
     * Sanitize URL
     * @param {string} url - URL to sanitize
     * @returns {string|null} - Sanitized URL or null if invalid
     */
    static sanitizeURL(url) {
        if (!url || typeof url !== 'string') {
            return null;
        }

        const trimmed = url.trim();

        if (!validator.isURL(trimmed, {
            protocols: ['http', 'https'],
            require_protocol: true
        })) {
            return null;
        }

        return trimmed;
    }

    /**
     * Sanitize date string
     * @param {string} dateString - Date string in YYYY-MM-DD format
     * @returns {string|null} - Sanitized date or null if invalid
     */
    static sanitizeDate(dateString) {
        if (!dateString || typeof dateString !== 'string') {
            return null;
        }

        const trimmed = dateString.trim();

        // Check if valid date format (YYYY-MM-DD)
        if (!validator.isDate(trimmed, { format: 'YYYY-MM-DD', strictMode: true })) {
            return null;
        }

        return trimmed;
    }

    /**
     * Sanitize username (for login)
     * @param {string} username - Username
     * @returns {string|null} - Sanitized username or null
     */
    static sanitizeUsername(username) {
        if (!username || typeof username !== 'string') {
            return null;
        }

        // Remove all whitespace and special characters except underscore and hyphen
        const sanitized = username.trim().replace(/[^a-zA-Z0-9\-_@.]/g, '');

        if (sanitized.length === 0 || sanitized.length > 100) {
            return null;
        }

        return sanitized;
    }

    /**
     * Sanitize integer ID
     * @param {any} id - ID value
     * @returns {number|null} - Sanitized integer ID or null
     */
    static sanitizeId(id) {
        const parsed = parseInt(id, 10);

        if (isNaN(parsed) || parsed <= 0) {
            return null;
        }

        return parsed;
    }

    /**
     * Sanitize enum value against allowed values
     * @param {string} value - Value to check
     * @param {Array} allowedValues - Array of allowed values
     * @returns {string|null} - Value if valid, null otherwise
     */
    static sanitizeEnum(value, allowedValues) {
        if (!value || typeof value !== 'string' || !Array.isArray(allowedValues)) {
            return null;
        }

        const trimmed = value.trim();

        if (!allowedValues.includes(trimmed)) {
            return null;
        }

        return trimmed;
    }

    /**
     * Sanitize object by applying sanitization to all string fields
     * @param {object} obj - Object to sanitize
     * @param {object} schema - Schema defining field types
     * @returns {object} - Sanitized object
     */
    static sanitizeObject(obj, schema) {
        if (!obj || typeof obj !== 'object') {
            return {};
        }

        const sanitized = {};

        for (const [key, config] of Object.entries(schema)) {
            const value = obj[key];

            switch (config.type) {
                case 'string':
                    sanitized[key] = this.sanitizeString(value);
                    break;
                case 'email':
                    sanitized[key] = this.sanitizeEmail(value);
                    break;
                case 'phone':
                    sanitized[key] = this.sanitizePhone(value);
                    break;
                case 'text':
                    sanitized[key] = this.sanitizeText(value, config.maxLength);
                    break;
                case 'enrollment':
                    sanitized[key] = this.sanitizeEnrollmentNo(value);
                    break;
                case 'applicationNo':
                    sanitized[key] = this.sanitizeApplicationNo(value);
                    break;
                case 'date':
                    sanitized[key] = this.sanitizeDate(value);
                    break;
                case 'id':
                    sanitized[key] = this.sanitizeId(value);
                    break;
                case 'enum':
                    sanitized[key] = this.sanitizeEnum(value, config.values);
                    break;
                case 'url':
                    sanitized[key] = this.sanitizeURL(value);
                    break;
                default:
                    // Keep as is for unknown types
                    sanitized[key] = value;
            }
        }

        return sanitized;
    }
}

module.exports = Sanitizer;
