'use strict';

const crypto = require('crypto');
const db = require('../db');
const config = require('../config');

function generateToken() {
  return crypto.randomBytes(config.auth.sessionTokenBytes).toString('base64url');
}

function nextExpiry() {
  const expires = new Date(Date.now() + config.auth.sessionInactivityMinutes * 60 * 1000);
  return expires.toISOString().slice(0, 19).replace('T', ' ');
}

async function createSession(accountId) {
  const token = generateToken();
  const expiresAt = nextExpiry();
  await db.query(
    `INSERT INTO UserSessions (account_id, session_token, expires_at, active)
     VALUES (?, ?, ?, TRUE)`,
    [accountId, token, expiresAt]
  );
  return { token, expiresAt };
}

async function validateSession(token) {
  if (!token) {
    return null;
  }
  return db.queryOne(
    `SELECT s.session_id, s.account_id, a.email, a.account_status,
            st.student_id, ad.admin_id,
            COALESCE(st.first_name, ad.first_name) AS first_name,
            COALESCE(st.last_name, ad.last_name) AS last_name,
            CASE
              WHEN ad.admin_id IS NOT NULL THEN 'admin'
              WHEN st.student_id IS NOT NULL THEN 'student'
              ELSE 'unknown'
            END AS role
       FROM UserSessions s
       JOIN Accounts a ON a.account_id = s.account_id
       LEFT JOIN Students st ON st.account_id = a.account_id
       LEFT JOIN Administrators ad ON ad.account_id = a.account_id
      WHERE s.session_token = ?
        AND s.active = TRUE
        AND s.expires_at > NOW()`,
    [token]
  );
}

async function touchSession(sessionId) {
  await db.query('UPDATE UserSessions SET expires_at = ? WHERE session_id = ?', [
    nextExpiry(),
    sessionId,
  ]);
}

async function revokeSession(token) {
  await db.query('UPDATE UserSessions SET active = FALSE WHERE session_token = ?', [token]);
}

async function revokeAllForAccount(accountId) {
  await db.query('UPDATE UserSessions SET active = FALSE WHERE account_id = ?', [accountId]);
}

async function purgeExpired() {
  const result = await db.query(
    'UPDATE UserSessions SET active = FALSE WHERE active = TRUE AND expires_at <= NOW()'
  );
  return result.affectedRows || 0;
}

module.exports = {
  generateToken,
  createSession,
  validateSession,
  touchSession,
  revokeSession,
  revokeAllForAccount,
  purgeExpired,
};
