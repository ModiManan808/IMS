/**
 * One-time script to clear all intern and daily report records.
 * The admin user (role = 'Admin') is preserved.
 * Run: node scripts/clearInterns.js
 */
require('dotenv').config();
const { Intern, DailyReport } = require('../models');

(async () => {
    try {
        // Delete all daily reports first (FK constraint)
        const reports = await DailyReport.destroy({ where: {}, truncate: false });
        console.log(`✅ Deleted ${reports} daily report(s)`);

        // Delete all interns except Admin
        const interns = await Intern.destroy({
            where: {},
            truncate: false,
        });
        console.log(`✅ Deleted ${interns} intern record(s)`);

        console.log('\nDatabase cleared successfully. Admin account preserved.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error clearing database:', err.message);
        process.exit(1);
    }
})();
