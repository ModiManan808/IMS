const Sanitizer = require('./sanitizer');

/**
 * Validator Utility
 * Provides validation schemas and functions for all endpoints
 */

class Validator {
    /**
     * Validate application submission data
     * @param {object} data - Request body and file data
     * @returns {object} - { valid: boolean, sanitized: object, errors: array }
     */
    static validateApplicationSubmission(data) {
        const errors = [];
        const sanitized = {};

        // Full Name (required, 2-100 chars)
        sanitized.fullName = Sanitizer.sanitizeString(data.fullName);
        if (!sanitized.fullName || sanitized.fullName.length < 2 || sanitized.fullName.length > 100) {
            errors.push('Full name must be between 2 and 100 characters');
        }

        // Enrollment Number (required)
        sanitized.enrollmentNo = Sanitizer.sanitizeEnrollmentNo(data.enrollmentNo);
        if (!sanitized.enrollmentNo) {
            errors.push('Invalid enrollment number format');
        }

        // Email (required, valid email)
        sanitized.email = Sanitizer.sanitizeEmail(data.email);
        if (!sanitized.email) {
            errors.push('Invalid email address');
        }

        // Mobile Number (required)
        sanitized.mobile = Sanitizer.sanitizePhone(data.mobile);
        if (!sanitized.mobile) {
            errors.push('Invalid mobile number (must be 10-15 digits)');
        }

        // LOI File (required, checked separately)
        if (!data.loiFile) {
            errors.push('LOI file is required');
        }

        return {
            valid: errors.length === 0,
            sanitized,
            errors
        };
    }

