'use strict';

const ApiError = require('../utils/ApiError');

function authorize(...allowedRoles) {
  return function authorizeMiddleware(req, res, next) {
    if (!req.user) {
      return next(
        ApiError.unauthorized('A valid session is required to access this resource', {
          code: 'NOT_AUTHENTICATED',
        })
      );
    }
    if (allowedRoles.length > 0 && !allowedRoles.includes(req.user.role)) {
      return next(
        ApiError.forbidden('You do not have permission to perform this action', {
          code: 'FORBIDDEN_ROLE',
        })
      );
    }
    return next();
  };
}

module.exports = authorize;
