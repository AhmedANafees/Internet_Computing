'use strict';

const crudController = require('./crudController');
const asyncHandler = require('../utils/asyncHandler');
const { parseId } = require('../utils/validate');
const service = require('../services/programService');

const base = crudController(service, 'Program');

module.exports = {
  ...base,
  requiredCourses: asyncHandler(async (req, res) => {
    res.json({ data: await service.requiredCourses(parseId(req.params.id, 'program id')) });
  }),
};
