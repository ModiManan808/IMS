# Intern Management System (IMS) - Complete Development Plan

## Overview
This document outlines the complete development plan for the Intern Management System for NFSU's Centre of Excellence in Cybersecurity (CoE-CS).

## System Flow

### Phase 1: Application Submission
1. Applicant submits: Name, Enrollment No., Email ID, Mobile No., signed LOI (PDF, max 1MB)
2. Status: `Fresh`
3. Role: `Intern_applied`

### Phase 2: Admin Decision on Fresh Applications
1. Admin reviews in "Fresh" tab
2. Options: `Approved`, `Rejected`, `Special Approval Required`
3. If Approved → Status: `Pending_Enrollment`, Email sent with enrollment link + NDA PDF
4. If Rejected → Status: `Rejected`, Role: `Intern_rejected`
5. If Special Approval → Status: `Special_Approval_Required`

### Phase 3: Enrollment
1. Intern accesses enrollment form via link
2. Fields: Full Name, Enrollment No., Passport photo (JPG/PNG, max 1MB), Semester, Program/Project name, Department, Organization, Contact No., Email Address, Gender (M/F/O), Blood Group, Present Address, Permanent Address, e-signature (JPG/PNG, max 1MB), signed NDA (PDF, max 1MB)
3. After submission → Status: `Pending_Approval`

### Phase 4: Admin Final Approval
1. Admin reviews in "Pending" tab
2. Admin adds: Application No., Date of Joining, Date of Leaving
3. On approval → Status: `Active`, Role: `Intern_approved&ongoing`
4. Random password generated and assigned
5. Email sent to intern with credentials (username = Application No.)
6. Email sent to Head of CoE-CS, Dean, and Associate Dean of SCSDF

### Phase 5: Daily Reporting
1. Intern logs in daily with Application No. (username) and password
2. Submits Daily Status Report: Domain, Application No. (hardcoded), Name, Work description with time, Tools used with time of usage, Issues faced/remarks
3. Admin views in "Approved & Ongoing" tab
4. Shows: Application No., Start date, End date, Days since start, Days attended, Attendance %, List of daily reports

### Phase 6: Completion
1. When end date passes → Status: `Completed`, Role: `Intern_completed`
2. Intern moved to "Completed" tab with all reports intact

---

## Database Models

### 1. Intern Model
```javascript
{
  // Application Phase
  fullName: STRING (required)
  enrollmentNo: STRING (required, unique)
  personalEmail: STRING (required, unique)
  mobileNo: STRING (required)
  loiFile: STRING (required) // File path
  
  // Enrollment Phase
  passportPhoto: STRING // File path
  semester: STRING
  program: STRING // Program/Project name
  department: STRING
  organization: STRING
  gender: ENUM('M', 'F', 'O')
  bloodGroup: STRING
  presentAddress: TEXT
  permanentAddress: TEXT
  eSignature: STRING // File path
  signedNDA: STRING // File path
  
  // Admin Assignment
  applicationNo: STRING (unique) // Used as username
  password: STRING (hashed)
  dateOfJoining: DATEONLY
  dateOfLeaving: DATEONLY
  
  // Status & Role
  status: ENUM('Fresh', 'Special_Approval_Required', 'Pending_Enrollment', 'Pending_Approval', 'Active', 'Rejected', 'Completed')
  role: ENUM('Intern_applied', 'Intern_rejected', 'Intern_approved&ongoing', 'Intern_completed')
  rejectionReason: TEXT
  specialApprovalNotes: TEXT
  
  // Timestamps
  createdAt: DATE
  updatedAt: DATE
}
```

### 2. DailyReport Model
```javascript
{
  internId: INTEGER (Foreign Key -> Intern.id)
  domain: STRING (required)
  applicationNo: STRING (required) // Hardcoded from intern
  name: STRING (required) // Hardcoded from intern
  workDescription: TEXT (required) // Work description with time
  toolsUsed: TEXT // Tools used with time of usage
  issuesFaced: TEXT // Issues faced/remarks
  reportDate: DATEONLY (default: today)
  
  // Timestamps
  createdAt: DATE
  updatedAt: DATE
}
```

### 3. Admin Model
```javascript
{
  username: STRING (required, unique)
  password: STRING (required, hashed)
  email: STRING (required, unique)
  fullName: STRING (required)
  role: ENUM('Admin') (default: 'Admin')
  
  // Timestamps
  createdAt: DATE
  updatedAt: DATE
}
```

