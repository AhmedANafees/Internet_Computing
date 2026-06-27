'use strict';

// creates the database and tables from src/db/schema.sql (npm run db:init).

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const config = require('../src/config');
const logger = require('../src/utils/logger');

async function main() {
  const schemaPath = path.join(__dirname, '..', 'src', 'db', 'schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8');

  const connection = await mysql.createConnection({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    multipleStatements: true,
  });

  try {
    logger.info('Running schema from', schemaPath);
    await connection.query(sql);
    logger.info('Schema applied successfully.');
  } finally {
    await connection.end();
  }
}

main().catch((err) => {
  logger.error('Failed to initialize the database:', err.message);
  process.exit(1);
});
