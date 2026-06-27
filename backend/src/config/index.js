'use strict';

require('dotenv').config();

function readInt(name, fallback) {
  const raw = process.env[name];
  if (raw === undefined || raw === '') {
    return fallback;
  }
  const value = Number.parseInt(raw, 10);
  if (Number.isNaN(value)) {
    throw new Error(`Environment variable ${name} must be an integer, got "${raw}"`);
  }
  return value;
}

function readString(name, fallback) {
  const raw = process.env[name];
  if (raw === undefined || raw === '') {
    return fallback;
  }
  return raw;
}

const nodeEnv = readString('NODE_ENV', 'development');

const config = {
  env: nodeEnv,
  isProduction: nodeEnv === 'production',
  isTest: nodeEnv === 'test',

  server: {
    port: readInt('PORT', 3000),
    corsOrigin: readString('CORS_ORIGIN', '*'),
  },

  db: {
    host: readString('DB_HOST', 'localhost'),
    port: readInt('DB_PORT', 3306),
    user: readString('DB_USER', 'root'),
    password: readString('DB_PASSWORD', ''),
    database: readString('DB_NAME', 'course_registration'),
    connectionLimit: readInt('DB_CONNECTION_LIMIT', 10),
  },

  auth: {
    sessionTokenBytes: readInt('SESSION_TOKEN_BYTES', 48),
    sessionInactivityMinutes: readInt('SESSION_INACTIVITY_MINUTES', 30),
    bcryptSaltRounds: readInt('BCRYPT_SALT_ROUNDS', 10),
  },
};

module.exports = config;
