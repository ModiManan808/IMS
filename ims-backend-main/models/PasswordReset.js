const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PasswordReset = sequelize.define('PasswordReset', {
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            isEmail: true
        }
    },
    token: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    expiresAt: {
        type: DataTypes.DATE,
        allowNull: false
    },
    used: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    userType: {
        type: DataTypes.ENUM('admin', 'intern'),
        allowNull: false
    }
}, {
    timestamps: true,
    indexes: [
        {
            fields: ['token']
        },
        {
            fields: ['email']
        },
        {
            fields: ['expiresAt']
        }
    ]
});

module.exports = PasswordReset;
