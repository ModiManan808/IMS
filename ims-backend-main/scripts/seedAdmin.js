const { Admin } = require('../models');
const { hashPassword } = require('../utils/passwordService');
require('dotenv').config();

/**
 * Seed script to create an admin user
 * Usage: node scripts/seedAdmin.js
 */
const seedAdmin = async () => {
    try {
        const username = process.env.ADMIN_USERNAME || 'admin';
        const password = process.env.ADMIN_PASSWORD || 'admin123';
        const email = process.env.ADMIN_EMAIL || 'admin@nfsu.ac.in';
        const fullName = process.env.ADMIN_FULL_NAME || 'System Administrator';

        // Check if admin already exists
        const existingAdmin = await Admin.findOne({ where: { username } });
        if (existingAdmin) {
            console.log('Admin user already exists. Skipping seed.');
            return;
        }

        // Hash password
        const hashedPassword = await hashPassword(password);

        // Create admin
        await Admin.create({
            username,
            password: hashedPassword,
            email,
            fullName,
            role: 'Admin'
        });

        console.log('Admin user created successfully!');
        console.log(`Username: ${username}`);
        console.log(`Password: ${password}`);
        console.log('Please change the password after first login.');
    } catch (error) {
        console.error('Error seeding admin:', error);
        process.exit(1);
    }
};

// Run if called directly
if (require.main === module) {
    const { initDB } = require('../models');
    initDB().then(() => {
        seedAdmin().then(() => {
            process.exit(0);
        });
    });
}

module.exports = seedAdmin;
