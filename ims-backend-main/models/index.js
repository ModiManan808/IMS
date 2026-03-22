const sequelize = require('../config/database');
const { DataTypes } = require('sequelize');
const Intern = require('./Intern');
const DailyReport = require('./DailyReport');
const Admin = require('./Admin');
const PasswordReset = require('./PasswordReset');

// Relation: One Intern has Many Reports
Intern.hasMany(DailyReport, { foreignKey: 'internId', as: 'reports' });
DailyReport.belongsTo(Intern, { foreignKey: 'internId', as: 'intern' });

const isDuplicateColumnError = (error) => {
    const message = String(error?.message || '').toLowerCase();
    const originalCode = error?.original?.code || error?.parent?.code;

    // Postgres duplicate_column, SQLite duplicate column name, MySQL duplicate field name
    if (originalCode === '42701' || originalCode === 'SQLITE_ERROR' || originalCode === 'ER_DUP_FIELDNAME') {
        return message.includes('duplicate column') || message.includes('duplicate column name');
    }

    return (
        message.includes('duplicate column name') ||
        message.includes('column') && message.includes('already exists')
    );
};

const ensureColumn = async (queryInterface, tableName, currentColumns, columnName, definition) => {
    if (currentColumns[columnName]) return;

    try {
        await queryInterface.addColumn(tableName, columnName, definition);
        console.log(`✅ Added missing column ${tableName}.${columnName}`);
    } catch (error) {
        if (!isDuplicateColumnError(error)) {
            throw error;
        }
    }
};

const initDB = async () => {
    try {
        // Use force: false to avoid backup table issues
        // In production, use migrations instead of sync
        await sequelize.sync({ force: false });

        // Lightweight schema guard for environments without migrations
        // Prevent runtime failures when model fields are added later.
        const queryInterface = sequelize.getQueryInterface();
        const internColumns = await queryInterface.describeTable('Interns');

        await ensureColumn(queryInterface, 'Interns', internColumns, 'enrollmentSalt', {
            type: DataTypes.STRING,
            allowNull: true,
        });

        await ensureColumn(queryInterface, 'Interns', internColumns, 'enrollmentTokenHash', {
            type: DataTypes.STRING,
            allowNull: true,
        });

        console.log("✅ Database synced successfully");
    } catch (error) {
        console.error("❌ Database sync failed:", error.message);
        throw error;
    }
};

module.exports = { Intern, DailyReport, Admin, PasswordReset, initDB };