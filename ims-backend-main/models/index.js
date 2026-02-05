const sequelize = require('../config/database');
const Intern = require('./Intern');
const DailyReport = require('./DailyReport');
const Admin = require('./Admin');

// Relation: One Intern has Many Reports
Intern.hasMany(DailyReport, { foreignKey: 'internId', as: 'reports' });
DailyReport.belongsTo(Intern, { foreignKey: 'internId', as: 'intern' });

const initDB = async () => {
    try {
        // Use force: false to avoid backup table issues
        // In production, use migrations instead of sync
        await sequelize.sync({ force: false });
        console.log("✅ Database synced successfully");
    } catch (error) {
        console.error("❌ Database sync failed:", error.message);
        throw error;
    }
};

module.exports = { Intern, DailyReport, Admin, initDB };