### 4. EmailTemplate Model (Optional - for storing email templates)
```javascript
{
  templateName: STRING (unique)
  subject: STRING
  body: TEXT
  variables: JSON // Template variables
}
```

---

## Controllers

### 1. appController.js
- `submitApplication(req, res)` - Handle initial application submission
- `listApplications(req, res)` - List all applications (for admin)

### 2. adminController.js
- `getFreshApplications(req, res)` - Get all Fresh applications
- `getPendingApplications(req, res)` - Get all Pending_Approval applications
- `getOngoingInterns(req, res)` - Get all Active interns with reports
- `getRejectedApplications(req, res)` - Get all Rejected applications
- `getCompletedInterns(req, res)` - Get all Completed interns with reports
- `decideOnFresh(req, res)` - Handle Fresh application decision (Approved/Rejected/Special Approval)
- `finalizeOnboarding(req, res)` - Finalize intern onboarding with application no, dates
- `getInternDetails(req, res)` - Get detailed intern info with all reports (for hyperlink click)

### 3. internController.js
- `submitEnrollment(req, res)` - Handle enrollment form submission
- `submitDailyReport(req, res)` - Submit daily status report
- `getMyReports(req, res)` - Get intern's own reports
- `getMyProfile(req, res)` - Get intern's profile

### 4. authController.js (NEW)
- `login(req, res)` - Handle login for both admin and intern
- `logout(req, res)` - Handle logout
- `refreshToken(req, res)` - Refresh JWT token

---

## Routes (apiRoutes.js)

### Public Routes
```
POST   /api/apply                    - Submit application
GET    /api/enroll/:id               - Get enrollment form (by ID from email link)
POST   /api/enroll/:id               - Submit enrollment form
POST   /api/login                    - Login (admin or intern)
```

### Admin Routes (Protected)
```
GET    /api/admin/dashboard/fresh    - Get Fresh applications
GET    /api/admin/dashboard/pending  - Get Pending applications
GET    /api/admin/dashboard/ongoing  - Get Active interns
GET    /api/admin/dashboard/rejected - Get Rejected applications
GET    /api/admin/dashboard/completed - Get Completed interns
POST   /api/admin/decision           - Decide on Fresh application
POST   /api/admin/onboard            - Finalize onboarding
GET    /api/admin/intern/:id         - Get intern details with reports
```

### Intern Routes (Protected)
```
GET    /api/intern/profile           - Get own profile
POST   /api/intern/report            - Submit daily report
GET    /api/intern/reports           - Get own reports
```

---

## Middleware

### 1. authMiddleware.js (UPDATE)
- Support role-based access: 'Admin', 'Intern_approved&ongoing'
- JWT token validation
- Extract user info from token

### 2. uploadMiddleware.js (KEEP AS IS)
- File size limit: 1MB
- File type validation: PDF, JPG, PNG
- Magic number validation in controllers

### 3. fileValidator.js (KEEP AS IS)
- Magic number validation for PDF, JPG, PNG

---

## Utilities

### 1. emailService.js (UPDATE)
- Support multiple recipients
- Email templates for:
  - Application approved (with enrollment link + NDA)
  - Intern onboarded (to CoE-CS head, Dean, Associate Dean)
  - Login credentials sent
- HTML email support

### 2. passwordService.js (NEW)
- Generate random password
- Hash password with bcrypt
- Verify password

### 3. statusService.js (NEW)
- Automatically move interns from Active to Completed when end date passes
- Cron job or scheduled task

---

## File Structure

```
ims-backend/
├── config/
│   └── database.js
├── controllers/
│   ├── adminController.js
│   ├── appController.js
│   ├── authController.js (NEW)
│   └── internController.js
├── docs/
│   └── swagger.js
├── middleware/
│   ├── authMiddleware.js
│   └── uploadMiddleware.js
├── models/
│   ├── Admin.js (NEW)
│   ├── DailyReport.js
│   ├── Intern.js
│   └── index.js
├── routes/
│   └── apiRoutes.js
├── utils/
│   ├── emailService.js
│   ├── fileValidator.js
│   ├── passwordService.js (NEW)
│   └── statusService.js (NEW)
├── uploads/
│   ├── loi/
│   ├── photos/
│   ├── signatures/
│   └── nda/
├── server.js
├── package.json
└── .env
```

---

## Environment Variables (.env)

