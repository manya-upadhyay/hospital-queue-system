const { Pool } = require('pg');
const logger = require('../utils/logger');

// Force IPv4 on Windows
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
  max: 10,
  min: 2,
  // Only use SSL for production (Supabase), not local PostgreSQL
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

pool.on('error', (err) => logger.error('Unexpected DB error', err));

// Test connection on startup
const testConnection = async () => {
  let client;
  try {
    client = await pool.connect();
    const result = await client.query('SELECT NOW() as time, current_database() as db');
    logger.info(`✅ Database connected! DB: ${result.rows[0].db} | Time: ${result.rows[0].time}`);
  } catch (err) {
    logger.error(`❌ Database connection failed: ${err.message}`);
    logger.error(`👉 DATABASE_URL = ${process.env.DATABASE_URL}`);
  } finally {
    if (client) client.release();
  }
};

testConnection();

const query = async (text, params) => {
  try {
    const res = await pool.query(text, params);
    return res;
  } catch (error) {
    logger.error('Query error', { error: error.message });
    throw error;
  }
};

const getClient = () => pool.connect();

module.exports = { query, getClient, pool };