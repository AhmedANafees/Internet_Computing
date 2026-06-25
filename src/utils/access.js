'use strict';

const ApiError = require('./ApiError');

function ensureSelfOrAdmin(req, studentId) {
  if (req.user.role !== 'admin' && req.user.studentId !== studentId) {
    throw ApiError.forbidden('You can only access your own records');
  }
}

function requireStudent(req) {
  if (!req.user.studentId) {
    throw ApiError.forbidden('This action is only available to student accounts');
  }
  return req.user.studentId;
}

module.exports = { ensureSelfOrAdmin, requireStudent };
