'use strict';

const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { parseId, parsePagination, requireFields } = require('../utils/validate');
const { ensureSelfOrAdmin } = require('../utils/access');
const service = require('../services/enrollmentService');

// students act on themselves; admins may target a specific student via body.studentId
function targetStudentId(req) {
  if (req.user.role === 'admin' && req.body.studentId) {
    return parseId(req.body.studentId, 'studentId');
  }
  return req.user.studentId;
}

const list = asyncHandler(async (req, res) => {
  res.json({ data: await service.list(parsePagination(req.query)) });
});

const getById = asyncHandler(async (req, res) => {
  const enrollment = await service.get(parseId(req.params.id, 'enrollment id'));
  ensureSelfOrAdmin(req, enrollment.student_id);
  res.json({ data: enrollment });
});

const register = asyncHandler(async (req, res) => {
  requireFields(req.body, ['crn']);
  const studentId = targetStudentId(req);
  if (!studentId) {
    throw ApiError.forbidden('This action is only available to student accounts');
  }
  const result = await service.register(studentId, parseId(req.body.crn, 'crn'));
  res.status(result.result === 'failed' ? 409 : 201).json({ data: result });
});

const registerBatch = asyncHandler(async (req, res) => {
  requireFields(req.body, ['crns']);
  if (!Array.isArray(req.body.crns) || req.body.crns.length === 0) {
    throw ApiError.badRequest('crns must be a non-empty array');
  }
  const studentId = targetStudentId(req);
  if (!studentId) {
    throw ApiError.forbidden('This action is only available to student accounts');
  }
  const crns = req.body.crns.map((value) => parseId(value, 'crn'));
  const results = await service.registerBatch(studentId, crns);
  res.status(200).json({ data: results });
});

const drop = asyncHandler(async (req, res) => {
  const enrollment = await service.findRaw(parseId(req.params.id, 'enrollment id'));
  if (!enrollment) {
    throw ApiError.notFound('Enrollment not found');
  }
  ensureSelfOrAdmin(req, enrollment.student_id);
  res.json({ data: await service.drop(enrollment.student_id, enrollment.crn) });
});

const swap = asyncHandler(async (req, res) => {
  requireFields(req.body, ['toCrn']);
  const enrollment = await service.findRaw(parseId(req.params.id, 'enrollment id'));
  if (!enrollment) {
    throw ApiError.notFound('Enrollment not found');
  }
  ensureSelfOrAdmin(req, enrollment.student_id);
  const result = await service.swap(
    enrollment.student_id,
    enrollment.crn,
    parseId(req.body.toCrn, 'toCrn')
  );
  res.status(result.result === 'failed' ? 409 : 200).json({ data: result });
});

const update = asyncHandler(async (req, res) => {
  res.json({ data: await service.update(parseId(req.params.id, 'enrollment id'), req.body) });
});

module.exports = { list, getById, register, registerBatch, drop, update, swap };
