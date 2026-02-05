const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.3',
        info: {
            title: 'Intern Management System API',
            version: '1.0.0',
            description: 'Complete REST API for handling intern applications, onboarding, enrollment, daily reports, and admin dashboard management.',
            contact: {
                name: 'NFSU CoE-CS',
                email: 'coecs@nfsu.ac.in'
            }
        },
        servers: [
            {
                url: 'http://localhost:{port}',
                description: 'Local development server',
                variables: {
                    port: {
                        default: '5000',
                        enum: ['5000', '3000', '8000']
                    }
                }
            },
            {
                url: 'https://portal.nfsu.ac.in',
                description: 'Production server'
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'JWT token obtained from login endpoint'
                }
            },
            schemas: {
                ApiResponse: {
                    type: 'object',
                    properties: {
                        message: { type: 'string', example: 'Operation successful' }
                    }
                },
                ErrorResponse: {
                    type: 'object',
                    properties: {
                        error: { type: 'string', example: 'Error message' }
                    }
                },
                // Application Schemas
                ApplicationRequest: {
                    type: 'object',
                    required: ['fullName', 'enrollmentNo', 'email', 'mobile'],
                    properties: {
                        fullName: { type: 'string', example: 'John Doe' },
                        enrollmentNo: { type: 'string', example: 'ENR2024-001' },
                        email: { type: 'string', format: 'email', example: 'john.doe@example.com' },
                        mobile: { type: 'string', example: '9876543210' },
                        loi: {
                            type: 'string',
                            format: 'binary',
                            description: 'Letter of Intent PDF file (max 1MB)'
                        }
                    }
                },
                Application: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer', example: 1 },
                        fullName: { type: 'string', example: 'John Doe' },
                        enrollmentNo: { type: 'string', example: 'ENR2024-001' },
                        personalEmail: { type: 'string', example: 'john.doe@example.com' },
                        mobileNo: { type: 'string', example: '9876543210' },
                        loiFile: { type: 'string', example: 'uploads/loi/loi-1234567890.pdf' },
                        status: { 
                            type: 'string', 
                            enum: ['Fresh', 'Special_Approval_Required', 'Pending_Enrollment', 'Pending_Approval', 'Active', 'Rejected', 'Completed'],
                            example: 'Fresh'
                        },
                        role: {
                            type: 'string',
                            enum: ['Intern_applied', 'Intern_rejected', 'Intern_approved&ongoing', 'Intern_completed'],
                            example: 'Intern_applied'
                        },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' }
                    }
                },
                // Login Schemas
                LoginRequest: {
                    type: 'object',
                    required: ['username', 'password', 'userType'],
                    properties: {
                        username: { 
                            type: 'string', 
                            example: 'admin',
                            description: 'Admin username or Intern application number'
                        },
                        password: { type: 'string', example: 'password123' },
                        userType: { 
                            type: 'string', 
                            enum: ['admin', 'intern'],
                            example: 'admin'
                        }
                    }
                },
                LoginResponse: {
                    type: 'object',
                    properties: {
                        message: { type: 'string', example: 'Login successful' },
                        token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
                        user: {
                            type: 'object',
                            properties: {
                                id: { type: 'integer', example: 1 },
                                username: { type: 'string', example: 'admin' },
                                email: { type: 'string', example: 'admin@nfsu.ac.in' },
                                fullName: { type: 'string', example: 'System Administrator' },
                                role: { type: 'string', example: 'Admin' }
                            }
                        }
                    }
                },
                // Enrollment Schemas
                EnrollmentFormResponse: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer', example: 1 },
                        fullName: { type: 'string', example: 'John Doe' },
                        enrollmentNo: { type: 'string', example: 'ENR2024-001' },
                        email: { type: 'string', example: 'john.doe@example.com' }
                    }
                },
                EnrollmentRequest: {
                    type: 'object',
                    properties: {
                        fullName: { type: 'string', example: 'John Doe' },
                        enrollmentNo: { type: 'string', example: 'ENR2024-001' },
                        semester: { type: 'string', example: '6' },
                        program: { type: 'string', example: 'Cybersecurity' },
                        department: { type: 'string', example: 'Computer Science' },
                        organization: { type: 'string', example: 'NFSU' },
                        contactNo: { type: 'string', example: '9876543210' },
                        emailAddress: { type: 'string', format: 'email', example: 'john.doe@example.com' },
                        gender: { type: 'string', enum: ['M', 'F', 'O'], example: 'M' },
                        bloodGroup: { type: 'string', example: 'O+' },
                        presentAddress: { type: 'string', example: '123 Main St, City' },
                        permanentAddress: { type: 'string', example: '123 Main St, City' },
                        photo: {
                            type: 'string',
                            format: 'binary',
                            description: 'Passport size photo (JPG/PNG, max 1MB)'
                        },
                        sign: {
                            type: 'string',
                            format: 'binary',
                            description: 'E-signature (JPG/PNG, max 1MB)'
                        },
                        nda: {
                            type: 'string',
                            format: 'binary',
                            description: 'Signed NDA PDF (max 1MB)'
                        }
                    }
                },
                // Admin Decision Schemas
                AdminDecisionRequest: {
                    type: 'object',
                    required: ['id', 'decision'],
                    properties: {
                        id: { type: 'integer', example: 1 },
                        decision: { 
                            type: 'string', 
                            enum: ['Approved', 'Rejected', 'Special Approval Required'],
                            example: 'Approved'
                        },
                        rejectionReason: { 
                            type: 'string', 
                            example: 'Incomplete application',
                            description: 'Required if decision is Rejected'
                        },
                        specialApprovalNotes: {
                            type: 'string',
                            example: 'Requires additional review',
                            description: 'Optional notes for special approval'
                        }
                    }
                },
                AdminOnboardRequest: {
                    type: 'object',
                    required: ['id', 'applicationNo', 'dateOfJoining', 'dateOfLeaving'],
                    properties: {
                        id: { type: 'integer', example: 1 },
                        applicationNo: { type: 'string', example: 'APP001' },
                        dateOfJoining: { type: 'string', format: 'date', example: '2025-01-15' },
                        dateOfLeaving: { type: 'string', format: 'date', example: '2025-06-15' }
                    }
                },
                // Daily Report Schemas
                DailyReportRequest: {
                    type: 'object',
                    required: ['domain', 'workDescription'],
                    properties: {
                        domain: { type: 'string', example: 'Cybersecurity' },
                        workDescription: { 
                            type: 'string', 
                            example: 'Worked on penetration testing from 9 AM to 5 PM',
                            description: 'Work description with time'
                        },
                        toolsUsed: { 
                            type: 'string', 
                            example: 'Nmap (2 hours), Metasploit (3 hours)',
                            description: 'Tools used with time of usage'
                        },
                        issuesFaced: { 
                            type: 'string', 
                            example: 'None',
                            description: 'Issues faced/remarks'
                        }
                    }
                },
                DailyReport: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer', example: 1 },
                        internId: { type: 'integer', example: 1 },
                        domain: { type: 'string', example: 'Cybersecurity' },
                        applicationNo: { type: 'string', example: 'APP001' },
                        name: { type: 'string', example: 'John Doe' },
                        workDescription: { type: 'string', example: 'Worked on penetration testing' },
                        toolsUsed: { type: 'string', example: 'Nmap, Metasploit' },
                        issuesFaced: { type: 'string', example: 'None' },
                        reportDate: { type: 'string', format: 'date', example: '2025-01-15' },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' }
                    }
                },
                // Dashboard Schemas
                OngoingIntern: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer', example: 1 },
                        hyperlinkText: { type: 'string', example: 'APP001-John Doe' },
                        applicationNo: { type: 'string', example: 'APP001' },
                        name: { type: 'string', example: 'John Doe' },
                        startDate: { type: 'string', format: 'date', example: '2025-01-15' },
                        endDate: { type: 'string', format: 'date', example: '2025-06-15' },
                        daysSinceStart: { type: 'integer', example: 30 },
                        daysAttended: { type: 'integer', example: 25 },
                        attendancePct: { type: 'number', example: 83.3 },
                        reports: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/DailyReport' }
                        }
                    }
                },
                InternDetails: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer', example: 1 },
                        fullName: { type: 'string', example: 'John Doe' },
                        enrollmentNo: { type: 'string', example: 'ENR2024-001' },
                        applicationNo: { type: 'string', example: 'APP001' },
                        dateOfJoining: { type: 'string', format: 'date', example: '2025-01-15' },
                        dateOfLeaving: { type: 'string', format: 'date', example: '2025-06-15' },
                        daysSinceStart: { type: 'integer', example: 30 },
                        daysAttended: { type: 'integer', example: 25 },
                        attendancePct: { type: 'number', example: 83.3 },
                        reports: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/DailyReport' }
                        }
                    }
                },
                InternProfile: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer', example: 1 },
                        fullName: { type: 'string', example: 'John Doe' },
                        enrollmentNo: { type: 'string', example: 'ENR2024-001' },
                        personalEmail: { type: 'string', example: 'john.doe@example.com' },
                        mobileNo: { type: 'string', example: '9876543210' },
                        applicationNo: { type: 'string', example: 'APP001' },
                        semester: { type: 'string', example: '6' },
                        program: { type: 'string', example: 'Cybersecurity' },
                        department: { type: 'string', example: 'Computer Science' },
                        organization: { type: 'string', example: 'NFSU' },
                        gender: { type: 'string', enum: ['M', 'F', 'O'], example: 'M' },
                        bloodGroup: { type: 'string', example: 'O+' },
                        presentAddress: { type: 'string', example: '123 Main St' },
                        permanentAddress: { type: 'string', example: '123 Main St' },
                        dateOfJoining: { type: 'string', format: 'date', example: '2025-01-15' },
                        dateOfLeaving: { type: 'string', format: 'date', example: '2025-06-15' },
                        status: { type: 'string', example: 'Active' },
                        role: { type: 'string', example: 'Intern_approved&ongoing' }
                    }
                }
            }
        },
        paths: {
            // ==================== PUBLIC ROUTES ====================
            '/api/apply': {
                post: {
                    tags: ['Application'],
                    summary: 'Submit internship application',
                    description: 'Submit initial application with Letter of Intent (LOI) PDF. File must be PDF format and max 1MB. Magic number validation is performed.',
                    requestBody: {
                        required: true,
                        content: {
                            'multipart/form-data': {
                                schema: { $ref: '#/components/schemas/ApplicationRequest' }
                            }
                        }
                    },
                    responses: {
                        201: {
                            description: 'Application submitted successfully',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/ApiResponse' }
                                }
                            }
                        },
                        400: {
                            description: 'Invalid data or file format',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/ErrorResponse' }
                                }
                            }
                        },
                        500: {
                            description: 'Server error',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/ErrorResponse' }
                                }
                            }
                        }
                    }
                }
            },
            '/api/login': {
                post: {
                    tags: ['Authentication'],
                    summary: 'Login for Admin or Intern',
                    description: 'Authenticate admin or intern user. Returns JWT token for subsequent requests.',
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/LoginRequest' }
                            }
                        }
                    },
                    responses: {
                        200: {
                            description: 'Login successful',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/LoginResponse' }
                                }
                            }
                        },
                        400: {
                            description: 'Invalid request',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/ErrorResponse' }
                                }
                            }
                        },
                        401: {
                            description: 'Invalid credentials',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/ErrorResponse' }
                                }
                            }
                        },
                        403: {
                            description: 'Account not active',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/ErrorResponse' }
                                }
                            }
                        }
                    }
                }
            },
            '/api/enroll/{id}': {
                get: {
                    tags: ['Enrollment'],
                    summary: 'Get enrollment form data',
                    description: 'Retrieve enrollment form information for a specific application ID (from email link)',
                    parameters: [
                        {
                            name: 'id',
                            in: 'path',
                            required: true,
                            schema: { type: 'integer' },
                            description: 'Application ID from enrollment email link'
                        }
                    ],
                    responses: {
                        200: {
                            description: 'Enrollment form data',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/EnrollmentFormResponse' }
                                }
                            }
                        },
                        400: {
                            description: 'Enrollment not available',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/ErrorResponse' }
                                }
                            }
                        },
                        404: {
                            description: 'Application not found',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/ErrorResponse' }
                                }
                            }
                        }
                    }
                },
                post: {
                    tags: ['Enrollment'],
                    summary: 'Submit enrollment form',
                    description: 'Submit complete enrollment form with all required documents. Files must be valid formats (JPG/PNG for photo/signature, PDF for NDA) and max 1MB each.',
                    parameters: [
                        {
                            name: 'id',
                            in: 'path',
                            required: true,
                            schema: { type: 'integer' },
                            description: 'Application ID from enrollment email link'
                        }
                    ],
                    requestBody: {
                        required: true,
                        content: {
                            'multipart/form-data': {
                                schema: { $ref: '#/components/schemas/EnrollmentRequest' }
                            }
                        }
                    },
                    responses: {
                        200: {
                            description: 'Enrollment submitted successfully',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/ApiResponse' }
                                }
                            }
                        },
                        400: {
                            description: 'Invalid data or file format',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/ErrorResponse' }
                                }
                            }
                        },
                        404: {
                            description: 'Application not found',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/ErrorResponse' }
                                }
                            }
                        }
                    }
                }
            },
            // ==================== ADMIN ROUTES ====================
            '/api/admin/dashboard/fresh': {
                get: {
                    tags: ['Admin Dashboard'],
                    summary: 'Get fresh applications',
                    description: 'Retrieve all applications with status "Fresh" for admin review',
                    security: [{ bearerAuth: [] }],
                    responses: {
                        200: {
                            description: 'List of fresh applications',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'array',
                                        items: { $ref: '#/components/schemas/Application' }
                                    }
                                }
                            }
                        },
                        401: {
                            description: 'Unauthorized - Missing or invalid token',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/ErrorResponse' }
                                }
                            }
                        },
                        403: {
                            description: 'Forbidden - Admin access required',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/ErrorResponse' }
                                }
                            }
                        }
                    }
                }
            },
            '/api/admin/dashboard/pending': {
                get: {
                    tags: ['Admin Dashboard'],
                    summary: 'Get pending applications',
                    description: 'Retrieve all applications with status "Pending_Approval" waiting for admin to add Application No. and dates',
                    security: [{ bearerAuth: [] }],
                    responses: {
                        200: {
                            description: 'List of pending applications',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'array',
                                        items: { $ref: '#/components/schemas/Application' }
                                    }
                                }
                            }
                        },
                        401: {
                            description: 'Unauthorized',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/ErrorResponse' }
                                }
                            }
                        },
                        403: {
                            description: 'Forbidden',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/ErrorResponse' }
                                }
                            }
                        }
                    }
                }
            },
            '/api/admin/dashboard/ongoing': {
                get: {
                    tags: ['Admin Dashboard'],
                    summary: 'Get ongoing interns',
                    description: 'Retrieve all active interns with attendance metrics and daily reports. Automatically checks and updates completed interns.',
                    security: [{ bearerAuth: [] }],
                    responses: {
                        200: {
                            description: 'List of ongoing interns with attendance data',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'array',
                                        items: { $ref: '#/components/schemas/OngoingIntern' }
                                    }
                                }
                            }
                        },
                        401: {
                            description: 'Unauthorized',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/ErrorResponse' }
                                }
                            }
                        },
                        403: {
                            description: 'Forbidden',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/ErrorResponse' }
                                }
                            }
                        }
                    }
                }
            },
            '/api/admin/dashboard/rejected': {
                get: {
                    tags: ['Admin Dashboard'],
                    summary: 'Get rejected applications',
                    description: 'Retrieve all applications with status "Rejected"',
                    security: [{ bearerAuth: [] }],
                    responses: {
                        200: {
                            description: 'List of rejected applications',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'array',
                                        items: { $ref: '#/components/schemas/Application' }
                                    }
                                }
                            }
                        },
                        401: {
                            description: 'Unauthorized',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/ErrorResponse' }
                                }
                            }
                        },
                        403: {
                            description: 'Forbidden',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/ErrorResponse' }
                                }
                            }
                        }
                    }
                }
            },
            '/api/admin/dashboard/completed': {
                get: {
                    tags: ['Admin Dashboard'],
                    summary: 'Get completed interns',
                    description: 'Retrieve all interns with status "Completed" including all their daily reports',
                    security: [{ bearerAuth: [] }],
                    responses: {
                        200: {
                            description: 'List of completed interns with reports',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'array',
                                        items: { $ref: '#/components/schemas/OngoingIntern' }
                                    }
                                }
                            }
                        },
                        401: {
                            description: 'Unauthorized',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/ErrorResponse' }
                                }
                            }
                        },
                        403: {
                            description: 'Forbidden',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/ErrorResponse' }
                                }
                            }
                        }
                    }
                }
            },
            '/api/admin/decision': {
                post: {
                    tags: ['Admin Actions'],
                    summary: 'Decide on fresh application',
                    description: 'Approve, reject, or request special approval for a fresh application. If approved, enrollment email is sent automatically.',
                    security: [{ bearerAuth: [] }],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/AdminDecisionRequest' }
                            }
                        }
                    },
                    responses: {
                        200: {
                            description: 'Decision recorded successfully',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/ApiResponse' }
                                }
                            }
                        },
                        400: {
                            description: 'Invalid decision or missing data',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/ErrorResponse' }
                                }
                            }
                        },
                        401: {
                            description: 'Unauthorized',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/ErrorResponse' }
                                }
                            }
                        },
                        403: {
                            description: 'Forbidden',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/ErrorResponse' }
                                }
                            }
                        },
                        404: {
                            description: 'Application not found',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/ErrorResponse' }
                                }
                            }
                        }
                    }
                }
            },
            '/api/admin/onboard': {
                post: {
                    tags: ['Admin Actions'],
                    summary: 'Finalize intern onboarding',
                    description: 'Add Application No., dates, and approve intern. Generates random password and sends credentials via email. Also notifies CoE-CS Head, Dean, and Associate Dean.',
                    security: [{ bearerAuth: [] }],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/AdminOnboardRequest' }
                            }
                        }
                    },
                    responses: {
                        200: {
                            description: 'Intern onboarded successfully',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/ApiResponse' }
                                }
                            }
                        },
                        400: {
                            description: 'Invalid data or intern not in pending status',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/ErrorResponse' }
                                }
                            }
                        },
                        401: {
                            description: 'Unauthorized',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/ErrorResponse' }
                                }
                            }
                        },
                        403: {
                            description: 'Forbidden',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/ErrorResponse' }
                                }
                            }
                        },
                        404: {
                            description: 'Intern not found',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/ErrorResponse' }
                                }
                            }
                        }
                    }
                }
            },
            '/api/admin/intern/{id}': {
                get: {
                    tags: ['Admin Actions'],
                    summary: 'Get detailed intern information',
                    description: 'Retrieve complete intern details including all daily reports. Used when clicking on intern hyperlink in dashboard.',
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        {
                            name: 'id',
                            in: 'path',
                            required: true,
                            schema: { type: 'integer' },
                            description: 'Intern ID'
                        }
                    ],
                    responses: {
                        200: {
                            description: 'Intern details with reports',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/InternDetails' }
                                }
                            }
                        },
                        401: {
                            description: 'Unauthorized',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/ErrorResponse' }
                                }
                            }
                        },
                        403: {
                            description: 'Forbidden',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/ErrorResponse' }
                                }
                            }
                        },
                        404: {
                            description: 'Intern not found',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/ErrorResponse' }
                                }
                            }
                        }
                    }
                }
            },
            // ==================== INTERN ROUTES ====================
            '/api/intern/profile': {
                get: {
                    tags: ['Intern'],
                    summary: 'Get own profile',
                    description: 'Retrieve authenticated intern\'s profile information',
                    security: [{ bearerAuth: [] }],
                    responses: {
                        200: {
                            description: 'Intern profile',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/InternProfile' }
                                }
                            }
                        },
                        401: {
                            description: 'Unauthorized',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/ErrorResponse' }
                                }
                            }
                        },
                        403: {
                            description: 'Forbidden - Intern access required',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/ErrorResponse' }
                                }
                            }
                        },
                        404: {
                            description: 'Profile not found',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/ErrorResponse' }
                                }
                            }
                        }
                    }
                }
            },
            '/api/intern/reports': {
                get: {
                    tags: ['Intern'],
                    summary: 'Get own daily reports',
                    description: 'Retrieve all daily reports submitted by authenticated intern',
                    security: [{ bearerAuth: [] }],
                    responses: {
                        200: {
                            description: 'List of daily reports',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'array',
                                        items: { $ref: '#/components/schemas/DailyReport' }
                                    }
                                }
                            }
                        },
                        401: {
                            description: 'Unauthorized',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/ErrorResponse' }
                                }
                            }
                        },
                        403: {
                            description: 'Forbidden',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/ErrorResponse' }
                                }
                            }
                        }
                    }
                }
            },
            '/api/intern/report': {
                post: {
                    tags: ['Intern'],
                    summary: 'Submit daily status report',
                    description: 'Submit daily work report. Only one report per day allowed. Application No. and Name are automatically hardcoded from intern profile.',
                    security: [{ bearerAuth: [] }],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/DailyReportRequest' }
                            }
                        }
                    },
                    responses: {
                        200: {
                            description: 'Daily report submitted successfully',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/ApiResponse' }
                                }
                            }
                        },
                        400: {
                            description: 'Invalid data or report already submitted for today',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/ErrorResponse' }
                                }
                            }
                        },
                        401: {
                            description: 'Unauthorized',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/ErrorResponse' }
                                }
                            }
                        },
                        403: {
                            description: 'Forbidden - Account not active or not authorized',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/ErrorResponse' }
                                }
                            }
                        }
                    }
                }
            },
            // ==================== AUTH ROUTES ====================
            '/api/logout': {
                post: {
                    tags: ['Authentication'],
                    summary: 'Logout',
                    description: 'Logout endpoint. In JWT stateless system, logout is handled client-side by removing token.',
                    security: [{ bearerAuth: [] }],
                    responses: {
                        200: {
                            description: 'Logged out successfully',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/ApiResponse' }
                                }
                            }
                        },
                        401: {
                            description: 'Unauthorized',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/ErrorResponse' }
                                }
                            }
                        }
                    }
                }
            }
        }
    },
    apis: []
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