```env
# Database
DB_HOST=localhost
DB_NAME=ims_db
DB_USER=postgres
DB_PASS=postgresql

# Server
PORT=5000
NODE_ENV=development

# JWT
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=7d

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@nfsu.ac.in

# Email Recipients
COE_CS_HEAD_EMAIL=head.coecs@nfsu.ac.in
DEAN_EMAIL=dean@nfsu.ac.in
ASSOCIATE_DEAN_EMAIL=associate.dean@nfsu.ac.in

# Frontend URL (for email links)
FRONTEND_URL=https://portal.nfsu.ac.in
```

---

## Key Features Implementation

### 1. Magic Number Validation
- All file uploads validated using magic numbers (file signatures)
- PDF: 25504446 (%PDF)
- JPG: ffd8ff
- PNG: 89504e47

### 2. File Size Validation
- All files limited to 1MB
- Enforced at multer middleware level

### 3. Status Management
- Automatic status transitions:
  - Fresh → Pending_Enrollment (on approval)
  - Pending_Enrollment → Pending_Approval (on enrollment submission)
  - Pending_Approval → Active (on final approval)
  - Active → Completed (when end date passes)

### 4. Role Management
- Intern_applied → Intern_rejected (on rejection)
- Intern_applied → Intern_approved&ongoing (on final approval)
- Intern_approved&ongoing → Intern_completed (when end date passes)

### 5. Email Notifications
- Application approved: Enrollment link + NDA PDF attachment
- Intern onboarded: Notification to CoE-CS head, Dean, Associate Dean
- Login credentials: Username (Application No.) and password

### 6. Attendance Calculation
- Days since start: (Today - Date of Joining)
- Days attended: Count of daily reports
- Attendance %: (Days attended / Days since start) * 100

### 7. Password Management
- Random password generation on approval
- Bcrypt hashing
- Username = Application No.

### 8. Admin Dashboard Tabs
- Fresh: Applications with status 'Fresh'
- Pending: Applications with status 'Pending_Approval'
- Approved & Ongoing: Interns with status 'Active'
- Rejected: Applications with status 'Rejected'
- Completed: Interns with status 'Completed'

---

## API Endpoints Summary

### Application Flow
1. `POST /api/apply` - Submit application
2. `GET /api/admin/dashboard/fresh` - Admin views fresh applications
3. `POST /api/admin/decision` - Admin approves/rejects
4. `GET /api/enroll/:id` - Intern views enrollment form
5. `POST /api/enroll/:id` - Intern submits enrollment
6. `GET /api/admin/dashboard/pending` - Admin views pending applications
7. `POST /api/admin/onboard` - Admin finalizes onboarding
8. `POST /api/login` - Intern logs in
9. `POST /api/intern/report` - Intern submits daily report
10. `GET /api/admin/dashboard/ongoing` - Admin views ongoing interns
11. `GET /api/admin/intern/:id` - Admin views intern details

---

## Security Considerations

1. **File Upload Security**
   - Magic number validation (prevents file type spoofing)
   - File size limits
   - Secure file storage

2. **Authentication**
   - JWT tokens
   - Password hashing with bcrypt
   - Role-based access control

3. **Data Validation**
   - Input validation on all endpoints
   - SQL injection prevention (Sequelize ORM)
   - XSS prevention

4. **Email Security**
   - Secure enrollment links (with unique ID)
   - Password sent via email (consider more secure methods in production)

---

## Testing Checklist

- [ ] Application submission with valid/invalid files
- [ ] Admin decision on fresh applications
- [ ] Enrollment form submission
- [ ] Admin final approval
- [ ] Email notifications
- [ ] Intern login
- [ ] Daily report submission
- [ ] Admin dashboard views
- [ ] Status transitions
- [ ] Attendance calculations
- [ ] Automatic completion on end date

---

## Deployment Considerations

1. **Database**
   - PostgreSQL production database
   - Regular backups
   - Migration scripts

2. **File Storage**
   - Consider cloud storage (AWS S3, etc.) for production
   - Secure file access

3. **Email Service**
   - Production SMTP server
   - Email queue system for reliability

4. **Monitoring**
   - Error logging
   - Performance monitoring
   - Email delivery tracking

---

## Next Steps

1. Update models with all required fields
2. Implement all controllers
3. Update routes
4. Add authentication
5. Implement email service with templates
6. Add password hashing
7. Create admin seed data
8. Test all flows
9. Deploy to production
