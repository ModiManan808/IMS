const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Configure Storage (Where to save the temp file)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Organize files into subdirectories based on field name
        let subDir = uploadDir;
        if (file.fieldname === 'loi') {
            subDir = path.join(uploadDir, 'loi');
        } else if (file.fieldname === 'photo') {
            subDir = path.join(uploadDir, 'photos');
        } else if (file.fieldname === 'sign') {
            subDir = path.join(uploadDir, 'signatures');
        } else if (file.fieldname === 'nda') {
            subDir = path.join(uploadDir, 'nda');
        }
        
        // Ensure directory exists
        if (!fs.existsSync(subDir)) {
            fs.mkdirSync(subDir, { recursive: true });
        }
        
        cb(null, subDir);
    },
    filename: (req, file, cb) => {
        // Save with timestamp to prevent overwriting
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// Filter & Limit Configuration
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 1 * 1024 * 1024, // 1 MB in bytes (Strict Limit)
    },
    // Optional: First line of defense (Extension check). 
    // Real security happens in your Controller with Magic Numbers.
    fileFilter: (req, file, cb) => {
        checkFileType(file, cb);
    }
});

// Helper to check extension (Optional but recommended)
function checkFileType(file, cb) {
    // Allowed extensions
    const filetypes = /jpeg|jpg|png|pdf/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Error: Files of this type are not allowed!'));
    }
}

module.exports = upload;