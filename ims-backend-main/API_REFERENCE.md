# API Reference Guide

## Base URL
```
http://localhost:5000/api
```

## Authentication
All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

---

## Public Endpoints

### 1. Submit Application
**POST** `/apply`

**Body (multipart/form-data):**
- `fullName` (string, required)
- `enrollmentNo` (string, required)
- `email` (string, required)
- `mobile` (string, required)
- `loi` (file, required) - PDF, max 1MB

**Response:**
```json
{
  "message": "Application submitted successfully."
}
```

---

### 2. Login
**POST** `/login`

**Body:**
```json
{
  "username": "admin" or "APP001",
  "password": "password",
  "userType": "admin" or "intern"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "token": "jwt-token-here",
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@nfsu.ac.in",
    "fullName": "System Administrator",
    "role": "Admin"
  }
}
```

---

### 3. Get Enrollment Form
**GET** `/enroll/:id`

**Response:**
```json
{
  "id": 1,
  "fullName": "John Doe",
  "enrollmentNo": "ENR001",
  "email": "john@example.com"
}
```

---

### 4. Submit Enrollment Form
**POST** `/enroll/:id`

**Body (multipart/form-data):**
- `fullName` (string)
- `enrollmentNo` (string)
- `semester` (string)
- `program` (string)
- `department` (string)
- `organization` (string)
- `contactNo` (string)
- `emailAddress` (string)
- `gender` (string: "M", "F", or "O")
- `bloodGroup` (string)
- `presentAddress` (string)
- `permanentAddress` (string)
- `photo` (file) - JPG/PNG, max 1MB
- `sign` (file) - JPG/PNG, max 1MB
- `nda` (file) - PDF, max 1MB

**Response:**
```json
{
  "message": "Enrollment submitted successfully"
}
```

---

## Admin Endpoints

### 1. Get Fresh Applications
**GET** `/admin/dashboard/fresh`

**Response:**
```json
[
  {
    "id": 1,
    "fullName": "John Doe",
    "enrollmentNo": "ENR001",
    "personalEmail": "john@example.com",
    "mobileNo": "1234567890",
    "loiFile": "uploads/loi/loi-1234567890.pdf",
    "createdAt": "2025-01-11T10:00:00.000Z"
  }
]
```

---

### 2. Decide on Fresh Application
**POST** `/admin/decision`

**Body:**
```json
{
  "id": 1,
  "decision": "Approved" | "Rejected" | "Special Approval Required",
  "rejectionReason": "Optional reason",
  "specialApprovalNotes": "Optional notes"
}
```

**Response:**
```json
{
  "message": "Status updated successfully"
}
```

---

### 3. Get Pending Applications
**GET** `/admin/dashboard/pending`

**Response:**
```json
[
  {
    "id": 1,
    "fullName": "John Doe",
    "enrollmentNo": "ENR001",
    "personalEmail": "john@example.com",
    "passportPhoto": "uploads/photos/photo-1234567890.jpg",
    "semester": "6",
    "program": "Cybersecurity",
    "department": "CS",
    "organization": "NFSU",
    "gender": "M",
    "bloodGroup": "O+",
    "presentAddress": "Address",
    "permanentAddress": "Address",
    "eSignature": "uploads/signatures/sign-1234567890.png",
    "signedNDA": "uploads/nda/nda-1234567890.pdf",
    "createdAt": "2025-01-11T10:00:00.000Z",
    "updatedAt": "2025-01-11T11:00:00.000Z"
  }
]
```

---

### 4. Finalize Onboarding
**POST** `/admin/onboard`

**Body:**
```json
{
  "id": 1,
  "applicationNo": "APP001",
  "dateOfJoining": "2025-01-15",
  "dateOfLeaving": "2025-06-15"
}
```

**Response:**
```json
{
  "message": "Intern onboarded successfully"
}
```

---

### 5. Get Ongoing Interns
**GET** `/admin/dashboard/ongoing`

**Response:**
```json
[
  {
    "id": 1,
    "hyperlinkText": "APP001-John Doe",
    "applicationNo": "APP001",
    "name": "John Doe",
    "startDate": "2025-01-15",
    "endDate": "2025-06-15",
    "daysSinceStart": 30,
    "daysAttended": 25,
    "attendancePct": 83.3,
    "reports": [
      {
        "id": 1,
        "domain": "Cybersecurity",
        "workDescription": "Worked on penetration testing",
        "toolsUsed": "Nmap, Metasploit",
        "issuesFaced": "None",
        "reportDate": "2025-01-15",
        "createdAt": "2025-01-15T10:00:00.000Z"
      }
    ]
  }
]
```

