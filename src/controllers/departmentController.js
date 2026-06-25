'use strict';

const crudController = require('./crudController');
const asyncHandler = require('../utils/asyncHandler');
const { parseId } = require('../utils/validate');
const service = require('../services/departmentService');

const base = crudController(service, 'Department');

module.exports = {
  ...base,
  courses: asyncHandler(async (req, res) => {
    res.json({ data: await service.courses(parseId(req.params.id, 'department id')) });
  }),
};
