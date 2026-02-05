const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Intern = sequelize.define('Intern', {
    // --- Phase 1: Application ---
    fullName: { type: DataTypes.STRING, allowNull: false },
    enrollmentNo: { type: DataTypes.STRING, allowNull: false },
    personalEmail: { type: DataTypes.STRING, allowNull: false, unique: true },
    mobileNo: { type: DataTypes.STRING, allowNull: false },
    loiFile: { type: DataTypes.STRING, allowNull: false }, // File Path
    
    // Status & Roles
    status: { 
        type: DataTypes.ENUM,
        values: ['Fresh', 'Special_Approval_Required', 'Pending_Enrollment', 'Pending_Approval', 'Active', 'Rejected', 'Completed'],
        defaultValue: 'Fresh'
    },
    role: { 
        type: DataTypes.ENUM,
        values: ['Intern_applied', 'Intern_rejected', 'Intern_approved&ongoing', 'Intern_completed'],
        defaultValue: 'Intern_applied'
    },
    rejectionReason: { type: DataTypes.TEXT },
    specialApprovalNotes: { type: DataTypes.TEXT },

    // --- Phase 2: Enrollment Details ---
    passportPhoto: { type: DataTypes.STRING },
    semester: { type: DataTypes.STRING },
    program: { type: DataTypes.STRING }, // Program/Project name
    department: { type: DataTypes.STRING },
    organization: { type: DataTypes.STRING },
    gender: { type: DataTypes.ENUM('M', 'F', 'O') },
    bloodGroup: { type: DataTypes.STRING },
    presentAddress: { type: DataTypes.TEXT },
    permanentAddress: { type: DataTypes.TEXT },
    eSignature: { type: DataTypes.STRING },
    signedNDA: { type: DataTypes.STRING },

    // --- Phase 3: Admin Onboarding ---
    applicationNo: { type: DataTypes.STRING, unique: true }, // Username
    password: { type: DataTypes.STRING }, // Hashed with bcrypt
    dateOfJoining: { type: DataTypes.DATEONLY },
    dateOfLeaving: { type: DataTypes.DATEONLY }
}, {
    timestamps: true
});

module.exports = Intern;