'use strict';

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

const IS_PROD = process.env.NODE_ENV === 'production';

// ── Rate limiter factory ──────────────────────────────────────────────────────
const makeLimit = (max, windowMinutes = 15) =>
  rateLimit({
    windowMs: windowMinutes * 60_000,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    handler(_req, res) {
      res.status(429).json({ error: `Too many attempts. Please wait ${windowMinutes} minutes and try again.` });
    },
  });

// Stricter in production, relaxed in development for convenience
const loginLimiter = makeLimit(IS_PROD ? 5 : 50, 15);
const passwordResetLimiter = makeLimit(IS_PROD ? 3 : 20, 15);
const changePasswordLimiter = makeLimit(IS_PROD ? 5 : 20, 15);
const applicationLimiter = makeLimit(IS_PROD ? 10 : 100, 60); // 10 apps/hr in prod

// ── Public routes ─────────────────────────────────────────────────────────────

// Intern application submission (includes file upload)
router.post('/apply', applicationLimiter, upload.single('loi'), appCtrl.submitApplication);

// Authentication
router.post('/login', loginLimiter, authCtrl.login);

// Password reset flow
router.post('/request-password-reset', passwordResetLimiter, authCtrl.requestPasswordReset);
router.get('/verify-reset-token/:token', authCtrl.verifyResetToken);
router.post('/reset-password/:token', authCtrl.resetPassword);

// Enrollment form (public URL sent by admin, secured by intern ID)
router.get('/enroll/:id', internCtrl.getEnrollmentForm);
router.post(
  '/enroll/:id',
  upload.fields([
    { name: 'photo', maxCount: 1 },
    { name: 'sign', maxCount: 1 },
    { name: 'nda', maxCount: 1 },
  ]),
  internCtrl.submitEnrollment
);

// ── Authenticated routes ──────────────────────────────────────────────────────

// Change own password (any authenticated user)
router.post('/change-password', auth(), changePasswordLimiter, authCtrl.changePassword);

// Logout (any authenticated user)
router.post('/logout', auth(), authCtrl.logout);

// ── Admin routes ──────────────────────────────────────────────────────────────

router.get('/admin/dashboard/fresh', auth('Admin'), adminCtrl.getFreshApplications);
router.get('/admin/dashboard/pending', auth('Admin'), adminCtrl.getPendingApplications);
router.get('/admin/dashboard/ongoing', auth('Admin'), adminCtrl.getOngoingInterns);
router.get('/admin/dashboard/rejected', auth('Admin'), adminCtrl.getRejectedApplications);
router.get('/admin/dashboard/completed', auth('Admin'), adminCtrl.getCompletedInterns);

router.post('/admin/decision', auth('Admin'), adminCtrl.decideOnFresh);
router.post('/admin/onboard', auth('Admin'), adminCtrl.finalizeOnboarding);
router.post('/admin/verify-loi', auth('Admin'), adminCtrl.verifyLOI);

router.get('/admin/intern/:id', auth('Admin'), adminCtrl.getInternDetails);
router.get('/admin/reports/statistics', auth('Admin'), adminCtrl.getReportStatistics);

// ── Intern routes ─────────────────────────────────────────────────────────────

router.get('/intern/profile', auth('Intern'), internCtrl.getMyProfile);
router.get('/intern/reports', auth('Intern'), internCtrl.getMyReports);
router.post('/intern/report', auth('Intern'), internCtrl.submitDailyReport);
router.put('/intern/report/:reportId', auth('Intern'), internCtrl.updateReport);

// ── Secure file downloads ─────────────────────────────────────────────────────
// Any authenticated user can request — fileCtrl enforces per-role permissions
router.get('/files/*', auth(), fileCtrl.downloadFile);

module.exports = router;
