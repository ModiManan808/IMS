'use strict';

const { Sequelize } = require('sequelize');
require('dotenv').config();

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

let sequelize;

if (IS_PRODUCTION) {
  // ── Production: PostgreSQL ──────────────────────────────────────────────
  // Render / Railway / Supabase provide DATABASE_URL automatically.
  // Alternatively, individual PG_* vars can be set.
  if (!process.env.DATABASE_URL && !process.env.DB_HOST) {
    console.error('FATAL: No database configuration found for production. Set DATABASE_URL or DB_HOST/DB_NAME/DB_USER/DB_PASS.');
    process.exit(1);
  }

  sequelize = process.env.DATABASE_URL
    ? new Sequelize(process.env.DATABASE_URL, {
        dialect: 'postgres',
        dialectOptions: {
          ssl: {
            require: true,
            rejectUnauthorized: false, // Required for Render/Railway managed DBs
          },
        },
        logging: false,
        pool: {
          max: 10,
          min: 2,
          acquire: 30_000,
          idle: 10_000,
        },
      })
    : new Sequelize(
        process.env.DB_NAME,
        process.env.DB_USER,
        process.env.DB_PASS,
        {
          host: process.env.DB_HOST,
          port: parseInt(process.env.DB_PORT, 10) || 5432,
          dialect: 'postgres',
          dialectOptions: {
            ssl: { require: true, rejectUnauthorized: false },
          },
          logging: false,
          pool: { max: 10, min: 2, acquire: 30_000, idle: 10_000 },
        }
      );
} else {
  // ── Development: SQLite ────────────────────────────────────────────────────
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './database.sqlite',
    logging: process.env.DB_LOGGING === 'true' ? console.log : false,
  });
}

module.exports = sequelize;
