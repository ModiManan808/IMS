require('dotenv').config();
const { Intern, DailyReport, PasswordReset } = require('../models');

async function clearDB() {
    try {
        console.log("Starting to clear non-admin data...");

        // Delete child records first to avoid foreign key constraint errors
        console.log("Deleting Daily Reports...");
        await DailyReport.destroy({ where: {} });

        console.log("Deleting Password Resets...");
        await PasswordReset.destroy({ where: {} });

        console.log("Deleting Interns...");
        await Intern.destroy({ where: {} });

        console.log("✅ Database cleared successfully. Admin data was untouched.");
        process.exit(0);
    } catch (error) {
        console.error("❌ Error clearing database:", error);
        process.exit(1);
    }
}

clearDB();
