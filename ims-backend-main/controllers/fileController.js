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
        // Extract the full path from wildcard route match
        const filename = req.params[0];
        const user = req.user; // Set by authMiddleware

        // Decode the filename in case it's URL encoded
        const decodedFilename = decodeURIComponent(filename);

        // Prevent directory traversal attacks
        // Allow slashes for subdirectories but prevent .. and other malicious patterns
        if (decodedFilename.includes('..') || decodedFilename.startsWith('/') || decodedFilename.startsWith('\\')) {
            logger.warn(`Directory traversal attempt detected: ${filename} by user ${user.id}`);
            return res.status(403).json({ error: 'Access denied' });
        }

        // Construct safe file path
        const uploadsDir = path.join(__dirname, '../uploads');
        const filePath = path.join(uploadsDir, decodedFilename);

        // Verify file exists
        if (!fs.existsSync(filePath)) {
            logger.info(`File not found: ${decodedFilename}, requested by user ${user.id}`);
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

            // VUL-05: Compare full normalized paths, NOT just basenames.
            // basename-only comparison is an IDOR — two interns can share the same
            // filename causing cross-user file disclosure.
            const internFilePaths = [
                intern.loiFile,
                intern.passportPhoto,
                intern.eSignature,
                intern.signedNDA
            ].filter(Boolean).map(f => {
                // Stored paths may be relative (e.g. 'uploads/loi/file.pdf')
                const abs = path.isAbsolute(f)
                    ? path.normalize(f)
                    : path.normalize(path.join(__dirname, '..', f));
                return abs;
            });

            if (!internFilePaths.includes(normalizedPath)) {
                logger.warn(`Unauthorized file access attempt: ${decodedFilename} by intern ${user.id}`);
                return res.status(403).json({ error: 'You do not have permission to access this file' });
            }
        }

        // Log successful file access
        logger.info(`File accessed: ${decodedFilename} by ${user.userType} ${user.id}`);

        const downloadFilename = path.basename(decodedFilename);
        const ext = path.extname(downloadFilename).toLowerCase();

        // Map extensions to MIME types so images are served inline (not as attachments)
        const mimeMap = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.pdf': 'application/pdf',
        };
        const contentType = mimeMap[ext] || 'application/octet-stream';

        // For images: serve inline so the blob URL works in an <img> tag.
        // For PDFs/other: keep as attachment for download.
        const isImage = ['.jpg', '.jpeg', '.png'].includes(ext);

        res.set('Content-Type', contentType);
        if (!isImage) {
            res.set('Content-Disposition', `attachment; filename="${downloadFilename}"`);
        }

        res.sendFile(filePath, (err) => {
            if (err) {
                logger.error(`Error sending file ${decodedFilename}: ${err.message}`);
                if (!res.headersSent) {
                    res.status(500).json({ error: 'Error sending file' });
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
