'use strict';

const bcrypt = require('bcryptjs');
const db = require('../db');
const config = require('../config');

const ROLE_EXPRESSION = `
  CASE
    WHEN ad.admin_id IS NOT NULL THEN 'admin'
    WHEN st.student_id IS NOT NULL THEN 'student'
    ELSE 'unknown'
  END`;

async function hashPassword(plainPassword) {
  return bcrypt.hash(plainPassword, config.auth.bcryptSaltRounds);
}

async function verifyPassword(plainPassword, passwordHash) {
  if (!passwordHash) {
    return false;
  }
  return bcrypt.compare(plainPassword, passwordHash);
}

async function findAccountByEmail(email) {
  return db.queryOne(
    `SELECT a.account_id, a.email, a.password_hash, a.last_login, a.account_status,
            st.student_id, ad.admin_id,
            COALESCE(st.first_name, ad.first_name) AS first_name,
            COALESCE(st.last_name, ad.last_name) AS last_name,
            ${ROLE_EXPRESSION} AS role
       FROM Accounts a
       LEFT JOIN Students st ON st.account_id = a.account_id
       LEFT JOIN Administrators ad ON ad.account_id = a.account_id
      WHERE a.email = ?`,
    [email]
  );
}

async function findAccountById(accountId) {
  return db.queryOne(
    `SELECT a.account_id, a.email, a.last_login, a.account_status,
            st.student_id, ad.admin_id,
            COALESCE(st.first_name, ad.first_name) AS first_name,
            COALESCE(st.last_name, ad.last_name) AS last_name,
            ${ROLE_EXPRESSION} AS role
       FROM Accounts a
       LEFT JOIN Students st ON st.account_id = a.account_id
       LEFT JOIN Administrators ad ON ad.account_id = a.account_id
      WHERE a.account_id = ?`,
    [accountId]
  );
}

async function createStudentAccount({ email, password, profile = {} }) {
  const passwordHash = await hashPassword(password);
  return db.withTransaction(async (conn) => {
    const [account] = await conn.execute(
      'INSERT INTO Accounts (email, password_hash) VALUES (?, ?)',
      [email, passwordHash]
    );
    const accountId = account.insertId;
    const [student] = await conn.execute(
      `INSERT INTO Students
         (account_id, first_name, last_name, student_phone, date_of_birth, program_id, GPA)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        accountId,
        profile.firstName || null,
        profile.lastName || null,
        profile.phone || null,
        profile.dateOfBirth || null,
        profile.programId || null,
        profile.gpa || null,
      ]
    );
    return { accountId, studentId: student.insertId };
  });
}

async function createAdminAccount({ email, password, profile = {} }) {
  const passwordHash = await hashPassword(password);
  return db.withTransaction(async (conn) => {
    const [account] = await conn.execute(
      'INSERT INTO Accounts (email, password_hash) VALUES (?, ?)',
      [email, passwordHash]
    );
    const accountId = account.insertId;
    const [admin] = await conn.execute(
      'INSERT INTO Administrators (account_id, first_name, last_name) VALUES (?, ?, ?)',
      [accountId, profile.firstName || null, profile.lastName || null]
    );
    return { accountId, adminId: admin.insertId };
  });
}

async function recordLogin(accountId) {
  await db.query('UPDATE Accounts SET last_login = NOW() WHERE account_id = ?', [accountId]);
}

module.exports = {
  hashPassword,
  verifyPassword,
  findAccountByEmail,
  findAccountById,
  createStudentAccount,
  createAdminAccount,
  recordLogin,
};
