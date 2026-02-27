'use strict';

const nodemailer = require('nodemailer');
const logger = require('./logger');
require('dotenv').config();

/**
 * Creates a fresh transporter every time — avoids stale cached credentials.
 */
const createTransporter = () => {
    const { SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS } = process.env;

    if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
        logger.warn('SMTP env vars missing — emails will be logged to console instead of sent.');
        return null;
    }

    return nodemailer.createTransport({
        host: SMTP_HOST,
        port: Number(SMTP_PORT),
        secure: SMTP_SECURE === 'true', // true for port 465, false for 587
        auth: {
            user: SMTP_USER,
            pass: SMTP_PASS,
        },
        // Timeout settings to prevent hanging
        connectionTimeout: 10_000,
        greetingTimeout: 10_000,
        socketTimeout: 15_000,
    });
};

/**
 * Send an email.
 * @param {string|string[]} to - Recipient email(s)
 * @param {string} subject - Email subject
 * @param {string} text - Plain text body
 * @param {string|null} html - Optional HTML body
 * @param {string|null} attachmentPath - Optional file path to attach
 */
const sendEmail = async (to, subject, text, html = null, attachmentPath = null) => {
    const transporter = createTransporter();

    // Fallback: log to console if SMTP not configured
    if (!transporter) {
        const recipients = Array.isArray(to) ? to.join(', ') : to;
        logger.info(`[Email stub] To: ${recipients} | Subject: ${subject}\n${text}`);
        return;
    }

    const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER;

    const mailOptions = {
        from: fromAddress,
        to: Array.isArray(to) ? to.join(', ') : to,
        subject,
        text,
    };

    if (html) {
        mailOptions.html = html;
    }

    if (attachmentPath) {
        const fs = require('fs');
        const path = require('path');
        if (fs.existsSync(attachmentPath)) {
            mailOptions.attachments = [{
                filename: path.basename(attachmentPath),
                path: attachmentPath,
            }];
        } else {
            logger.warn(`Attachment not found: ${attachmentPath}`);
        }
    }

    try {
        const info = await transporter.sendMail(mailOptions);
        logger.info(`Email sent successfully`, {
            to: mailOptions.to,
            subject,
            messageId: info.messageId,
        });
    } catch (error) {
        logger.error(`Failed to send email`, {
            to: mailOptions.to,
            subject,
            error: error.message,
            code: error.code,
        });
        throw error; // Re-throw so caller knows it failed
    }
};

/**
 * Send email to multiple recipients.
 */
const sendEmailToMultiple = async (recipients, subject, text, html = null) => {
    await sendEmail(recipients, subject, text, html);
};

module.exports = sendEmail;
module.exports.sendEmailToMultiple = sendEmailToMultiple;