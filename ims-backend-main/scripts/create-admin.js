const bcrypt = require('bcrypt');
const { Admin } = require('../models');

/**
 * Create Default Admin User
 * Run this after database initialization
 */

async function createAdmin() {
    try {
        // Check if admin already exists
        const existingAdmin = await Admin.findOne({ where: { username: 'admin' } });

        if (existingAdmin) {
            console.log('ℹ️  Admin user already exists');
            process.exit(0);
        }

        // Create default admin
        const defaultPassword = await bcrypt.hash('admin123', 10);

        await Admin.create({
            username: 'admin',
            password: defaultPassword,
            email: 'admin@nfsu.ac.in',
            fullName: 'System Administrator',
            role: 'Admin'
        });

        console.log('✅ Default admin created successfully');
        console.log('   Username: admin');
        console.log('   Password: admin123');
        console.log('⚠️  IMPORTANT: Change the default password after first login!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating admin:', error.message);
        process.exit(1);
    }
}

createAdmin();
