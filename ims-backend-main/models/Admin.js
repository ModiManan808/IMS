const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Admin = sequelize.define('Admin', {
    username: { 
        type: DataTypes.STRING, 
        allowNull: false, 
        unique: true 
    },
    password: { 
        type: DataTypes.STRING, 
        allowNull: false 
    }, // Hashed with bcrypt
    email: { 
        type: DataTypes.STRING, 
        allowNull: false, 
        unique: true 
    },
    fullName: { 
        type: DataTypes.STRING, 
        allowNull: false 
    },
    role: { 
        type: DataTypes.ENUM('Admin'),
        defaultValue: 'Admin'
    }
}, {
    timestamps: true
});

module.exports = Admin;
