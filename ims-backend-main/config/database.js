const { Sequelize } = require('sequelize');
require('dotenv').config();

const getEnv = (key, fallback = '') => {
    const value = process.env[key];
    return typeof value === 'string' && value.length > 0 ? value : fallback;
};

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './database.sqlite',
    logging: false
});

module.exports = sequelize;