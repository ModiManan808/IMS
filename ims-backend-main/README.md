# Intern Management System (IMS) Backend

Backend API for the Intern Management System for NFSU's Centre of Excellence in Cybersecurity (CoE-CS).

## Features

- Application submission with LOI upload
- Admin dashboard with multiple tabs (Fresh, Pending, Approved & Ongoing, Rejected, Completed)
- Enrollment form with file uploads (photo, signature, NDA)
- Daily status reporting for interns
- Automatic status transitions
- Email notifications
- JWT-based authentication
- File validation using magic numbers

## Setup

### Prerequisites

- Node.js (v14 or higher)
- PostgreSQL database
- SMTP server for email notifications

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory:
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

   # Frontend URL
   FRONTEND_URL=https://portal.nfsu.ac.in

   # Admin Seed (optional)
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD=admin123
   ADMIN_EMAIL=admin@nfsu.ac.in
   ADMIN_FULL_NAME=System Administrator
   ```

4. Create the database:
   ```sql
   CREATE DATABASE ims_db;
   ```

5. Seed admin user:
   ```bash
   node scripts/seedAdmin.js
   ```

6. Start the server:
   ```bash
   npm start
   # or for development
   npm run dev
   ```

## API Endpoints

### Public Endpoints

- `POST /api/apply` - Submit application
- `POST /api/login` - Login (admin or intern)
- `GET /api/enroll/:id` - Get enrollment form
- `POST /api/enroll/:id` - Submit enrollment form

### Admin Endpoints (Protected)

- `GET /api/admin/dashboard/fresh` - Get fresh applications
- `GET /api/admin/dashboard/pending` - Get pending applications
- `GET /api/admin/dashboard/ongoing` - Get ongoing interns
- `GET /api/admin/dashboard/rejected` - Get rejected applications
- `GET /api/admin/dashboard/completed` - Get completed interns
- `POST /api/admin/decision` - Decide on fresh application
- `POST /api/admin/onboard` - Finalize onboarding
- `GET /api/admin/intern/:id` - Get intern details

### Intern Endpoints (Protected)

- `GET /api/intern/profile` - Get own profile
- `GET /api/intern/reports` - Get own reports
- `POST /api/intern/report` - Submit daily report

## Authentication

All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

## File Uploads

- All files are limited to 1MB
- File types are validated using magic numbers (file signatures)
- Supported formats:
  - PDF (for LOI and NDA)
  - JPG/PNG (for photos and signatures)

## Status Flow

1. **Fresh** - Initial application submitted
2. **Pending_Enrollment** - Approved, waiting for enrollment
3. **Pending_Approval** - Enrollment submitted, waiting for admin approval
4. **Active** - Approved and active intern
5. **Rejected** - Application rejected
6. **Completed** - Internship completed (automatic on end date)

## Development

See `DEVELOPMENT_PLAN.md` for detailed development documentation.

## License

ISC
