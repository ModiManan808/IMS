# Complete IMS Bug Fix Implementation Plan

## Overview

This plan addresses all 28 remaining bugs in the IMS system, organized by priority and technical scope.

---

## Phase 1: High Priority Bugs & Critical Security (13 bugs)

### HB-04: Better Error Feedback on Application Submission

**Files to Modify:**
- [ApplicationForm.tsx](file:///c:/Users/modim/Code/IMS/ims-frontend-main/src/pages/ApplicationForm.tsx)

**Changes:**
- Display specific error messages from backend (e.g., "Email already exists")
- Show errors in a dedicated error message div instead of alert
- Add field-specific error highlighting

---

### HB-05: Enrollment Form Pre-fill

**Files to Modify:**
- [EnrollmentForm.tsx](file:///c:/Users/modim/Code/IMS/ims-frontend-main/src/pages/EnrollmentForm.tsx)

**Changes:**
- Fetch intern data on component mount using internId from URL
- Pre-populate name and enrollment number fields
- Disable pre-filled fields to prevent modification

---

### HB-06: File Size Display

**Files to Modify:**
- [ApplicationForm.tsx](file:///c:/Users/modim/Code/IMS/ims-frontend-main/src/pages/ApplicationForm.tsx)
- [EnrollmentForm.tsx](file:///c:/Users/modim/Code/IMS/ims-frontend-main/src/pages/EnrollmentForm.tsx)

**Changes:**
- Add onChange handler to file inputs
- Display file size in MB/KB
- Show warning if file exceeds 1MB before submission

---

### HB-07: Magic Number Validation Before Upload

**Files to Modify:**
- [appController.js](file:///c:/Users/modim/Code/IMS/ims-backend-main/controllers/appController.js)
- [adminController.js](file:///c:/Users/modim/Code/IMS/ims-backend-main/controllers/adminController.js)

**Changes:**
- Create custom multer storage with file type validation
- Check magic numbers before writing to disk
- Delete invalid files immediately if upload occurs

---

### HB-08: Forgot Password Functionality

**Files to Create:**
- `ForgotPassword.tsx` - Password reset request page
- `ResetPassword.tsx` - Password reset with token page

**Files to Modify:**
- [Login.tsx](file:///c:/Users/modim/Code/IMS/ims-frontend-main/src/pages/Login.tsx) - Add link to forgot password
- [App.tsx](file:///c:/Users/modim/Code/IMS/ims-frontend-main/src/App.tsx) - Add routes
- [authController.js](file:///c:/Users/modim/Code/IMS/ims-backend-main/controllers/authController.js) - Add reset endpoints

**Backend Logic:**
- Generate reset token (JWT with short expiry)
- Send reset email with link
- Validate token and update password

---

### HB-11: Attendance Calculation Fix

**Files to Modify:**
- [adminController.js](file:///c:/Users/modim/Code/IMS/ims-backend-main/controllers/adminController.js)

**Changes:**
- Create helper function to calculate working days only
- Exclude Saturdays, Sundays, and holidays
- Update attendance percentage calculation

---

### HB-12: Daily Report Duplicate Check

**Files to Modify:**
- [InternDashboard.tsx](file:///c:/Users/modim/Code/IMS/ims-frontend-main/src/pages/intern/InternDashboard.tsx)

**Changes:**
- Check on component mount if today's report exists
- Disable form if already submitted
- Show "Already submitted today" message

---

### HB-14: LOI Verification Guidance

**Files to Modify:**
- [FreshApplications.tsx](file:///c:/Users/modim/Code/IMS/ims-frontend-main/src/pages/admin/FreshApplications.tsx)

**Changes:**
- Add "LOI Checklist" section with verification points
- Add notes field for admin to record verification
- Store verification notes in database

---

### HB-10: Token Blacklist

**Files to Create:**
- `tokenBlacklist.js` - In-memory or Redis blacklist

**Files to Modify:**
- [authController.js](file:///c:/Users/modim/Code/IMS/ims-backend-main/controllers/authController.js) - Add token to blacklist on logout
- [authMiddleware.js](file:///c:/Users/modim/Code/IMS/ims-backend-main/middleware/authMiddleware.js) - Check blacklist

**Implementation:**
- Use Set for in-memory storage (or Redis for production)
- Add token to blacklist on logout
- Check blacklist before validating token

---

### S-03: Rate Limiting

**Files to Modify:**
- [server.js](file:///c:/Users/modim/Code/IMS/ims-backend-main/server.js)
- [authController.js](file:///c:/Users/modim/Code/IMS/ims-backend-main/controllers/authController.js)

**Changes:**
- Install `express-rate-limit`
- Add rate limiter middleware (5 attempts per 15 minutes)
- Apply to `/login` endpoint

---

### S-04: CSRF Protection

**Files to Modify:**
- [server.js](file:///c:/Users/modim/Code/IMS/ims-backend-main/server.js)
- Frontend API config

**Changes:**
- Install `csurf` package
- Add CSRF token generation endpoint
- Include CSRF token in all POST/PUT/DELETE requests

---

### S-05: CORS Restriction

**Files to Modify:**
- [server.js](file:///c:/Users/modim/Code/IMS/ims-backend-main/server.js)

**Changes:**
- Update CORS config to only allow frontend URL
- Read from environment variable `FRONTEND_URL`

```javascript
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3759',
  credentials: true
}));
```

---

### S-02: SMTP Credentials (Verify Only)

**Action:** Verify credentials are in .env (already done)

---

## Phase 2: Medium Priority - Validation (9 bugs)

### MB-01: Input Sanitization

**Files to Modify:** All form components

**Changes:**
- Install `dompurify` for frontend
- Sanitize all text inputs before submission
- Backend already uses parameterized queries (protected)

---

### MB-02: MaxLength Validation

**Files to Modify:**
- [ApplicationForm.tsx](file:///c:/Users/modim/Code/IMS/ims-frontend-main/src/pages/ApplicationForm.tsx)
- [EnrollmentForm.tsx](file:///c:/Users/modim/Code/IMS/ims-frontend-main/src/pages/EnrollmentForm.tsx)

**Changes:**
- Add maxLength to all input fields
- Common limits: name (100), email (255), address (500)

---

### MB-03: Email Domain Validation

**Files to Modify:** All forms with email input

**Changes:**
- Add pattern validation for educational domains
- Warn if using free email providers

---

### MB-04: Phone Number Validation

**Files to Modify:** Forms with mobile number

**Changes:**
- Add pattern for 10-digit Indian numbers
- Format as user types: (XXX) XXX-XXXX

---

### MB-05: Semester Validation

**Files to Modify:** Forms with semester field

**Changes:**
- Use dropdown instead of text input
- Options: 1-8 for undergraduate

---

### MB-06: Admin Dashboard Query Optimization

**Files to Modify:**
- [adminController.js](file:///c:/Users/modim/Code/IMS/ims-backend-main/controllers/adminController.js)

**Changes:**
- Add indexes on status field
- Use `attributes` to select only needed fields
- Implement cursor-based pagination

---

### MB-07: Pagination

**Files to Modify:**
- All admin list pages
- Backend controllers

**Changes:**
- Add pagination component
- Limit results to 20 per page
- Add page navigation

---

### MB-08: File Upload Progress

**Files to Modify:** All forms with file upload

**Changes:**
- Use axios `onUploadProgress` callback
- Show progress bar (0-100%)
- Disable form during upload

---

### MB-09: Email Recipients Validation

**Files to Modify:**
- [server.js](file:///c:/Users/modim/Code/IMS/ims-backend-main/server.js)

**Changes:**
- Validate email addresses in `.env` on startup
- Log warning if invalid
- Don't start server if critical emails missing

---

## Phase 3: Low Priority - Polish (7 bugs)

### LB-01: Remove Console Logs

**Action:** Search and remove/replace with proper logging

---

### LB-02: Dark Mode

**Files to Create:**
- Theme context and toggle component

**Changes:**
- Add dark mode CSS variables
- Store preference in localStorage
- Toggle button in header

---

### LB-03: Consistent Button Styling

**Action:** Create button component with variants

---

### LB-04: Password Visibility Toggle

**Files to Modify:** Login and enrollment forms

**Changes:**
- Add eye icon button
- Toggle input type text/password

---

### LB-06: Toast Notifications

**Files to Modify:** Replace all `alert()` calls

**Changes:**
- Install `react-toastify`
- Replace alerts with toast notifications

---

### LB-07: Better Error Messages

**Action:** Review all error messages for clarity

---

### LB-08: Search/Filter

**Files to Modify:** Admin list pages

**Changes:**
- Add search input
- Filter by name, email, status

---

## Phase 4: Code Quality (6 improvements)

### CQ-01: Code Formatting

**Action:**
- Install Prettier
- Create `.prettierrc` config
- Format all files

---

### CQ-02: JSDoc Comments

**Action:** Add JSDoc to all functions

---

### CQ-03: Extract Constants

**Action:**
- Create `constants.js` files
- Move magic numbers and strings

---

### CQ-04: Error Boundaries

**Files to Create:**
- `ErrorBoundary.tsx`

---

### CQ-05: DRY Refactoring

**Action:** Extract repeated code into utilities

---

### CQ-06: TypeScript Strict Mode

**Files to Modify:**
- `tsconfig.json`

---

## Verification Plan

After each phase:
1. Run both servers
2. Test affected features
3. Check for regressions
4. Update task.md

## Deployment Checklist

- [ ] All tests passing
- [ ] No console errors
- [ ] Environment variables documented
- [ ] README updated with new features
- [ ] Admin manual updated

---

## Estimated Timeline

- **Phase 1**: 4-6 hours (High priority + Security)
- **Phase 2**: 3-4 hours (Validation)
- **Phase 3**: 2-3 hours (Polish)
- **Phase 4**: 2-3 hours (Code quality)

**Total**: ~12-16 hours of focused development
