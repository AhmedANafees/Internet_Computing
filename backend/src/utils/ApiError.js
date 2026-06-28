'use strict';

class ApiError extends Error {
  constructor(statusCode, message, options = {}) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = options.code || null;
    this.details = options.details || null;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message, options) {
    return new ApiError(400, message, options);
  }

  static unauthorized(message = 'Authentication required', options) {
    return new ApiError(401, message, options);
  }

  static forbidden(message = 'You do not have access to this resource', options) {
    return new ApiError(403, message, options);
  }

  static notFound(message = 'Resource not found', options) {
    return new ApiError(404, message, options);
  }

  static conflict(message, options) {
    return new ApiError(409, message, options);
  }

  static internal(message = 'Something went wrong', options) {
    return new ApiError(500, message, options);
  }
}

module.exports = ApiError;
