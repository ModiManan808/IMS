const { Intern, DailyReport } = require('../models');
const sendEmail = require('../utils/emailService');
const { generateRandomPassword, hashPassword } = require('../utils/passwordService');
const { Op } = require('sequelize');
const path = require('path');
const fs = require('fs');
const Validator = require('../utils/validator');
const logger = require('../utils/logger');

// Tab 1: Fresh Applications
exports.getFreshApplications = async (req, res) => {
    try {
        const interns = await Intern.findAll({
            where: { status: 'Fresh' },
            order: [['createdAt', 'DESC']],
            attributes: ['id', 'fullName', 'enrollmentNo', 'personalEmail', 'mobileNo', 'loiFile', 'createdAt']
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
            // Update status immediately (non-blocking)
            intern.status = 'Pending_Enrollment';
            await intern.save();

            // SECURITY: Send email in background (fire-and-forget)
            // This prevents slow SMTP servers from blocking the HTTP response
            const frontendUrl = process.env.FRONTEND_URL || 'https://portal.nfsu.ac.in';
            const enrollmentLink = `${frontendUrl}/enroll/${intern.id}`;
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
        const interns = await Intern.findAll({
            where: { status: 'Pending_Approval' },
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

        const interns = await Intern.findAll({
            where: { status: 'Active' },
            include: [{
                model: DailyReport,
                as: 'reports',
                order: [['reportDate', 'DESC']]
            }],
            order: [['applicationNo', 'ASC']]
        });

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const dashboardData = interns.map(intern => {
            const startDate = new Date(intern.dateOfJoining);
            startDate.setHours(0, 0, 0, 0);

            // Calculate days since start
            const timeDiff = today - startDate;
            const daysSinceStart = Math.max(1, Math.ceil(timeDiff / (1000 * 60 * 60 * 24)));

            // Count unique days with reports
            const uniqueReportDates = new Set(intern.reports.map(r => r.reportDate?.toISOString().split('T')[0]));
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
        const daysSinceStart = Math.max(1, Math.ceil(timeDiff / (1000 * 60 * 60 * 24)));

        const uniqueReportDates = new Set(intern.reports.map(r => r.reportDate?.toISOString().split('T')[0]));
        const daysAttended = uniqueReportDates.size;

        const attendancePct = daysSinceStart > 0
            ? ((daysAttended / daysSinceStart) * 100).toFixed(1)
            : '0.0';

        res.json({
            ...intern.toJSON(),
            daysSinceStart,
            daysAttended,
            attendancePct: parseFloat(attendancePct)
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Tab 4: Rejected Applications
exports.getRejectedApplications = async (req, res) => {
    try {
        const interns = await Intern.findAll({
            where: { status: 'Rejected' },
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

        const interns = await Intern.findAll({
            where: { status: 'Completed' },
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

            const uniqueReportDates = new Set(intern.reports.map(r => r.reportDate?.toISOString().split('T')[0]));
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
