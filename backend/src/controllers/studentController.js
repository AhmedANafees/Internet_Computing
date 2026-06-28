'use strict';

const crudController = require('./crudController');
const asyncHandler = require('../utils/asyncHandler');
const { parseId } = require('../utils/validate');
const { ensureSelfOrAdmin } = require('../utils/access');
const service = require('../services/studentService');

const base = crudController(service, 'Student');

const withSelfCheck = (fn) =>
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id, 'student id');
    ensureSelfOrAdmin(req, id);
    res.json({ data: await fn(id) });
  });

const conflicts = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id, 'student id');
  ensureSelfOrAdmin(req, id);
  res.json({ data: await service.conflicts(id, parseId(req.query.crn, 'crn')) });
});

module.exports = {
  ...base,
  getById: withSelfCheck((id) => service.profile(id)),
  schedule: withSelfCheck((id) => service.schedule(id)),
  enrollments: withSelfCheck((id) => service.enrollments(id)),
  waitlist: withSelfCheck((id) => service.waitlist(id)),
  degreeProgress: withSelfCheck((id) => service.degreeProgress(id)),
  conflicts,
};
