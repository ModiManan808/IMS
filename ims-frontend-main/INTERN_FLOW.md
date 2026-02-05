# Intern Form Flow - Complete Guide

## Application Flow for Interns

### Step 1: Initial Application (Public)
**URL:** `/apply` (accessible without login)

**What intern does:**
1. Visit the homepage
2. Click "Apply Now" 
3. Fill out the application form:
   - Full Name
   - Enrollment Number
   - Email ID
   - Mobile Number
   - Upload signed LOI (PDF, max 1MB)

**What happens:**
- Application is submitted
- Status: `Fresh`
- Admin receives notification

### Step 2: Admin Approval
**Admin Action:**
- Admin logs in and goes to "NEW Fresh" tab
- Reviews application
- Makes decision: Approved / Rejected / Special Approval Required

**If Approved:**
- Status changes to `Pending_Enrollment`
- **Email sent to intern** with:
  - Enrollment link: `http://localhost:3759/enroll/{id}`
  - NDA PDF attachment

### Step 3: Enrollment (Public - via email link)
**URL:** `/enroll/:id` (from email link, no login required)

**What intern does:**
1. Clicks the enrollment link from email
2. Fills out enrollment form:
   - All personal details
   - Passport photo (JPG/PNG, max 1MB)
   - E-signature (JPG/PNG, max 1MB)
   - Signed NDA (PDF, max 1MB)
3. Submits form

**What happens:**
- Status changes to `Pending_Approval`
- Form sent back to admin

### Step 4: Admin Final Approval
**Admin Action:**
- Admin goes to "Pending" tab
- Reviews enrollment form
- Adds:
  - Application No.
  - Date of Joining
  - Date of Leaving
- Clicks "Approve"

**What happens:**
- Random password generated
- Status: `Active`
- Role: `Intern_approved&ongoing`
- **Email sent to intern** with login credentials:
  - Username: Application No.
  - Password: (random password)
- **Email sent to** CoE-CS Head, Dean, Associate Dean

### Step 5: Intern Login & Daily Reports
**URL:** `/login` (intern logs in with Application No. and password)

**What intern does:**
1. Logs in with Application No. (username) and password
2. Goes to Dashboard
3. Submits daily status report every day:
   - Domain
   - Work description with time
   - Tools used with time
   - Issues faced/remarks

**Admin View:**
- Admin sees intern in "Approved & Ongoing" tab
- Can click on `ApplicationNo-Name` hyperlink
- Views all details and daily reports
- Sees attendance statistics

### Step 6: Completion
**Automatic:**
- When end date passes, status automatically changes to `Completed`
- Intern moved to "Completed" tab
- All reports remain accessible

## Summary

**Intern Access Points:**
1. `/apply` - Initial application (public)
2. `/enroll/:id` - Enrollment form (from email link, public)
3. `/login` - Login page (public)
4. `/intern/dashboard` - Daily reports (after login)

**No login required for:**
- Application submission
- Enrollment form (accessed via email link)

**Login required for:**
- Daily report submission
- Viewing own reports
- Viewing profile
