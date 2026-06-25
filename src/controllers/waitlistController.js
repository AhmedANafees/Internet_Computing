'use strict';

const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { parseId, parsePagination, requireFields } = require('../utils/validate');
const { ensureSelfOrAdmin } = require('../utils/access');
const service = require('../services/waitlistService');

const list = asyncHandler(async (req, res) => {
  res.json({ data: await service.list(parsePagination(req.query)) });
});

const getById = asyncHandler(async (req, res) => {
  res.json({ data: await service.get(parseId(req.params.id, 'waitlist id')) });
});

const bySection = asyncHandler(async (req, res) => {
  res.json({ data: await service.bySection(parseId(req.params.crn, 'crn')) });
});

const byStudent = asyncHandler(async (req, res) => {
  const id = parseId(req.params.studentId, 'student id');
  ensureSelfOrAdmin(req, id);
  res.json({ data: await service.byStudent(id) });
});

const addToWaitlist = asyncHandler(async (req, res) => {
  requireFields(req.body, ['crn']);
  const studentId =
    req.user.role === 'admin' && req.body.studentId
      ? parseId(req.body.studentId, 'studentId')
      : req.user.studentId;
  if (!studentId) {
    throw ApiError.forbidden('This action is only available to student accounts');
  }
  res.status(201).json({ data: await service.add(studentId, parseId(req.body.crn, 'crn')) });
});

const remove = asyncHandler(async (req, res) => {
  const entry = await service.get(parseId(req.params.id, 'waitlist id'));
  ensureSelfOrAdmin(req, entry.student_id);
  res.json({ data: await service.remove(entry.waitlist_id) });
});

module.exports = { list, getById, bySection, byStudent, addToWaitlist, remove };
