# IMS Frontend - Intern Management System

Frontend application for the Intern Management System (IMS) for NFSU's Centre of Excellence in Cybersecurity (CoE-CS).

## Features

- **Login Page** - Matching NFSU design with admin/intern login
- **Application Form** - Submit internship applications
- **Enrollment Form** - Complete enrollment with file uploads
- **Admin Dashboard** - Full admin interface with 5 tabs:
  - Fresh Applications
  - Pending Applications
  - Approved & Ongoing Interns
  - Rejected Applications
  - Completed Interns
- **Intern Dashboard** - Daily status reporting
- **Responsive Design** - Works on desktop and mobile

## Setup

### Prerequisites

- Node.js (v14 or higher)
- Backend API running on `http://localhost:5000`

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure API URL (optional):
   Create a `.env` file:
   ```env
   REACT_APP_API_URL=http://localhost:5000/api
   ```

3. Add NFSU Logo:
   Place the NFSU logo as `public/nfsu-logo.png`

4. Start development server:
   ```bash
   npm start
   ```

The app will open at `http://localhost:3000`

## Project Structure

```
src/
├── components/       # Reusable components (Header, Sidebar, etc.)
├── config/          # API configuration
├── pages/           # Page components
│   ├── admin/      # Admin pages
│   └── intern/     # Intern pages
├── services/        # API service functions
├── types/           # TypeScript type definitions
└── App.tsx         # Main app component with routing
```

## Available Scripts

- `npm start` - Start development server
- `npm build` - Build for production
- `npm test` - Run tests
- `npm run eject` - Eject from Create React App

## API Integration

The frontend connects to the backend API at `http://localhost:5000/api` by default. All API calls are handled through service files in `src/services/`.

## Authentication

- Uses JWT tokens stored in localStorage
- Protected routes require authentication
- Role-based access control (Admin/Intern)

## Design

The frontend matches the NFSU portal design with:
- Dark blue header with NFSU branding
- Dark grey sidebar navigation
- Clean, modern UI
- Responsive layout

## Notes

- Make sure the backend API is running before starting the frontend
- The NFSU logo should be placed in `public/nfsu-logo.png`
- File uploads are limited to 1MB as per backend requirements
