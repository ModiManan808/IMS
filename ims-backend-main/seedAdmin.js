/**
 * One-time admin seed script.
 * Run with: node seedAdmin.js
 */
const bcrypt = require('bcryptjs');
require('dotenv').config();

const { initDB } = require('./models');
const { Admin } = require('./models');

const seedAdmin = async () => {
    await initDB();

    const existing = await Admin.findOne({ where: { username: 'admin' } });
    if (existing) {
        console.log('✅ Admin already exists. No changes made.');
        process.exit(0);
    }

    const hashedPassword = await bcrypt.hash('admin123', 10);

    await Admin.create({
        username: 'admin',
        password: hashedPassword,
        email: 'admin@nfsu.ac.in',
        fullName: 'System Administrator',
        role: 'Admin'
    });

    console.log('✅ Admin user created successfully!');
    console.log('   Username : admin');
    console.log('   Password : admin123');
    process.exit(0);
};

seedAdmin().catch(err => {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
});
