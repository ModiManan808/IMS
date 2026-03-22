const { Intern, DailyReport } = require('../models');
const { validateMagicNumber } = require('../utils/fileValidator');
const Validator = require('../utils/validator');
const sendEmail = require('../utils/emailService');
const logger = require('../utils/logger');
const crypto = require('crypto');

const hashEnrollmentToken = (token) => {
    const secret = process.env.ENROLLMENT_TOKEN_SECRET || process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('Enrollment token secret is not configured');
    }
    return crypto.createHmac('sha256', secret).update(token).digest('hex');
};

/**
 * Get enrollment form data (for viewing the form)
 */
exports.getEnrollmentForm = async (req, res) => {
    try {
        const token = req.params.token;
        const tokenHash = hashEnrollmentToken(token);

        const intern = await Intern.findOne({
            where: {
                status: 'Pending_Enrollment',
                enrollmentTokenHash: tokenHash
            },
            attributes: ['id', 'fullName', 'enrollmentNo', 'personalEmail', 'mobileNo', 'status']
        });

        if (!intern) {
            return res.status(404).json({ error: 'Application not found or link expired' });
        }

        if (intern.status !== 'Pending_Enrollment') {
            return res.status(400).json({
                error: 'Enrollment is not available for this application'
            });
        }

        res.json({
            id: intern.id,
            fullName: intern.fullName,
            enrollmentNo: intern.enrollmentNo,
            email: intern.personalEmail
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Submit enrollment form
 */
exports.submitEnrollment = async (req, res) => {
    try {
        const token = req.params.token;
        const tokenHash = hashEnrollmentToken(token);

        if (!req.files || !req.files['photo'] || !req.files['sign'] || !req.files['nda']) {
            return res.status(400).json({
                error: 'All files (photo, signature, NDA) are required'
            });
        }

        const intern = await Intern.findOne({
            where: {
                status: 'Pending_Enrollment',
                enrollmentTokenHash: tokenHash
            }
        });

        if (!intern) {
            return res.status(404).json({ error: 'Application not found or link expired' });
        }

        if (intern.status !== 'Pending_Enrollment') {
            return res.status(400).json({
                error: 'Enrollment is not available for this application'
            });
        }

        const photoPath = req.files['photo'][0].path;
        const signPath = req.files['sign'][0].path;
        const ndaPath = req.files['nda'][0].path;

        // Validate Magic Numbers
        const isPhotoValid = validateMagicNumber(photoPath, ['jpg', 'png']);
        const isSignValid = validateMagicNumber(signPath, ['jpg', 'png']);
        const isNdaValid = validateMagicNumber(ndaPath, ['pdf']);

        if (!isPhotoValid || !isSignValid || !isNdaValid) {
            return res.status(400).json({
                error: 'Invalid file formats detected via signature verification'
            });
        }

        // Validate and sanitize form data
        const validation = Validator.validateEnrollmentSubmission(req.body);

        if (!validation.valid) {
            return res.status(400).json({
                error: 'Invalid input data',
                details: validation.errors
            });
        }

        const sanitized = validation.sanitized;

        // Capture old email BEFORE the update for notification
        const oldEmail = intern.personalEmail;
        const newEmail = sanitized.emailAddress;
        const emailChanged = oldEmail && newEmail && newEmail.toLowerCase() !== oldEmail.toLowerCase();

        // Update intern record with sanitized data
        await intern.update({
            fullName: sanitized.fullName || intern.fullName,
            enrollmentNo: sanitized.enrollmentNo || intern.enrollmentNo,
            personalEmail: sanitized.emailAddress || intern.personalEmail,
            mobileNo: sanitized.contactNo || intern.mobileNo,
            passportPhoto: photoPath,
            semester: sanitized.semester,
            program: sanitized.program,
            department: sanitized.department,
            organization: sanitized.organization,
            gender: sanitized.gender,
            bloodGroup: sanitized.bloodGroup,
            presentAddress: sanitized.presentAddress,
            permanentAddress: sanitized.permanentAddress,
            eSignature: signPath,
            signedNDA: ndaPath,
            enrollmentTokenHash: null,
            enrollmentSalt: null,
            status: 'Pending_Approval' // Sends back to Admin
        });

        // Notify old email AFTER DB commit — only fires if update succeeded
        if (emailChanged) {
            setImmediate(async () => {
                try {
                    await sendEmail(
                        oldEmail,
                        'Email Address Changed – IMS Portal',
                        `Dear ${intern.fullName},\n\nThe email address associated with your IMS Portal account has been changed to: ${newEmail}\n\nIf you did not make this change, please contact the administrator immediately.\n\n– IMS Security Team`
                    );
                    logger.info('Email change notification sent', { internId: intern.id });
                } catch (e) {
                    logger.error('Failed to send email change notification', { internId: intern.id, message: e.message });
                }
            });
        }


        res.json({ message: 'Enrollment submitted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Submit daily status report
 */
exports.submitDailyReport = async (req, res) => {
    try {
        const internId = req.user.id;

        // Validate and sanitize inputs
        const validation = Validator.validateDailyReport(req.body);

        if (!validation.valid) {
            return res.status(400).json({
                error: 'Invalid input data',
                details: validation.errors
            });
        }

        const { domain, workDescription, toolsUsed, issuesFaced } = validation.sanitized;

        // Get intern details
        const intern = await Intern.findByPk(internId);
        if (!intern) {
            return res.status(404).json({ error: 'Intern not found' });
        }

        if (intern.status !== 'Active' || intern.role !== 'Intern_approved&ongoing') {
            return res.status(403).json({
                error: 'You are not authorized to submit reports'
            });
        }

        // Check if report already exists for today
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const existingReport = await DailyReport.findOne({
            where: {
                internId,
                reportDate: today
            }
        });

        if (existingReport) {
            return res.status(400).json({
                error: 'Daily report already submitted for today'
            });
        }

        // Create daily report with hardcoded applicationNo and name
        await DailyReport.create({
            internId,
            domain,
            applicationNo: intern.applicationNo, // Hardcoded
            name: intern.fullName, // Hardcoded
            workDescription, // Work description with time
            toolsUsed, // Tools used with time of usage
            issuesFaced, // Issues faced/remarks
            reportDate: today
        });

        res.json({ message: 'Daily report submitted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Get intern's own reports
 */
exports.getMyReports = async (req, res) => {
    try {
        const internId = req.user.id;

        const reports = await DailyReport.findAll({
            where: { internId },
            order: [['reportDate', 'DESC']],
            attributes: [
                'id', 'domain', 'applicationNo', 'name',
                'workDescription', 'toolsUsed', 'issuesFaced',
                'reportDate', 'createdAt'
            ]
        });

        res.json(reports);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Get intern's profile
 */
exports.getMyProfile = async (req, res) => {
    try {
        const internId = req.user.id;

        const intern = await Intern.findByPk(internId, {
            attributes: [
                'id', 'fullName', 'enrollmentNo', 'personalEmail', 'mobileNo',
                'applicationNo', 'semester', 'program', 'department', 'organization',
                'gender', 'bloodGroup', 'presentAddress', 'permanentAddress',
                'passportPhoto', 'dateOfJoining', 'dateOfLeaving', 'status', 'role'
            ]
        });

        if (!intern) {
            return res.status(404).json({ error: 'Intern not found' });
        }

        res.json(intern);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Update a daily report (within 24-hour window)
 */
exports.updateReport = async (req, res) => {
    try {
        const { reportId } = req.params;
        const internId = req.user.id;

        const report = await DailyReport.findByPk(reportId);
        if (!report) {
            return res.status(404).json({ error: 'Report not found' });
        }

        if (report.internId !== internId) {
            return res.status(403).json({ error: 'Unauthorized: this report belongs to another intern' });
        }

        // Enforce 24-hour edit window
        const hoursSince = (Date.now() - new Date(report.createdAt).getTime()) / (1000 * 60 * 60);
        if (hoursSince > 24) {
            return res.status(400).json({ error: 'Reports can only be edited within 24 hours of submission' });
        }

        const { domain, workDescription, toolsUsed, issuesFaced } = req.body;

        if (!domain || !workDescription) {
            return res.status(400).json({ error: 'Domain and Work Description are required' });
        }

        await report.update({
            domain,
            workDescription,
            toolsUsed: toolsUsed || '',
            issuesFaced: issuesFaced || '',
            editedAt: new Date(),
            editCount: (report.editCount || 0) + 1,
        });

        res.json({ message: 'Report updated successfully', report });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

