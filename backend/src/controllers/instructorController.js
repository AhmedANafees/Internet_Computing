'use strict';

const crudController = require('./crudController');
const asyncHandler = require('../utils/asyncHandler');
const { parseId } = require('../utils/validate');
const service = require('../services/instructorService');

const base = crudController(service, 'Instructor');

module.exports = {
  ...base,
  sections: asyncHandler(async (req, res) => {
    res.json({ data: await service.sections(parseId(req.params.id, 'instructor id')) });
  }),
};
