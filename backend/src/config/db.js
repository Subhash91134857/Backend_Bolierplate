const { Pool } = require('pg');
const logger = require('../utils/logger');
const { gEnv } = require('../utils/env');

const pool = new Pool({
    user: gEnv('DB_USER', 'postgres'),
    host: gEnv('DB_HOST', 'localhost'),
    database: gEnv('DB_NAME', 'postgres'),
    password: gEnv('DB_PASSWORD', 'your_password'),
    port: gEnv('DB_PORT', 5432),
});

const connectToDB = async () => {
    try {
        const client = await pool.connect();
        const res = await client.query('SELECT NOW()');
        logger.info(`📦 Connected to PostgreSQL at ${res.rows[0].now}`);
        client.release();
    } catch (err) {
        logger.error('❌ PostgreSQL connection error:', err);
        process.exit(1);
    }
};

module.exports = { pool, connectToDB };
