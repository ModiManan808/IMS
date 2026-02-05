const nodemailer = require('nodemailer');
require('dotenv').config();

let transporter;

const createTransporter = () => {
    const { SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS } = process.env;

    if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
        console.warn('SMTP env vars missing; emails will be logged instead of sent.');
        return null;
    }

    return nodemailer.createTransport({
        host: SMTP_HOST,
        port: Number(SMTP_PORT),
        secure: SMTP_SECURE === 'true',
        auth: {
            user: SMTP_USER,
            pass: SMTP_PASS
        }
    });
};

/**
 * Send email with support for multiple recipients and attachments
 * @param {string|string[]} to - Single email or array of emails
 * @param {string} subject - Email subject
 * @param {string} text - Email body (plain text)
 * @param {string} [html] - Email body (HTML, optional)
 * @param {string} [attachmentPath] - Path to file attachment (optional)
 * @returns {Promise<void>}
 */
const sendEmail = async (to, subject, text, html = null, attachmentPath = null) => {
    if (!transporter) {
        transporter = createTransporter();
    }

    // Fallback to console logging if transporter could not be created
    if (!transporter) {
        const recipients = Array.isArray(to) ? to.join(', ') : to;
        console.log(`[Email stub] To: ${recipients} | Subject: ${subject}\n${text}`);
        if (attachmentPath) {
            console.log(`[Email stub] Attachment: ${attachmentPath}`);
        }
        return;
    }

    const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER;

    const mailOptions = {
        from: fromAddress,
        to: Array.isArray(to) ? to.join(', ') : to,
        subject,
        text
    };

    if (html) {
        mailOptions.html = html;
    }

    if (attachmentPath) {
        const fs = require('fs');
        if (fs.existsSync(attachmentPath)) {
            mailOptions.attachments = [{
                filename: require('path').basename(attachmentPath),
                path: attachmentPath
            }];
        } else {
            console.warn(`Attachment file not found: ${attachmentPath}`);
        }
    }

    await transporter.sendMail(mailOptions);
};

/**
 * Send email to multiple recipients
 * @param {string[]} recipients - Array of email addresses
 * @param {string} subject - Email subject
 * @param {string} text - Email body
 * @param {string} [html] - Email body (HTML, optional)
 * @returns {Promise<void>}
 */
const sendEmailToMultiple = async (recipients, subject, text, html = null) => {
    await sendEmail(recipients, subject, text, html);
};

module.exports = sendEmail;
module.exports.sendEmailToMultiple = sendEmailToMultiple;

