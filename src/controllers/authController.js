'use strict';

const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { requireFields, requireEmail } = require('../utils/validate');
const authService = require('../services/authService');
const sessionService = require('../services/sessionService');

const login = asyncHandler(async (req, res) => {
  requireFields(req.body, ['email', 'password']);
  requireEmail(req.body.email);
  const account = await authService.findAccountByEmail(req.body.email);
  const valid =
    account && (await authService.verifyPassword(req.body.password, account.password_hash));
  if (!valid) {
    throw ApiError.unauthorized('Invalid email or password', { code: 'INVALID_CREDENTIALS' });
  }
  if (account.account_status && account.account_status !== 'Active') {
    throw ApiError.forbidden('This account is not active', { code: 'ACCOUNT_INACTIVE' });
  }
  const { token, expiresAt } = await sessionService.createSession(account.account_id);
  await authService.recordLogin(account.account_id);
  res.json({
    data: {
      token,
      expiresAt,
      user: {
        accountId: account.account_id,
        email: account.email,
        firstName: account.first_name,
        lastName: account.last_name,
        role: account.role,
        studentId: account.student_id,
        adminId: account.admin_id,
      },
    },
  });
});

const logout = asyncHandler(async (req, res) => {
  await sessionService.revokeSession(req.sessionToken);
  res.json({ data: { success: true } });
});

const me = asyncHandler(async (req, res) => {
  res.json({ data: req.user });
});

module.exports = { login, logout, me };
