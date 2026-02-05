const { Admin } = require('../models');
const { verifyPassword } = require('../utils/passwordService');
require('dotenv').config();

/**
 * Test script to verify admin login
 */
const testAdminLogin = async () => {
    try {
        const username = process.env.ADMIN_USERNAME || 'admin';
        const password = process.env.ADMIN_PASSWORD || 'admin123';

        console.log('Testing admin login...');
        console.log(`Username: ${username}`);
        console.log(`Password: ${password}`);

        // Find admin
        const admin = await Admin.findOne({ where: { username } });
        
        if (!admin) {
            console.error('❌ Admin not found in database!');
            console.log('Please run: node scripts/seedAdmin.js');
            return;
        }

        console.log('\n✅ Admin found in database:');
        console.log(`  ID: ${admin.id}`);
        console.log(`  Username: ${admin.username}`);
        console.log(`  Email: ${admin.email}`);
        console.log(`  Full Name: ${admin.fullName}`);
        console.log(`  Role: ${admin.role}`);
        console.log(`  Password Hash: ${admin.password.substring(0, 20)}...`);

        // Test password verification
        console.log('\n🔐 Testing password verification...');
        const isValid = await verifyPassword(password, admin.password);
        
        if (isValid) {
            console.log('✅ Password verification successful!');
        } else {
            console.log('❌ Password verification failed!');
            console.log('The password in the database does not match the expected password.');
            console.log('\nPossible issues:');
            console.log('1. Password was hashed incorrectly during seeding');
            console.log('2. Password in .env file is different from what was used during seeding');
            console.log('3. Database password hash is corrupted');
            console.log('\nSolution: Delete the admin and re-run seed script');
        }

    } catch (error) {
        console.error('Error testing admin login:', error);
    }
};

// Run if called directly
if (require.main === module) {
    const { initDB } = require('../models');
    initDB().then(() => {
        testAdminLogin().then(() => {
            process.exit(0);
        });
    });
}

module.exports = testAdminLogin;
