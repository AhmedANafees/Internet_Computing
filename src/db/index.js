'use strict';

const pool = require('./pool');
const logger = require('../utils/logger');

async function query(sql, params = []) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}

async function queryOne(sql, params = []) {
  const rows = await query(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

async function withTransaction(work) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await work(connection);
    await connection.commit();
    return result;
  } catch (err) {
    try {
      await connection.rollback();
    } catch (rollbackErr) {
      logger.error('Failed to roll back transaction:', rollbackErr);
    }
    throw err;
  } finally {
    connection.release();
  }
}

async function ping() {
  const connection = await pool.getConnection();
  try {
    await connection.ping();
  } finally {
    connection.release();
  }
}

async function close() {
  await pool.end();
}

module.exports = {
  pool,
  query,
  queryOne,
  withTransaction,
  ping,
  close,
};
