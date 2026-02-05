const { Intern } = require('../models');
const { validateMagicNumber } = require('../utils/fileValidator');
const Validator = require('../utils/validator');

exports.submitApplication = async (req, res) => {
    try {
        // 1. Validate and sanitize inputs
        const validation = Validator.validateApplicationSubmission({
            fullName: req.body.fullName,
            enrollmentNo: req.body.enrollmentNo,
            email: req.body.email,
            mobile: req.body.mobile,
            loiFile: req.file
        });

        if (!validation.valid) {
            return res.status(400).json({
                error: 'Invalid input data',
                details: validation.errors
            });
        }

        const sanitized = validation.sanitized;

        // 2. Check Magic Number
        if (!validateMagicNumber(req.file.path, ['pdf'])) {
            return res.status(400).json({ error: "Security Alert: Invalid PDF format." });
        }

        // 3. Check for duplicate email (using sanitized email)
        const existingIntern = await Intern.findOne({
            where: { personalEmail: sanitized.email }
        });

        if (existingIntern) {
            return res.status(400).json({
                error: "An application with this email address already exists. Please use a different email or contact support."
            });
        }

        // 4. Create Record with sanitized data
        await Intern.create({
            fullName: sanitized.fullName,
            enrollmentNo: sanitized.enrollmentNo,
            personalEmail: sanitized.email,
            mobileNo: sanitized.mobile,
            loiFile: req.file.path,
            status: 'Fresh',
            role: 'Intern_applied'
        });

        res.status(201).json({ message: "Application submitted successfully." });
    } catch (error) {
        console.error('Application submission error:', error);
        res.status(500).json({ error: 'Failed to submit application. Please try again.' });
    }
};

exports.listApplications = async (req, res) => {
    try {
        const interns = await Intern.findAll({
            where: { status: 'Fresh' },
            order: [['createdAt', 'DESC']]
        });

        res.json(interns);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};