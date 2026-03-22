const { Intern, DailyReport } = require('../models');
const sendEmail = require('../utils/emailService');
const { generateRandomPassword, hashPassword } = require('../utils/passwordService');
const { Op } = require('sequelize');
const path = require('path');
const fs = require('fs');
const Validator = require('../utils/validator');
const logger = require('../utils/logger');
const crypto = require('crypto');

const hashEnrollmentToken = (token) => {
    const secret = process.env.ENROLLMENT_TOKEN_SECRET || process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('Enrollment token secret is not configured');
    }
    return crypto.createHmac('sha256', secret).update(token).digest('hex');
};

const buildInternSearchCondition = (query, fields) => {
    const q = (query || '').toString().trim();
    if (!q) return null;

    return {
        [Op.or]: fields.map((field) => ({
            [field]: { [Op.like]: `%${q}%` }
        }))
    };
};

// Tab 1: Fresh Applications
exports.getFreshApplications = async (req, res) => {
    try {
        const searchCondition = buildInternSearchCondition(req.query.q, [
            'fullName',
            'enrollmentNo',
            'personalEmail'
        ]);

        const interns = await Intern.findAll({
            where: {
                status: 'Fresh',
                ...(searchCondition || {})
            },
            order: [['createdAt', 'DESC']],
            attributes: [
                'id', 'fullName', 'enrollmentNo', 'personalEmail', 'mobileNo', 'loiFile',
                'loiVerified', 'loiVerificationNotes', 'loiVerifiedBy', 'loiVerifiedAt',
                'createdAt'
            ]
        });
        res.json(interns);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Tab 1: Decide on Fresh Application
exports.decideOnFresh = async (req, res) => {
    try {
        // Validate and sanitize inputs
        const validation = Validator.validateAdminDecision(req.body);

        if (!validation.valid) {
            return res.status(400).json({
                error: 'Invalid input data',
                details: validation.errors
            });
        }

        const { id, decision, rejectionReason, specialApprovalNotes } = validation.sanitized;

        const intern = await Intern.findByPk(id);
        if (!intern) {
            return res.status(404).json({ error: 'Intern not found' });
        }

        if (decision === 'Approved') {
            // Generate one-time enrollment token and store only its hash
            const enrollmentToken = crypto.randomBytes(32).toString('hex');
            const enrollmentTokenHash = hashEnrollmentToken(enrollmentToken);

            // Update status and token hash immediately
            intern.status = 'Pending_Enrollment';
            intern.enrollmentTokenHash = enrollmentTokenHash;
            intern.enrollmentSalt = null;
            await intern.save();

            // SECURITY: Send email in background (fire-and-forget)
            // This prevents slow SMTP servers from blocking the HTTP response
            const frontendUrl = process.env.FRONTEND_URL || 'https://portal.nfsu.ac.in';
            const enrollmentLink = `${frontendUrl}/enroll/${enrollmentToken}`;
            const ndaPath = path.join(__dirname, '../uploads/nda/nda.pdf');

            // Fire-and-forget email sending
            (async () => {
                try {
                    let emailText = `Dear ${intern.fullName},\n\nYour application has been approved. Please complete your enrollment by clicking the link below:\n\n${enrollmentLink}\n\n`;

                    if (fs.existsSync(ndaPath)) {
                        emailText += `Please download and sign the attached NDA document and upload it during enrollment.\n\n`;
                        await sendEmail(
                            intern.personalEmail,
                            'Application Approved - Complete Your Enrollment',
                            emailText,
                            null,
                            ndaPath
                        );
                    } else {
                        emailText += `Please download the NDA document from the portal and upload it during enrollment.\n\n`;
                        await sendEmail(
                            intern.personalEmail,
                            'Application Approved - Complete Your Enrollment',
                            emailText
                        );
                    }

                    logger.info('Approval email sent successfully', { internId: intern.id, email: intern.personalEmail });
                } catch (emailError) {
                    // Log error but don't fail the request
                    logger.error('Failed to send approval email', {
                        internId: intern.id,
                        email: intern.personalEmail,
                        error: emailError.message
                    });
                }
            })();

        } else if (decision === 'Rejected') {
            intern.status = 'Rejected';
            intern.role = 'Intern_rejected';
            intern.rejectionReason = rejectionReason || '';
            await intern.save();

            // Fire-and-forget rejection email
            (async () => {
                try {
                    const reason = rejectionReason
                        ? `\n\nReason: ${rejectionReason}`
                        : '';

                    await sendEmail(
                        intern.personalEmail,
                        'Internship Application Status - Not Selected',
                        `Dear ${intern.fullName},\n\nThank you for applying for an internship at the Centre of Excellence in Cyber Security (CoE-CS), National Forensic Sciences University.\n\nAfter careful review of your application, we regret to inform you that we are unable to offer you an internship position at this time.${reason}\n\nWe appreciate your interest and encourage you to reapply in future cycles.\n\nBest regards,\nCoE-CS Team\nNational Forensic Sciences University`
                    );

                    logger.info('Rejection email sent', { internId: intern.id, email: intern.personalEmail });
                } catch (emailError) {
                    logger.error('Failed to send rejection email', {
                        internId: intern.id,
                        email: intern.personalEmail,
                        error: emailError.message
                    });
                }
            })();
        } else if (decision === 'Special Approval Required') {
            intern.status = 'Special_Approval_Required';
            intern.specialApprovalNotes = specialApprovalNotes || '';
            await intern.save();
        }

        res.json({ message: 'Status updated successfully' });
    } catch (error) {
        logger.error('Error in decideOnFresh', { error: error.message, stack: error.stack });
        res.status(500).json({ error: 'An error occurred while processing your request' });
    }
};

// Tab 2: Pending Applications (Waiting for Admin to add Application No, Dates)
exports.getPendingApplications = async (req, res) => {
    try {
        const searchCondition = buildInternSearchCondition(req.query.q, [
            'fullName',
            'enrollmentNo',
            'personalEmail',
            'applicationNo'
        ]);

        const interns = await Intern.findAll({
            where: {
                status: 'Pending_Approval',
                ...(searchCondition || {})
            },
            order: [['updatedAt', 'DESC']],
            attributes: [
                'id', 'fullName', 'enrollmentNo', 'personalEmail', 'mobileNo',
                'passportPhoto', 'semester', 'program', 'department', 'organization',
                'gender', 'bloodGroup', 'presentAddress', 'permanentAddress',
                'eSignature', 'signedNDA', 'createdAt', 'updatedAt'
            ]
        });
        res.json(interns);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Tab 2: Finalize Onboarding (Add Application No, Dates, and Approve)
exports.finalizeOnboarding = async (req, res) => {
    try {
        // Validate and sanitize inputs
        const validation = Validator.validateFinalizeOnboarding(req.body);

        if (!validation.valid) {
            return res.status(400).json({
                error: 'Invalid input data',
                details: validation.errors
            });
        }

        const { id, applicationNo, dateOfJoining, dateOfLeaving } = validation.sanitized;

        const intern = await Intern.findByPk(id);
        if (!intern) {
            return res.status(404).json({ error: 'Intern not found' });
        }

        if (intern.status !== 'Pending_Approval') {
            return res.status(400).json({ error: 'Intern is not in Pending_Approval status' });
        }

        // Generate random password and hash it
        const randomPassword = generateRandomPassword();
        const hashedPassword = await hashPassword(randomPassword);

        // Update intern immediately (don't wait for email)
        intern.applicationNo = applicationNo;
        intern.dateOfJoining = dateOfJoining;
        intern.dateOfLeaving = dateOfLeaving;
        intern.password = hashedPassword;
        intern.status = 'Active';
        intern.role = 'Intern_approved&ongoing';
        await intern.save();

        // SECURITY: Send emails in background (fire-and-forget)
        // This prevents slow SMTP servers from blocking the HTTP response
        const loginUrl = `${process.env.FRONTEND_URL || 'https://portal.nfsu.ac.in'}/login`;

        // Fire-and-forget email sending
        (async () => {
            try {
                // Send credentials to intern
                await sendEmail(
                    intern.personalEmail,
                    'Internship Approved - Login Credentials',
                    `Dear ${intern.fullName},\n\nYour internship has been approved!\n\nYour login credentials:\nUsername: ${applicationNo}\nPassword: ${randomPassword}\n\nPlease login at: ${loginUrl}\n\nApplication No: ${applicationNo}\nDate of Joining: ${dateOfJoining}\nDate of Leaving: ${dateOfLeaving}\n\nBest regards,\nCoE-CS Team`
                );

                logger.info('Onboarding credentials email sent', { internId: intern.id, email: intern.personalEmail });

                // Send notification emails to admin staff
                const recipients = [
                    process.env.COE_CS_HEAD_EMAIL || 'head.coecs@nfsu.ac.in',
                    process.env.DEAN_EMAIL || 'dean@nfsu.ac.in',
                    process.env.ASSOCIATE_DEAN_EMAIL || 'associate.dean@nfsu.ac.in'
                ];

                const notificationMessage = `A new intern has been onboarded:\n\n` +
                    `Name: ${intern.fullName}\n` +
                    `Application No: ${applicationNo}\n` +
                    `Enrollment No: ${intern.enrollmentNo}\n` +
                    `Date of Joining: ${dateOfJoining}\n` +
                    `Date of Leaving: ${dateOfLeaving}\n` +
                    `Program: ${intern.program}\n` +
                    `Department: ${intern.department}\n\n` +
                    `Best regards,\nIMS System`;

                for (const recipient of recipients) {
                    try {
                        await sendEmail(
                            recipient,
                            `New Intern Onboarded - ${intern.fullName}`,
                            notificationMessage
                        );
                        logger.info('Notification email sent', { recipient, internId: intern.id });
                    } catch (notifyError) {
                        logger.error('Failed to send notification email', {
                            recipient,
                            internId: intern.id,
                            error: notifyError.message
                        });
                    }
                }
            } catch (emailError) {
                // Log error but don't fail the request
                logger.error('Failed to send onboarding emails', {
                    internId: intern.id,
                    email: intern.personalEmail,
                    error: emailError.message
                });
            }
        })();

        res.json({ message: 'Intern onboarded successfully' });
    } catch (error) {
        logger.error('Error in finalizeOnboarding', { error: error.message, stack: error.stack });
        res.status(500).json({ error: 'An error occurred while processing your request' });
    }
};

// Tab 3: Approved & Ongoing Interns
exports.getOngoingInterns = async (req, res) => {
    try {
        // First, check and update any interns that should be moved to Completed
        const { checkAndUpdateCompletedInterns } = require('../utils/statusService');
        await checkAndUpdateCompletedInterns();

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const searchCondition = buildInternSearchCondition(req.query.q, [
            'fullName',
            'applicationNo',
            'enrollmentNo',
            'personalEmail'
        ]);

        const interns = await Intern.findAll({
            where: {
                status: 'Active',
                dateOfJoining: { [Op.lte]: today },  // Only show interns whose internship has started
                ...(searchCondition || {})
            },
            include: [{
                model: DailyReport,
                as: 'reports',
                order: [['reportDate', 'DESC']]
            }],
            order: [['applicationNo', 'ASC']]
        });



        const dashboardData = interns.map(intern => {
            const startDate = new Date(intern.dateOfJoining);
            startDate.setHours(0, 0, 0, 0);

            // Calculate days since start
            const timeDiff = today - startDate;
            const daysSinceStart = Math.floor(timeDiff / (1000 * 60 * 60 * 24)) + 1;

            // Count unique days with reports
            const uniqueReportDates = new Set(intern.reports.map(r => r.reportDate ? String(r.reportDate).split('T')[0] : null).filter(Boolean));
            const daysAttended = uniqueReportDates.size;

            // Calculate attendance percentage
            const attendancePct = daysSinceStart > 0
                ? ((daysAttended / daysSinceStart) * 100).toFixed(1)
                : '0.0';

            return {
                id: intern.id,
                hyperlinkText: `${intern.applicationNo}-${intern.fullName}`,
                applicationNo: intern.applicationNo,
                name: intern.fullName,
                startDate: intern.dateOfJoining,
                endDate: intern.dateOfLeaving,
                daysSinceStart,
                daysAttended,
                attendancePct: parseFloat(attendancePct),
                reports: intern.reports.map(report => ({
                    id: report.id,
                    domain: report.domain,
                    workDescription: report.workDescription,
                    toolsUsed: report.toolsUsed,
                    issuesFaced: report.issuesFaced,
                    reportDate: report.reportDate,
                    createdAt: report.createdAt
                }))
            };
        });

        res.json(dashboardData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get detailed intern information (for hyperlink click)
exports.getInternDetails = async (req, res) => {
    try {
        // Validate ID parameter
        const validation = Validator.validateId(req.params.id);

        if (!validation.valid) {
            return res.status(400).json({
                error: 'Invalid ID parameter',
                details: validation.errors
            });
        }

        const id = validation.sanitized;

        const intern = await Intern.findByPk(id, {
            include: [{
                model: DailyReport,
                as: 'reports',
                order: [['reportDate', 'DESC']]
            }]
        });

        if (!intern) {
            return res.status(404).json({ error: 'Intern not found' });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const startDate = new Date(intern.dateOfJoining);
        startDate.setHours(0, 0, 0, 0);

        const timeDiff = today - startDate;
        const daysSinceStart = Math.floor(timeDiff / (1000 * 60 * 60 * 24)) + 1;

        const uniqueReportDates = new Set(intern.reports.map(r => r.reportDate?.toISOString().split('T')[0]));
        const daysAttended = uniqueReportDates.size;

        const attendancePct = daysSinceStart > 0
            ? ((daysAttended / daysSinceStart) * 100).toFixed(1)
            : '0.0';

        const toFileUrl = (filePath) => {
            if (!filePath) return null;
            // Convert stored path (e.g. uploads/photos/x.jpg) to API URL (/files/photos/x.jpg)
            const relativePath = filePath.replace(/\\/g, '/').replace(/^.*uploads\//, '');
            return `/files/${relativePath}`;
        };

        res.json({
            ...intern.toJSON(),
            daysSinceStart,
            daysAttended,
            attendancePct: parseFloat(attendancePct),
            photoUrl: toFileUrl(intern.passportPhoto),
            signUrl: toFileUrl(intern.eSignature),
            ndaUrl: toFileUrl(intern.signedNDA),
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Tab 4: Rejected Applications
exports.getRejectedApplications = async (req, res) => {
    try {
        const searchCondition = buildInternSearchCondition(req.query.q, [
            'fullName',
            'enrollmentNo',
            'personalEmail',
            'applicationNo'
        ]);

        const interns = await Intern.findAll({
            where: {
                status: 'Rejected',
                ...(searchCondition || {})
            },
            order: [['updatedAt', 'DESC']],
            attributes: [
                'id', 'fullName', 'enrollmentNo', 'personalEmail', 'mobileNo',
                'rejectionReason', 'createdAt', 'updatedAt'
            ]
        });
        res.json(interns);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Tab 5: Completed Interns
exports.getCompletedInterns = async (req, res) => {
    try {
        // First, check and update any interns that should be moved to Completed
        const { checkAndUpdateCompletedInterns } = require('../utils/statusService');
        await checkAndUpdateCompletedInterns();

        const searchCondition = buildInternSearchCondition(req.query.q, [
            'fullName',
            'applicationNo',
            'enrollmentNo',
            'personalEmail'
        ]);

        const interns = await Intern.findAll({
            where: {
                status: 'Completed',
                ...(searchCondition || {})
            },
            include: [{
                model: DailyReport,
                as: 'reports',
                order: [['reportDate', 'DESC']]
            }],
            order: [['dateOfLeaving', 'DESC']]
        });

        const dashboardData = interns.map(intern => {
            const startDate = new Date(intern.dateOfJoining);
            const endDate = new Date(intern.dateOfLeaving);

            const timeDiff = endDate - startDate;
            const totalDays = Math.max(1, Math.ceil(timeDiff / (1000 * 60 * 60 * 24)));

            const uniqueReportDates = new Set(intern.reports.map(r => r.reportDate ? String(r.reportDate).split('T')[0] : null).filter(Boolean));
            const daysAttended = uniqueReportDates.size;

            const attendancePct = totalDays > 0
                ? ((daysAttended / totalDays) * 100).toFixed(1)
                : '0.0';

            return {
                id: intern.id,
                hyperlinkText: `${intern.applicationNo}-${intern.fullName}`,
                applicationNo: intern.applicationNo,
                name: intern.fullName,
                startDate: intern.dateOfJoining,
                endDate: intern.dateOfLeaving,
                totalDays,
                daysAttended,
                attendancePct: parseFloat(attendancePct),
                reports: intern.reports.map(report => ({
                    id: report.id,
                    domain: report.domain,
                    workDescription: report.workDescription,
                    toolsUsed: report.toolsUsed,
                    issuesFaced: report.issuesFaced,
                    reportDate: report.reportDate,
                    createdAt: report.createdAt
                }))
            };
        });

        res.json(dashboardData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Verify LOI - Admin marks LOI as Verified or Rejected
 */
exports.verifyLOI = async (req, res) => {
    try {
        const validation = Validator.validateLOIVerification(req.body);

        if (!validation.valid) {
            return res.status(400).json({
                error: 'Invalid input data',
                details: validation.errors
            });
        }

        const { id, loiVerified, loiVerificationNotes } = validation.sanitized;

        const intern = await Intern.findByPk(id);
        if (!intern) {
            return res.status(404).json({ error: 'Intern not found' });
        }

        // Update LOI verification fields
        intern.loiVerified = loiVerified;
        intern.loiVerificationNotes = loiVerificationNotes || '';
        intern.loiVerifiedBy = req.user.id; // From auth middleware
        intern.loiVerifiedAt = new Date();
        await intern.save();

        logger.info('LOI verification updated', {
            internId: id,
            loiVerified,
            verifiedBy: req.user.id
        });

        res.json({ message: 'LOI verification status updated successfully' });
    } catch (error) {
        logger.error('Error in verifyLOI', { error: error.message, stack: error.stack });
        res.status(500).json({ error: 'An error occurred while processing your request' });
    }
};

/**
 * Report Statistics for Ongoing Interns dashboard
 */
exports.getReportStatistics = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // First, get all active intern IDs
        const activeInterns = await Intern.findAll({
            where: { status: 'Active', dateOfJoining: { [Op.lte]: today } },
            attributes: ['id']
        });
        const activeInternIds = activeInterns.map(i => i.id);

        const [totalReports, todayReports, ongoingInterns] = await Promise.all([
            // Only count reports belonging to active interns
            DailyReport.count({ where: { internId: { [Op.in]: activeInternIds } } }),
            DailyReport.count({ where: { internId: { [Op.in]: activeInternIds }, reportDate: { [Op.gte]: today } } }),

            // Just count the array size since we already queried them
            Promise.resolve(activeInternIds.length),
        ]);

        res.json({
            totalReports,
            todayReports,
            ongoingInterns,
        });
    } catch (error) {
        logger.error('Error in getReportStatistics', { error: error.message });
        res.status(500).json({ error: 'Failed to fetch statistics' });
    }
};

/**
 * Update Intern Dates - Admin can change end date, but start date is read-only
 */
exports.updateInternDates = async (req, res) => {
    try {
        if (Object.prototype.hasOwnProperty.call(req.body || {}, 'dateOfJoining')) {
            return res.status(400).json({ error: 'Start date is read-only and cannot be changed once assigned' });
        }

        const validation = Validator.validateInternDateUpdate(req.body);

        if (!validation.valid) {
            return res.status(400).json({
                error: 'Invalid input data',
                details: validation.errors
            });
        }

        const { id, dateOfLeaving } = validation.sanitized;

        const intern = await Intern.findByPk(id);
        if (!intern) {
            return res.status(404).json({ error: 'Intern not found' });
        }

        if (intern.status !== 'Active') {
            return res.status(400).json({ error: 'Only active interns can have their end date updated' });
        }

        // Validate date logic: end date must be after start date
        const joining = new Date(intern.dateOfJoining);
        const leaving = new Date(dateOfLeaving);
        
        joining.setHours(0, 0, 0, 0);
        leaving.setHours(0, 0, 0, 0);

        if (leaving <= joining) {
            return res.status(400).json({ error: 'End date must be after start date' });
        }

        intern.dateOfLeaving = dateOfLeaving;
        await intern.save();

        logger.info('Intern end date updated', {
            internId: id,
            newEndDate: dateOfLeaving,
            updatedBy: req.user.id
        });

        res.json({ message: 'Intern end date updated successfully' });
    } catch (error) {
        logger.error('Error in updateInternDates', { error: error.message });
        res.status(500).json({ error: 'An error occurred while updating dates' });
    }
};

