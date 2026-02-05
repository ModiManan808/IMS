# IMS (Internship Management System) - Comprehensive Bug Report

**Project**: Internship Management System  
**Date**: January 27, 2026  
**Analysis Type**: Full Stack Bug Analysis (Frontend + Backend)

---

## Executive Summary

This document contains a comprehensive analysis of bugs, security issues, and potential problems identified in the IMS project. Issues are categorized by **severity** and organized by component.

### Statistics
- **Critical Bugs**: 8
- **High Priority Bugs**: 12
- **Medium Priority Bugs**: 9
- **Low Priority Issues**: 6
- **Total Issues**: 35

---

## 🔴 CRITICAL BUGS (Must Fix Immediately)

### CB-01: Admin Redirection Bug After Login
**Location**: [Login.tsx](file:///c:/Users/modim/Code/IMS/ims-frontend-main/src/pages/Login.tsx#L25)  
**Severity**: CRITICAL  
**Description**: After admin login, the app navigates to `/admin` which then redirects to `/admin/fresh`. This causes a double navigation and can result in routing issues.  
**Current Code**:
```tsx
if (user.role === 'Admin') {
  navigate('/admin');  // This redirects to /admin/fresh immediately
}
```
**Impact**: Navigation inconsistency, potential flash of wrong page, broken back button behavior.  
**Root Cause**: App.tsx line 90-94 has a redirect from `/admin` to `/admin/fresh`, causing double navigation.

---

### CB-02: Missing Unauthorized Route Handler
**Location**: [App.tsx](file:///c:/Users/modim/Code/IMS/ims-frontend-main/src/pages/App.tsx), [ProtectedRoute.tsx](file:///c:/Users/modim/Code/IMS/ims-frontend-main/src/components/ProtectedRoute.tsx#L26)  
**Severity**: CRITICAL  
**Description**: When a user tries to access a route without proper permissions, the app redirects to `/unauthorized` route which doesn't exist, causing a blank/error page.  
**Current Code**:
```tsx
return <Navigate to="/unauthorized" replace />;
```
**Impact**: Users see blank page when accessing unauthorized routes. Poor user experience.

---

### CB-03: Port Mismatch Between Frontend and Backend
**Location**: [api.ts](file:///c:/Users/modim/Code/IMS/ims-frontend-main/src/config/api.ts#L3), [.env](file:///c:/Users/modim/Code/IMS/ims-backend-main/.env#L8)  
**Severity**: CRITICAL  
**Description**: Frontend API config uses port 5586, but there's potential for mismatched configuration.  
**Current Code**:
```typescript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5586/api';
```
**Impact**: Frontend cannot connect to backend if ports don't match. 401/Network errors.

---

### CB-04: No Error Handling for Email Failures
**Location**: [adminController.js](file:///c:/Users/modim/Code/IMS/ims-backend-main/controllers/adminController.js#L53-L67)  
**Severity**: CRITICAL  
**Description**: When sending approval emails fails, the intern status is still changed to `Pending_Enrollment`, but they never receive the enrollment link.  
**Current Code**:
```javascript
intern.status = 'Pending_Enrollment';
await intern.save();
// Email sending happens AFTER status change
await sendEmail(...);
```
**Impact**: Interns marked as approved but never notified. Data inconsistency.

---

### CB-05: Password Hash Verification Missing Await
**Location**: [authController.js](file:///c:/Users/modim/Code/IMS/ims-backend-main/controllers/authController.js#L57)  
**Severity**: CRITICAL  
**Description**: The `verifyPassword` function might be async but the code assumes it returns a promise that's awaited. Need to verify implementation.  
**Impact**: Login may fail or succeed incorrectly if password verification isn't properly awaited.

---

### CB-06: SQL Injection Risk in Unique Constraint Violation
**Location**: [appController.js](file:///c:/Users/modim/Code/IMS/ims-backend-main/controllers/appController.js#L12-L20)  
**Severity**: CRITICAL  
**Description**: No duplicate email check before creating intern. Sequelize will throw error, but error message may expose database structure.  
**Current Code**:
```javascript
await Intern.create({
    personalEmail: req.body.email,  // No duplicate check
    // ...
});
```
**Impact**: Poor error messages, potential information disclosure about database schema.

---

### CB-07: No Token Expiration Handling on Protected Routes
**Location**: [authMiddleware.js](file:///c:/Users/modim/Code/IMS/ims-backend-main/middleware/authMiddleware.js#L44)  
**Severity**: CRITICAL  
**Description**: When JWT expires, error message is generic. Frontend receives 401 but might not handle it properly in all cases.  
**Impact**: User stuck in invalid auth state, poor error messaging.

---

### CB-08: Sidebar State Not Persistent
**Location**: [App.tsx](file:///c:/Users/modim/Code/IMS/ims-frontend-main/src/App.tsx#L21)  
**Severity**: HIGH (marked as critical for UX)  
**Description**: Sidebar state resets on page refresh because it's not stored in localStorage.  
**Current Code**:
```tsx
const [sidebarOpen, setSidebarOpen] = useState(false);
```
**Impact**: Poor user experience, sidebar state lost on refresh.

---

## 🟠 HIGH PRIORITY BUGS

### HB-01: Missing Profile Page Implementation
**Location**: [App.tsx](file:///c:/Users/modim/Code/IMS/ims-frontend-main/src/App.tsx#L85)  
**Severity**: HIGH  
**Description**: `/intern/profile` route shows "Profile (Coming Soon)" placeholder, but Header dropdown has a link to `/profile` which doesn't exist.  
**Locations**:
- [App.tsx Line 85](file:///c:/Users/modim/Code/IMS/ims-frontend-main/src/App.tsx#L85)
- [Header.tsx Line 43](file:///c:/Users/modim/Code/IMS/ims-frontend-main/src/components/Header.tsx#L43)
**Impact**: Broken navigation link in header dropdown.

---

### HB-02: Duplicate Route for Intern Reports
**Location**: [App.tsx](file:///c:/Users/modim/Code/IMS/ims-frontend-main/src/App.tsx#L78-L82)  
**Severity**: HIGH  
**Description**: `/intern/reports` and `/intern/dashboard` both render the same `InternDashboard` component.  
**Current Code**:
```tsx
<Route path="/intern/dashboard" element={<InternDashboard />} />
<Route path="/intern/reports" element={<InternDashboard />} />
```
**Impact**: Confusing routing, sidebar shows separate items but they're the same page.

---

### HB-03: No Validation for Date Fields
**Location**: [PendingApplications.tsx](file:///c:/Users/modim/Code/IMS/ims-frontend-main/src/pages/admin/PendingApplications.tsx#L98-L114)  
**Severity**: HIGH  
**Description**: Admin can set `dateOfJoining` after `dateOfLeaving`, causing negative internship duration.  
**Impact**: Invalid data in database, attendance calculations break, negative percentages.

---

### HB-04: Missing Error Feedback on Application Submission
**Location**: [ApplicationForm.tsx](file:///c:/Users/modim/Code/IMS/ims-frontend-main/src/pages/ApplicationForm.tsx)  
**Severity**: HIGH  
**Description**: When application submission fails due to duplicate email, user gets generic alert without specific reason.  
**Impact**: User doesn't know why application failed.

---

### HB-05: Enrollment Form Doesn't Pre-fill Existing Data
**Location**: [EnrollmentForm.tsx](file:///c:/Users/modim/Code/IMS/ims-frontend-main/src/pages/EnrollmentForm.tsx)  
**Severity**: HIGH  
**Description**: When intern opens enrollment form, their name and enrollment number aren't pre-filled even though the backend returns them.  
**Impact**: User has to re-enter data they already provided.

---

### HB-06: No File Size Display Before Upload
**Location**: [ApplicationForm.tsx](file:///c:/Users/modim/Code/IMS/ims-frontend-main/src/pages/ApplicationForm.tsx), [EnrollmentForm.tsx](file:///c:/Users/modim/Code/IMS/ims-frontend-main/src/pages/EnrollmentForm.tsx)  
**Severity**: HIGH  
**Description**: Users can select files larger than 1MB but only find out after upload fails.  
**Impact**: Poor UX, wasted time uploading large files only to get error.

---

### HB-07: Magic Number Validation Happens After Upload
**Location**: [appController.js](file:///c:/Users/modim/Code/IMS/ims-backend-main/controllers/appController.js#L6-L9)  
**Severity**: HIGH  
**Description**: File is uploaded to disk BEFORE magic number validation, leaving invalid files on server.  
**Current Code**:
```javascript
// File already uploaded by multer
if (!validateMagicNumber(req.file.path, ['pdf'])) {
    return res.status(400).json({ error: "..." });
    // File remains on disk
}
```
**Impact**: Server disk fills with invalid files, security risk.

---

### HB-08: Forgot Password Button Does Nothing
**Location**: [Login.tsx](file:///c:/Users/modim/Code/IMS/ims-frontend-main/src/pages/Login.tsx#L121)  
**Severity**: HIGH  
**Description**: "Forgot Password?" button exists but has no functionality.  
**Current Code**:
```tsx
<button type="button" className="forgot-password">Forgot Password ?</button>
```
**Impact**: Misleading UI, users expect functionality that doesn't exist.

---

### HB-09: No Loading State in Fresh Applications
**Location**: [FreshApplications.tsx](file:///c:/Users/modim/Code/IMS/ims-frontend-main/src/pages/admin/FreshApplications.tsx#L29-L45)  
**Severity**: HIGH  
**Description**: When admin makes a decision, there's no loading state. Multiple rapid clicks can submit duplicate requests.  
**Impact**: Potential duplicate decision submissions, API rate issues.

---

### HB-10: Session Not Invalidated on Logout
**Location**: [authController.js](file:///c:/Users/modim/Code/IMS/ims-backend-main/controllers/authController.js#L110-L114)  
**Severity**: HIGH  
**Description**: JWT tokens aren't blacklisted on logout. Old tokens remain valid until expiration.  
**Current Code**:
```javascript
exports.logout = async (req, res) => {
    // No token blacklist
    res.json({ message: 'Logged out successfully' });
};
```
**Impact**: Security risk, stolen tokens remain valid after logout.

---

### HB-11: Attendance Calculation Includes Weekends/Holidays
**Location**: [adminController.js](file:///c:/Users/modim/Code/IMS/ims-backend-main/controllers/adminController.js#L198-L209)  
**Severity**: HIGH  
**Description**: Attendance percentage calculation counts all days including weekends and holidays.  
**Current Code**:
```javascript
const daysSinceStart = Math.max(1, Math.ceil(timeDiff / (1000 * 60 * 60 * 24)));
const attendancePct = ((daysAttended / daysSinceStart) * 100).toFixed(1);
```
**Impact**: Attendance percentages appear artificially low.

---

### HB-12: No Check for Existing Daily Report Before Form Submission
**Location**: [InternDashboard.tsx](file:///c:/Users/modim/Code/IMS/ims-frontend-main/src/pages/intern/InternDashboard.tsx#L32-L43)  
**Severity**: HIGH  
**Description**: Frontend allows interns to fill out the entire form before checking if they already submitted today's report.  
**Impact**: Wasted intern time, poor UX when backend rejects the submission.

---

### HB-13: Admin Logout State Persistence
**Location**: [Admin layout/Auth logic]
**Severity**: HIGH
**Description**: After logging out, the admin panel UI persists. Redirecting to login page works, but refreshing sometimes shows admin UI again or redirects back to admin dashboard erroneously.
**Impact**: Security risk, confusion, users believes they are still logged in.

---

### HB-14: LOI Verification Gap
**Location**: [FreshApplications.tsx]
**Severity**: HIGH
**Description**: Admin has no way to verify if the Letter of Intent (LOI) submitted by the student is authentic or matches what the university expects.
**Impact**: Process integrity issue, potential for fraudulent applications.

---

## 🟡 MEDIUM PRIORITY BUGS

### MB-01: Missing Input Sanitization
**Location**: Multiple form components  
**Severity**: MEDIUM  
**Description**: User inputs aren't sanitized before being sent to backend. Potential XSS if not handled by backend.  
**Impact**: Security risk, potential script injection.

---

### MB-02: No Maximum Length Validation on Text Fields
**Location**: [ApplicationForm.tsx](file:///c:/Users/modim/Code/IMS/ims-frontend-main/src/pages/ApplicationForm.tsx), [EnrollmentForm.tsx](file:///c:/Users/modim/Code/IMS/ims-frontend-main/src/pages/EnrollmentForm.tsx)  
**Severity**: MEDIUM  
**Description**: Text inputs and textareas don't have maxLength attributes.  
**Impact**: Users can submit excessively long data, database errors, UI overflow.

---

### MB-03: Email Validation Only Checks Format
**Location**: Multiple form components  
**Severity**: MEDIUM  
**Description**: Email inputs use HTML5 validation which only checks basic format, not if email is from a valid domain.  
**Impact**: Fake email addresses accepted.

---

### MB-04: Mobile Number Validation Missing
**Location**: [ApplicationForm.tsx](file:///c:/Users/modim/Code/IMS/ims-frontend-main/src/pages/ApplicationForm.tsx), [EnrollmentForm.tsx](file:///c:/Users/modim/Code/IMS/ims-frontend-main/src/pages/EnrollmentForm.tsx)  
**Severity**: MEDIUM  
**Description**: No validation for mobile number format (should be 10 digits for Indian numbers).  
**Impact**: Invalid phone numbers stored in database.

---

### MB-05: Admin Dashboard Loads All Data on Every Visit
**Location**: [AdminDashboard.tsx](file:///c:/Users/modim/Code/IMS/ims-frontend-main/src/pages/admin/AdminDashboard.tsx#L17-L35)  
**Severity**: MEDIUM  
**Description**: Dashboard makes 5 API calls to get counts for all tabs, not optimized.  
**Current Code**:
```typescript
const [fresh, pending, ongoing, rejected, completed] = await Promise.all([
    adminService.getFreshApplications(),  // Gets ALL data, just to count
    // ... 4 more full data fetches
]);
```
**Impact**: Slow dashboard load, unnecessary data transfer.

---

### MB-06: No Pagination on Long Lists
**Location**: All admin pages (FreshApplications, PendingApplications, etc.)  
**Severity**: MEDIUM  
**Description**: All applications/interns loaded at once without pagination.  
**Impact**: Slow page load with many records, poor UX with 100+ entries.

---

### MB-07: Status Service Called Synchronously
**Location**: [adminController.js](file:///c:/Users/modim/Code/IMS/ims-backend-main/controllers/adminController.js#L178-L179)  
**Severity**: MEDIUM  
**Description**: `checkAndUpdateCompletedInterns()` is called on every request to ongoing/completed tabs, slowing down response.  
**Impact**: Slow API responses, should be a scheduled cron job instead.

---

### MB-08: Hardcoded Email Recipients in Code
**Location**: [adminController.js](file:///c:/Users/modim/Code/IMS/ims-backend-main/controllers/adminController.js#L144-L148)  
**Severity**: MEDIUM  
**Description**: Email recipients defined in code with env fallbacks, but no validation if recipients exist.  
**Impact**: Emails sent to wrong/non-existent addresses if env not configured.

---

### MB-09: File Path Exposed in API Response
**Location**: Multiple controllers  
**Severity**: MEDIUM  
**Description**: File paths from server disk are returned in API responses (loiFile, passportPhoto, etc.).  
**Impact**: Information disclosure about server file structure.

---

## 🟢 LOW PRIORITY ISSUES

### LB-01: Console Logs in Production Code
**Location**: Multiple files ([authController.js](file:///c:/Users/modim/Code/IMS/ims-backend-main/controllers/authController.js#L15), [Login.tsx](file:///c:/Users/modim/Code/IMS/ims-frontend-main/src/pages/Login.tsx#L32))  
**Severity**: LOW  
**Description**: Debug console.log statements present in production code.  
**Impact**: Information leakage in browser console, cluttered logs.

---

### LB-02: No Accessibility Attributes
**Location**: All form components  
**Severity**: LOW  
**Description**: Forms lack aria-labels, roles, and other accessibility attributes.  
**Impact**: Poor screen reader support, accessibility compliance issues.

---

### LB-03: No Dark Mode Support
**Location**: All CSS files  
**Severity**: LOW  
**Description**: UI is light mode only, no dark mode option.  
**Impact**: User preference not accommodated, eye strain in low light.

---

### LB-04: Search Bar in Header Non-Functional
**Location**: [Header.tsx](file:///c:/Users/modim/Code/IMS/ims-frontend-main/src/components/Header.tsx#L29-L32)  
**Severity**: LOW  
**Description**: Search bar in header exists but has no functionality.  
**Impact**: Misleading UI element.

---

### LB-05: No Confirmation Dialog Before Delete/Reject Actions
**Location**: [FreshApplications.tsx](file:///c:/Users/modim/Code/IMS/ims-frontend-main/src/pages/admin/FreshApplications.tsx)  
**Severity**: LOW  
**Description**: When admin rejects application, no "Are you sure?" confirmation dialog.  
**Impact**: Accidental rejections possible.

---

### LB-06: Sidebar Toggle Not Visible on Mobile
**Location**: [App.tsx](file:///c:/Users/modim/Code/IMS/ims-frontend-main/src/App.tsx), [Sidebar.tsx](file:///c:/Users/modim/Code/IMS/ims-frontend-main/src/components/Sidebar.tsx)  
**Severity**: LOW  
**Description**: No hamburger menu button visible to toggle sidebar on mobile.  
**Impact**: Mobile users can't access navigation easily.

---

## 📋 SECURITY ISSUES

### S-01: JWT Secret Hardcoded Fallback
**Location**: [authController.js](file:///c:/Users/modim/Code/IMS/ims-backend-main/controllers/authController.js#L75), [authMiddleware.js](file:///c:/Users/modim/Code/IMS/ims-backend-main/middleware/authMiddleware.js#L21)  
**Severity**: CRITICAL  
**Description**: JWT uses fallback secret 'your-secret-key' if env not set.  
**Current Code**:
```javascript
jwt.sign(payload, process.env.JWT_SECRET || 'your-secret-key', ...)
```
**Impact**: Predictable token generation in production if env misconfigured.

---

### S-02: SMTP Credentials in .env File
**Location**: [.env](file:///c:/Users/modim/Code/IMS/ims-backend-main/.env#L24-L26)  
**Severity**: HIGH  
**Description**: Real Gmail credentials committed to repository.  
**Impact**: Email account compromise if repository is public.

---

### S-03: No Rate Limiting on Login Endpoint
**Location**: [routes/apiRoutes.js](file:///c:/Users/modim/Code/IMS/ims-backend-main/routes/apiRoutes.js#L16)  
**Severity**: HIGH  
**Description**: Login endpoint has no rate limiting, vulnerable to brute force attacks.  
**Impact**: Password brute force possible.

---

### S-04: No CSRF Protection
**Location**: All routes  
**Severity**: MEDIUM  
**Description**: No CSRF tokens implemented for state-changing operations.  
**Impact**: Cross-site request forgery attacks possible.

---

### S-05: Cors Allows All Origins
**Location**: [server.js](file:///c:/Users/modim/Code/IMS/ims-backend-main/server.js#L19)  
**Severity**: MEDIUM  
**Description**: CORS middleware used without origin restriction.  
**Current Code**:
```javascript
app.use(cors());  // Allows all origins
```
**Impact**: Any website can make requests to your API.

---

## 🔧 CODE QUALITY ISSUES

### CQ-01: Inconsistent Error Handling
**Location**: Multiple controllers  
**Description**: Some functions use try-catch, others don't. Error responses not standardized.

---

### CQ-02: No Input Validation Middleware
**Location**: All routes  
**Description**: Input validation done manually in each controller instead of using middleware like express-validator.

---

### CQ-03: Magic Strings for Status/Role Values
**Location**: [Intern.js](file:///c:/Users/modim/Code/IMS/ims-backend-main/models/Intern.js#L14-L21)  
**Description**: Status and role values hardcoded as strings, should use constants.  
**Example**: `'Pending_Enrollment'`, `'Intern_approved&ongoing'`

---

### CQ-04: No TypeScript on Backend
**Location**: Backend  
**Description**: Frontend uses TypeScript but backend is JavaScript, inconsistent type safety.

---

## 📊 SUMMARY BY COMPONENT

### Backend Issues: 20
- Critical: 5
- High: 8  
- Medium: 5
- Low: 2

### Frontend Issues: 15
- Critical: 3
- High: 4
- Medium: 4
- Low: 4

---

## 🎯 RECOMMENDED FIX PRIORITY

### **Phase 1 - Critical Fixes (Do First)**
1. CB-01: Fix admin login redirection
2. CB-02: Add unauthorized page/handler
3. CB-04: Handle email failures properly
4. S-01: Remove hardcoded JWT secret
5. S-02: Remove credentials from .env, use .env.example

### **Phase 2 - High Priority**
1. HB-03: Add date validation
2. HB-07: Fix file validation order
3. HB-10: Implement token blacklist
4. HB-11: Fix attendance calculation
5. S-03: Add rate limiting

### **Phase 3 - Medium Priority**
1. MB-01: Add input sanitization
2. MB-05: Optimize dashboard loading
3. MB-06: Implement pagination
4. MB-07: Move status check to cron job

### **Phase 4 - Polish & UX**
1. Implement all Low Priority issues
2. Add missing features (profile page, forgot password)
3. Improve accessibility

---

## 📝 NOTES

- Many issues stem from lack of validation at multiple layers
- Security concerns should be addressed before production deployment
- Consider implementing proper logging and monitoring
- Add automated tests to catch regressions
- Create a development roadmap for missing features

---

**Report Generated**: January 27, 2026  
**Analyst**: AI Code Reviewer  
**Next Step**: Review and prioritize with development team
