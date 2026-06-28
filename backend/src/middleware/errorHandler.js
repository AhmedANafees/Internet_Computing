'use strict';

const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');
const config = require('../config');

function mapDatabaseError(err) {
  switch (err.code) {
    case 'ER_DUP_ENTRY':
      return ApiError.conflict('A record with these values already exists', {
        code: 'DUPLICATE_ENTRY',
      });
    case 'ER_NO_REFERENCED_ROW':
    case 'ER_NO_REFERENCED_ROW_2':
      return ApiError.badRequest('A referenced record does not exist', {
        code: 'INVALID_REFERENCE',
      });
    case 'ER_ROW_IS_REFERENCED':
    case 'ER_ROW_IS_REFERENCED_2':
      return ApiError.conflict('This record is still referenced by other records', {
        code: 'REFERENCE_IN_USE',
      });
    default:
      return null;
  }
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  let error = err;

  if (!(error instanceof ApiError) && error && typeof error.code === 'string') {
    const mapped = mapDatabaseError(error);
    if (mapped) {
      error = mapped;
    }
  }

  if (!(error instanceof ApiError)) {
    logger.error('Unhandled error:', error);
    error = ApiError.internal();
  } else if (error.statusCode >= 500) {
    logger.error('Server error:', err);
  }

  const body = {
    error: {
      message: error.message,
      code: error.code || undefined,
      details: error.details || undefined,
    },
  };

  if (!config.isProduction && err instanceof Error) {
    body.error.stack = err.stack;
  }

  res.status(error.statusCode).json(body);
}

module.exports = errorHandler;
