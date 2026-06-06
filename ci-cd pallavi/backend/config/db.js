const { Pool } = require('pg');
require('dotenv').config();
const log = require('../utils/logger');

// ─── DB Configuration ────────────────────────────────────────────────────────
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: String(process.env.DB_PASSWORD || ''),
  database: process.env.DB_NAME || 'cicd_dashboard',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// ─── Async Connection Test ───────────────────────────────────────────────────
const connectDB = async () => {
  try {
    const client = await pool.connect();
    log.db('PostgreSQL Storage Matrix Synchronized');
    client.release();
  } catch (error) {
    log.warn(`Database Connection Fragmented: ${error.message}`);
    log.info('Running in Local-State Cache Mode (No Persistence)');
  }
};

// ─── Handle Unexpected Errors ────────────────────────────────────────────────
pool.on('error', (err) => {
  log.error(`Unexpected Database Matrix Collapse: ${err.message}`);
  process.exit(-1);
});

module.exports = {
  pool,
  query: (text, params) => pool.query(text, params),
  connectDB
};
