const fs = require('fs');
const path = require('path');
const { Sequelize } = require('sequelize');

/**
 * Database Fix Script
 * This script fixes the corrupted Interns_backup table issue
 * and reinitializes the database safely
 */

const DB_PATH = path.join(__dirname, '../database.sqlite');
const BACKUP_PATH = path.join(__dirname, '../database.sqlite.backup');

async function fixDatabase() {
    console.log('🔧 Starting database fix process...\n');

    // Step 1: Check if database exists
    if (!fs.existsSync(DB_PATH)) {
        console.log('ℹ️  No database file found. Will create a fresh one.');
    } else {
        console.log('✅ Database file found at:', DB_PATH);

        // Create backup if not already done
        if (!fs.existsSync(BACKUP_PATH)) {
            console.log('📦 Creating backup...');
            fs.copyFileSync(DB_PATH, BACKUP_PATH);
            console.log('✅ Backup created at:', BACKUP_PATH);
        } else {
            console.log('ℹ️  Backup already exists, skipping...');
        }
    }

    // Step 2: Delete corrupted database
    if (fs.existsSync(DB_PATH)) {
        console.log('\n🗑️  Removing corrupted database...');
        fs.unlinkSync(DB_PATH);
        console.log('✅ Old database removed');
    }

    // Step 3: Initialize fresh database with proper configuration
    console.log('\n🔨 Creating fresh database with proper configuration...');

    const sequelize = new Sequelize({
        dialect: 'sqlite',
        storage: DB_PATH,
        logging: console.log
    });

    try {
        // Test connection
        await sequelize.authenticate();
        console.log('✅ Database connection established');

        // Import models
        const Intern = require('../models/Intern');
        const DailyReport = require('../models/DailyReport');
        const Admin = require('../models/Admin');

        // Set up associations
        Intern.hasMany(DailyReport, { foreignKey: 'internId', as: 'reports' });
        DailyReport.belongsTo(Intern, { foreignKey: 'internId', as: 'intern' });

        // Sync database with force: true to create fresh tables
        console.log('\n📊 Creating database tables...');
        await sequelize.sync({ force: true });
        console.log('✅ All tables created successfully');

        // Step 4: Create default admin user
        console.log('\n👤 Creating default admin user...');
        const bcrypt = require('bcrypt');
        const defaultPassword = await bcrypt.hash('admin123', 10);

        await Admin.create({
            username: 'admin',
            password: defaultPassword,
            email: 'admin@nfsu.ac.in',
            fullName: 'System Administrator',
            role: 'Admin'
        });
        console.log('✅ Default admin created (username: admin, password: admin123)');
        console.log('⚠️  IMPORTANT: Change the default password after first login!\n');

        console.log('✨ Database fix completed successfully!\n');
        console.log('📋 Summary:');
        console.log('   - Old database backed up');
        console.log('   - Fresh database created');
        console.log('   - All tables initialized');
        console.log('   - Default admin account created');
        console.log('\n🚀 You can now start the server with: node server.js\n');

        await sequelize.close();
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Error during database fix:', error);
        await sequelize.close();
        process.exit(1);
    }
}

// Run the fix
fixDatabase();