    /**
     * Validate enrollment form submission
     * @param {object} data - Request body data
     * @returns {object} - { valid: boolean, sanitized: object, errors: array }
     */
    static validateEnrollmentSubmission(data) {
        const errors = [];
        const sanitized = {};

        // Full Name
        sanitized.fullName = Sanitizer.sanitizeString(data.fullName);
        if (sanitized.fullName && (sanitized.fullName.length < 2 || sanitized.fullName.length > 100)) {
            errors.push('Full name must be between 2 and 100 characters');
        }

        // Enrollment Number
        sanitized.enrollmentNo = Sanitizer.sanitizeEnrollmentNo(data.enrollmentNo);

        // Semester
        sanitized.semester = Sanitizer.sanitizeString(data.semester);
        if (!sanitized.semester) {
            errors.push('Semester is required');
        }

        // Program
        sanitized.program = Sanitizer.sanitizeText(data.program, 200);
        if (!sanitized.program) {
            errors.push('Program is required');
        }

        // Department
        sanitized.department = Sanitizer.sanitizeText(data.department, 200);
        if (!sanitized.department) {
            errors.push('Department is required');
        }

        // Organization
        sanitized.organization = Sanitizer.sanitizeText(data.organization, 200);
        if (!sanitized.organization) {
            errors.push('Organization is required');
        }

        // Contact Number
        sanitized.contactNo = Sanitizer.sanitizePhone(data.contactNo);

        // Email
        sanitized.emailAddress = Sanitizer.sanitizeEmail(data.emailAddress);

        // Gender (enum)
        sanitized.gender = Sanitizer.sanitizeEnum(data.gender, ['M', 'F', 'O']);
        if (!sanitized.gender) {
            errors.push('Invalid gender value');
        }

        // Blood Group
        sanitized.bloodGroup = Sanitizer.sanitizeEnum(data.bloodGroup, ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']);

        // Addresses
        sanitized.presentAddress = Sanitizer.sanitizeText(data.presentAddress, 500);
        if (!sanitized.presentAddress) {
            errors.push('Present address is required');
        }

        sanitized.permanentAddress = Sanitizer.sanitizeText(data.permanentAddress, 500);
        if (!sanitized.permanentAddress) {
            errors.push('Permanent address is required');
        }

        return {
            valid: errors.length === 0,
            sanitized,
            errors
        };
    }

    /**
     * Validate login credentials
     * @param {object} data - Login data
     * @returns {object} - { valid: boolean, sanitized: object, errors: array }
     */
    static validateLogin(data) {
        const errors = [];
        const sanitized = {};

        // Username
        sanitized.username = Sanitizer.sanitizeUsername(data.username);
        if (!sanitized.username) {
            errors.push('Invalid username format');
        }

        // Password (don't sanitize, just check presence)
        if (!data.password || typeof data.password !== 'string' || data.password.length < 1) {
            errors.push('Password is required');
        } else {
            sanitized.password = data.password; // Keep as-is for bcrypt comparison
        }

        // User Type (enum)
        sanitized.userType = Sanitizer.sanitizeEnum(data.userType, ['admin', 'intern']);
        if (!sanitized.userType) {
            errors.push('Invalid user type');
        }

        return {
            valid: errors.length === 0,
            sanitized,
            errors
        };
    }

    /**
     * Validate admin decision on fresh application
     * @param {object} data - Decision data
     * @returns {object} - { valid: boolean, sanitized: object, errors: array }
     */
    static validateAdminDecision(data) {
        const errors = [];
        const sanitized = {};

        // ID (required)
        sanitized.id = Sanitizer.sanitizeId(data.id);
        if (!sanitized.id) {
            errors.push('Invalid intern ID');
        }

        // Decision (enum)
        const validDecisions = ['Approved', 'Rejected', 'Special Approval Required'];
        sanitized.decision = Sanitizer.sanitizeEnum(data.decision, validDecisions);
        if (!sanitized.decision) {
            errors.push('Invalid decision value');
        }

        // Rejection Reason (optional but sanitized)
        sanitized.rejectionReason = Sanitizer.sanitizeText(data.rejectionReason, 1000);

        // Special Approval Notes (optional but sanitized)
        sanitized.specialApprovalNotes = Sanitizer.sanitizeText(data.specialApprovalNotes, 1000);

        return {
            valid: errors.length === 0,
            sanitized,
            errors
        };
    }

    /**
     * Validate finalize onboarding data
     * @param {object} data - Onboarding data
     * @returns {object} - { valid: boolean, sanitized: object, errors: array }
     */
    static validateFinalizeOnboarding(data) {
        const errors = [];
        const sanitized = {};

        // ID (required)
        sanitized.id = Sanitizer.sanitizeId(data.id);
        if (!sanitized.id) {
            errors.push('Invalid intern ID');
        }

        // Application Number (required)
        sanitized.applicationNo = Sanitizer.sanitizeApplicationNo(data.applicationNo);
        if (!sanitized.applicationNo) {
            errors.push('Invalid application number format');
        }

        // Date of Joining (required)
        sanitized.dateOfJoining = Sanitizer.sanitizeDate(data.dateOfJoining);
        if (!sanitized.dateOfJoining) {
            errors.push('Invalid date of joining (use YYYY-MM-DD format)');
        }

        // Date of Leaving (required)
        sanitized.dateOfLeaving = Sanitizer.sanitizeDate(data.dateOfLeaving);
        if (!sanitized.dateOfLeaving) {
            errors.push('Invalid date of leaving (use YYYY-MM-DD format)');
        }

        // Validate date logic
        if (sanitized.dateOfJoining && sanitized.dateOfLeaving) {
            const joining = new Date(sanitized.dateOfJoining);
            const leaving = new Date(sanitized.dateOfLeaving);

            if (leaving <= joining) {
                errors.push('Date of leaving must be after date of joining');
            }
        }

        return {
            valid: errors.length === 0,
            sanitized,
            errors
        };
    }

    /**
     * Validate daily report submission
     * @param {object} data - Report data
     * @returns {object} - { valid: boolean, sanitized: object, errors: array }
     */
    static validateDailyReport(data) {
        const errors = [];
        const sanitized = {};

        // Domain (required)
        sanitized.domain = Sanitizer.sanitizeText(data.domain, 200);
        if (!sanitized.domain) {
            errors.push('Domain is required');
        }

        // Work Description (required, max 5000 chars)
        sanitized.workDescription = Sanitizer.sanitizeText(data.workDescription, 5000);
        if (!sanitized.workDescription) {
            errors.push('Work description is required');
        }

        // Tools Used (optional, max 2000 chars)
        sanitized.toolsUsed = Sanitizer.sanitizeText(data.toolsUsed, 2000);

        // Issues Faced (optional, max 2000 chars)
        sanitized.issuesFaced = Sanitizer.sanitizeText(data.issuesFaced, 2000);

        return {
            valid: errors.length === 0,
            sanitized,
            errors
        };
    }

    /**
     * Validate ID parameter
     * @param {any} id - ID to validate
     * @returns {object} - { valid: boolean, sanitized: number, errors: array }
     */
    static validateId(id) {
        const sanitized = Sanitizer.sanitizeId(id);
        const valid = sanitized !== null;
        const errors = valid ? [] : ['Invalid ID parameter'];

        return { valid, sanitized, errors };
    }
}

module.exports = Validator;
