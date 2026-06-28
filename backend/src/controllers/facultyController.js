'use strict';

const crudController = require('./crudController');
const asyncHandler = require('../utils/asyncHandler');
const { parseId } = require('../utils/validate');
const service = require('../services/facultyService');

const base = crudController(service, 'Faculty');

module.exports = {
  ...base,
  departments: asyncHandler(async (req, res) => {
    res.json({ data: await service.departments(parseId(req.params.id, 'faculty id')) });
  }),
};
