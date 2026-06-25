'use strict';

const morgan = require('morgan');
const config = require('../config');

function requestLogger() {
  if (config.isTest) {
    return function noop(req, res, next) {
      next();
    };
  }
  return morgan(config.isProduction ? 'combined' : 'dev');
}

module.exports = requestLogger;
