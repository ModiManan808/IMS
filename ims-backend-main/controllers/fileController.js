const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');

/**
 * Secure File Download Controller
 * Requires JWT authentication and validates file access permissions
 */

/**
 * Download a file securely with JWT authentication
 * Prevents directory traversal and validates user permissions
 */
exports.downloadFile = async (req, res) => {
    try {
        const { filename } = req.params;
        const user = req.user; // Set by authMiddleware

        // Sanitize filename to prevent directory traversal
        const sanitizedFilename = path.basename(filename);

        if (sanitizedFilename !== filename) {
            logger.warn(`Directory traversal attempt detected: ${filename} by user ${user.id}`);
            return res.status(403).json({ error: 'Access denied' });
        }

        // Construct safe file path
        const uploadsDir = path.join(__dirname, '../uploads');
        const filePath = path.join(uploadsDir, sanitizedFilename);

        // Verify file exists
        if (!fs.existsSync(filePath)) {
            logger.info(`File not found: ${sanitizedFilename}, requested by user ${user.id}`);
            return res.status(404).json({ error: 'File not found' });
        }

        // Verify file is within uploads directory (additional security check)
        const normalizedPath = path.normalize(filePath);
        const normalizedUploadsDir = path.normalize(uploadsDir);

        if (!normalizedPath.startsWith(normalizedUploadsDir)) {
            logger.warn(`Path traversal attempt: ${filename} by user ${user.id}`);
            return res.status(403).json({ error: 'Access denied' });
        }

        // Permission check: Admins can access all files
        // Interns can only access their own files (if needed, implement file ownership check)
        // For now, we allow authenticated users to download files
        // You can add more granular permissions based on your requirements

        // Example: Check if filename belongs to the requesting intern
        // This assumes filenames contain the user's ID or applicationNo
        if (user.userType === 'intern') {
            // Example check: verify the file belongs to this intern
            // For LOI files, passport photos, signatures, NDAs
            const { Intern } = require('../models');
            const intern = await Intern.findByPk(user.id);

            if (!intern) {
                logger.warn(`Intern not found for file access: ${user.id}`);
                return res.status(403).json({ error: 'Access denied' });
            }

            // Check if the requested file matches any of the intern's uploaded files
            const internFiles = [
                intern.loiFile,
                intern.passportPhoto,
                intern.eSignature,
                intern.signedNDA
            ].filter(Boolean).map(f => path.basename(f));

            if (!internFiles.includes(sanitizedFilename)) {
                logger.warn(`Unauthorized file access attempt: ${sanitizedFilename} by intern ${user.id}`);
                return res.status(403).json({ error: 'You do not have permission to access this file' });
            }
        }

        // Log successful file access
        logger.info(`File accessed: ${sanitizedFilename} by ${user.userType} ${user.id}`);

        // Stream the file to the client
        res.download(filePath, sanitizedFilename, (err) => {
            if (err) {
                logger.error(`Error downloading file ${sanitizedFilename}: ${err.message}`);
                if (!res.headersSent) {
                    res.status(500).json({ error: 'Error downloading file' });
                }
            }
        });
    } catch (error) {
        logger.error(`File download error: ${error.message}`, { stack: error.stack });
        if (!res.headersSent) {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
};
