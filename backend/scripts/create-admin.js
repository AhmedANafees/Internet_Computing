'use strict';

// usage: npm run admin:create -- <email> <password> [firstName] [lastName]

const db = require('../src/db');
const authService = require('../src/services/authService');
const { isEmail } = require('../src/utils/validate');
const logger = require('../src/utils/logger');

async function main() {
  const [email, password, firstName, lastName] = process.argv.slice(2);

  if (!email || !password) {
    logger.error('Usage: npm run admin:create -- <email> <password> [firstName] [lastName]');
    process.exitCode = 1;
    return;
  }
  if (!isEmail(email)) {
    logger.error('The first argument must be a valid email address.');
    process.exitCode = 1;
    return;
  }

  const existing = await authService.findAccountByEmail(email);
  if (existing) {
    logger.error(`An account with email "${email}" already exists.`);
    process.exitCode = 1;
    return;
  }

  const { accountId, adminId } = await authService.createAdminAccount({
    email,
    password,
    profile: { firstName, lastName },
  });

  logger.info(`Created admin "${email}" (account_id ${accountId}, admin_id ${adminId}).`);
}

main()
  .catch((err) => {
    logger.error('Failed to create admin:', err.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.close();
  });
