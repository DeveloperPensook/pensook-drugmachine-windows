// db.js
const { Pool } = require('pg');
require('dotenv').config(); // Load environment variables from .env file

const pool = new Pool({
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_DATABASE
});

module.exports = pool;
