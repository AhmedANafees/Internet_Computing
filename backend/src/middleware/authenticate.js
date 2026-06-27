'use strict';

const sessionService = require('../services/sessionService');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

function extractToken(req) {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    return header.slice('Bearer '.length).trim();
  }
  if (req.cookies && req.cookies.session_token) {
    return req.cookies.session_token;
  }
  return null;
}

const authenticate = asyncHandler(async (req, res, next) => {
  const token = extractToken(req);
  const session = await sessionService.validateSession(token);

  if (!session) {
    throw ApiError.unauthorized('A valid session is required to access this resource', {
      code: 'NOT_AUTHENTICATED',
    });
  }

  if (session.account_status && session.account_status !== 'Active') {
    throw ApiError.forbidden('This account is not active', { code: 'ACCOUNT_INACTIVE' });
  }

  req.user = {
    accountId: session.account_id,
    role: session.role,
    email: session.email,
    firstName: session.first_name,
    lastName: session.last_name,
    studentId: session.student_id,
    adminId: session.admin_id,
  };
  req.sessionToken = token;

  sessionService.touchSession(session.session_id).catch(() => {});

  next();
});

module.exports = authenticate;
