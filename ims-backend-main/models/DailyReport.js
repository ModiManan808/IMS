const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DailyReport = sequelize.define('DailyReport', {
    internId: { 
        type: DataTypes.INTEGER, 
        allowNull: false,
        references: {
            model: 'Interns',
            key: 'id'
        }
    },
    domain: { type: DataTypes.STRING, allowNull: false },
    applicationNo: { type: DataTypes.STRING, allowNull: false }, // Hardcoded from intern
    name: { type: DataTypes.STRING, allowNull: false }, // Hardcoded from intern
    workDescription: { type: DataTypes.TEXT, allowNull: false }, // Work description with time
    toolsUsed: { type: DataTypes.TEXT }, // Tools used with time of usage
    issuesFaced: { type: DataTypes.TEXT }, // Issues faced/remarks
    reportDate: { type: DataTypes.DATEONLY, defaultValue: DataTypes.NOW }
}, {
    timestamps: true
});

module.exports = DailyReport;