---

### 6. Get Intern Details
**GET** `/admin/intern/:id`

**Response:**
```json
{
  "id": 1,
  "fullName": "John Doe",
  "applicationNo": "APP001",
  "dateOfJoining": "2025-01-15",
  "dateOfLeaving": "2025-06-15",
  "daysSinceStart": 30,
  "daysAttended": 25,
  "attendancePct": 83.3,
  "reports": [...]
}
```

---

### 7. Get Rejected Applications
**GET** `/admin/dashboard/rejected`

**Response:**
```json
[
  {
    "id": 1,
    "fullName": "John Doe",
    "enrollmentNo": "ENR001",
    "personalEmail": "john@example.com",
    "mobileNo": "1234567890",
    "rejectionReason": "Incomplete application",
    "createdAt": "2025-01-11T10:00:00.000Z",
    "updatedAt": "2025-01-11T12:00:00.000Z"
  }
]
```

---

### 8. Get Completed Interns
**GET** `/admin/dashboard/completed`

**Response:**
```json
[
  {
    "id": 1,
    "hyperlinkText": "APP001-John Doe",
    "applicationNo": "APP001",
    "name": "John Doe",
    "startDate": "2025-01-15",
    "endDate": "2025-06-15",
    "totalDays": 150,
    "daysAttended": 120,
    "attendancePct": 80.0,
    "reports": [...]
  }
]
```

---

## Intern Endpoints

### 1. Get My Profile
**GET** `/intern/profile`

**Response:**
```json
{
  "id": 1,
  "fullName": "John Doe",
  "enrollmentNo": "ENR001",
  "personalEmail": "john@example.com",
  "mobileNo": "1234567890",
  "applicationNo": "APP001",
  "semester": "6",
  "program": "Cybersecurity",
  "department": "CS",
  "organization": "NFSU",
  "gender": "M",
  "bloodGroup": "O+",
  "presentAddress": "Address",
  "permanentAddress": "Address",
  "dateOfJoining": "2025-01-15",
  "dateOfLeaving": "2025-06-15",
  "status": "Active",
  "role": "Intern_approved&ongoing"
}
```

---

### 2. Get My Reports
**GET** `/intern/reports`

**Response:**
```json
[
  {
    "id": 1,
    "domain": "Cybersecurity",
    "applicationNo": "APP001",
    "name": "John Doe",
    "workDescription": "Worked on penetration testing",
    "toolsUsed": "Nmap, Metasploit",
    "issuesFaced": "None",
    "reportDate": "2025-01-15",
    "createdAt": "2025-01-15T10:00:00.000Z"
  }
]
```

---

### 3. Submit Daily Report
**POST** `/intern/report`

**Body:**
```json
{
  "domain": "Cybersecurity",
  "workDescription": "Worked on penetration testing from 9 AM to 5 PM",
  "toolsUsed": "Nmap (2 hours), Metasploit (3 hours)",
  "issuesFaced": "None"
}
```

**Response:**
```json
{
  "message": "Daily report submitted successfully"
}
```

---

## Error Responses

All endpoints may return the following error responses:

**400 Bad Request:**
```json
{
  "error": "Error message"
}
```

**401 Unauthorized:**
```json
{
  "error": "Authorization token missing."
}
```

**403 Forbidden:**
```json
{
  "error": "Insufficient privileges."
}
```

**404 Not Found:**
```json
{
  "error": "Resource not found"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Error message"
}
```

---

## Status Values

### Intern Status
- `Fresh` - Initial application submitted
- `Special_Approval_Required` - Requires special approval
- `Pending_Enrollment` - Approved, waiting for enrollment
- `Pending_Approval` - Enrollment submitted, waiting for admin approval
- `Active` - Approved and active intern
- `Rejected` - Application rejected
- `Completed` - Internship completed

### Intern Role
- `Intern_applied` - Applied for internship
- `Intern_rejected` - Application rejected
- `Intern_approved&ongoing` - Approved and ongoing
- `Intern_completed` - Internship completed
