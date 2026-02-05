# IMS - Intern Management System

A comprehensive web-based Intern Management System for managing intern applications, enrollment, onboarding, and daily reporting.

## 🚀 Features

### For Admins
- Review and approve/reject intern applications
- Manage enrollment forms
- Onboard approved interns with credentials
- Track intern attendance and daily reports
- View detailed intern profiles and progress

### For Interns
- Apply for internship positions
- Complete enrollment forms
- Submit daily work reports
- Track personal progress and attendance

## 🛡️ Security Features

✅ **Input Sanitization** - XSS protection on all inputs  
✅ **SQL Injection Prevention** - Parameterized queries  
✅ **File Validation** - Magic number verification for uploads  
✅ **Rate Limiting** - Protection against brute force attacks  
✅ **Password Hashing** - Bcrypt with salt  
✅ **JWT Authentication** - Secure token-based auth  
✅ **DoS Protection** - Input length limits  

## 📁 Project Structure

```
IMS/
├── ims-backend-main/          # Node.js + Express backend
│   ├── controllers/           # Request handlers
│   ├── models/               # Sequelize models
│   ├── routes/               # API routes
│   ├── middleware/           # Auth & validation
│   ├── utils/                # Helper utilities
│   └── scripts/              # Database scripts
├── ims-frontend-main/        # React + TypeScript frontend
│   ├── src/
│   │   ├── components/       # Reusable components
│   │   ├── pages/           # Page components
│   │   ├── context/         # React context
│   │   └── utils/           # Frontend utilities
└── Bugs_and_Fixes/          # Documentation & reports
```

## 🔧 Tech Stack

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** SQLite (with Sequelize ORM)
- **Authentication:** JWT + bcrypt
- **Security:** xss, validator, express-rate-limit
- **Email:** Nodemailer
- **Documentation:** Swagger

### Frontend
- **Framework:** React 18
- **Language:** TypeScript
- **Styling:** CSS
- **HTTP Client:** Axios
- **Routing:** React Router

## 📦 Installation

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Backend Setup

```bash
cd ims-backend-main

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env with your configuration
# JWT_SECRET=your-secret-key
# FRONTEND_URL=http://localhost:3000

# Initialize database
npm run setup

# Start server
npm start
```

Backend will run on `http://localhost:5000` (or 5586 if 5000 is in use)

### Frontend Setup

```bash
cd ims-frontend-main

# Install dependencies
npm install

# Start development server
npm start
```

Frontend will run on `http://localhost:3000`

## 🔐 Default Credentials

After setting up the database:
- **Username:** admin
- **Password:** admin123

⚠️ **IMPORTANT:** Change the default password immediately after first login!

## 📚 API Documentation

Once the backend is running, visit:
- Swagger UI: `http://localhost:5000/docs`
- JSON Spec: `http://localhost:5000/docs.json`

## 🧪 Security Testing

### Run npm audit
```bash
cd ims-backend-main
npm audit

cd ../ims-frontend-main
npm audit
```

### Run Snyk scan
```bash
npm install -g snyk
snyk auth
snyk test
```

## 📖 Documentation

- **Implementation Plan:** `Bugs_and_Fixes/implementation_plan.md`
- **Security Report:** `Bugs_and_Fixes/SECURITY_SCAN_REPORT.md`
- **Walkthrough:** `Bugs_and_Fixes/walkthrough.md`
- **Task Tracking:** `Bugs_and_Fixes/TASK_TRACKING.md`

## 🔄 Database Management

### Reset Database
```bash
cd ims-backend-main

# Backup current database
copy database.sqlite database.sqlite.backup

# Delete and recreate
del database.sqlite
node server.js

# Create admin user
node scripts/create-admin.js
```

## 🚦 Running in Production

1. Set environment variables
2. Use process manager (PM2)
3. Set up reverse proxy (nginx)
4. Enable HTTPS
5. Configure CORS properly
6. Run security audits regularly

## 📝 Workflow

1. **Application:** Intern submits application with LOI
2. **Review:** Admin reviews and approves/rejects
3. **Enrollment:** Approved interns complete enrollment form
4. **Onboarding:** Admin assigns application number and dates
5. **Active:** Intern logs in and submits daily reports
6. **Tracking:** Admin monitors attendance and progress

## 🛠️ Development

### Running Tests
```bash
npm test
```

### Code Quality
```bash
npm run lint
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the ISC License.

## 👥 Authors

- Manan Modi - [@ModiManan808](https://github.com/ModiManan808)

## 🙏 Acknowledgments

- Built with security-first approach
- Comprehensive input validation and sanitization
- Protected against OWASP Top 10 vulnerabilities

---

**Version:** 1.0.0  
**Last Updated:** 2026-02-06
