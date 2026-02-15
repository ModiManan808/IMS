const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const upload = require('../middleware/uploadMiddleware');
const appCtrl = require('../controllers/appController');
const adminCtrl = require('../controllers/adminController');
const internCtrl = require('../controllers/internController');
const authCtrl = require('../controllers/authController');
const fileCtrl = require('../controllers/fileController');
const auth = require('../middleware/authMiddleware');

// Rate Limiting for Login (S-03)
// NOTE: Temporarily increased for testing - reduce to 5 for production
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // TESTING: Increased from 5 to 50 for development
    message: 'Too many login attempts from this IP, please try again after 15 minutes',
    standardHeaders: true,
    legacyHeaders: false,
});

// ==================== PUBLIC ROUTES ====================

// Application submission
router.post('/apply', upload.single('loi'), appCtrl.submitApplication);

// Login (for both admin and intern) - with rate limiting
router.post('/login', loginLimiter, authCtrl.login);

// Password Reset Routes - with rate limiting
const passwordResetLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 3, // limit each IP to 3 requests per windowMs
    message: 'Too many password reset attempts. Please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

router.post('/request-password-reset', passwordResetLimiter, authCtrl.requestPasswordReset);
router.get('/verify-reset-token/:token', authCtrl.verifyResetToken);
router.post('/reset-password/:token', authCtrl.resetPassword);

// Change Password (authenticated users only) - with rate limiting
const changePasswordLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each user to 5 password change attempts per windowMs
    message: 'Too many password change attempts. Please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

router.post('/change-password', auth(), changePasswordLimiter, authCtrl.changePassword);

// Enrollment form (public but secured by ID in link)
router.get('/enroll/:id', internCtrl.getEnrollmentForm);
router.post('/enroll/:id', upload.fields([
    { name: 'photo', maxCount: 1 },
    { name: 'sign', maxCount: 1 },
    { name: 'nda', maxCount: 1 }
]), internCtrl.submitEnrollment);

// ==================== ADMIN ROUTES ====================

// Dashboard - Get all tabs
router.get('/admin/dashboard/fresh', auth('Admin'), adminCtrl.getFreshApplications);
router.get('/admin/dashboard/pending', auth('Admin'), adminCtrl.getPendingApplications);
router.get('/admin/dashboard/ongoing', auth('Admin'), adminCtrl.getOngoingInterns);
router.get('/admin/dashboard/rejected', auth('Admin'), adminCtrl.getRejectedApplications);
router.get('/admin/dashboard/completed', auth('Admin'), adminCtrl.getCompletedInterns);

// Admin actions
router.post('/admin/decision', auth('Admin'), adminCtrl.decideOnFresh);
router.post('/admin/onboard', auth('Admin'), adminCtrl.finalizeOnboarding);
router.post('/admin/verify-loi', auth('Admin'), adminCtrl.verifyLOI);

// Get detailed intern information (for hyperlink click)
router.get('/admin/intern/:id', auth('Admin'), adminCtrl.getInternDetails);

// ==================== INTERN ROUTES ====================

// Intern profile and reports
router.get('/intern/profile', auth('Intern'), internCtrl.getMyProfile);
router.get('/intern/reports', auth('Intern'), internCtrl.getMyReports);
router.post('/intern/report', auth('Intern'), internCtrl.submitDailyReport);

// ==================== SECURE FILE DOWNLOAD ====================

// Secure file download with JWT authentication (supports subdirectories)
router.get('/files/*', auth(), fileCtrl.downloadFile);

// ==================== AUTH ROUTES ====================

router.post('/logout', authCtrl.logout);

module.exports = router;
