'use strict';

const crudController = require('./crudController');
const asyncHandler = require('../utils/asyncHandler');
const { parseId } = require('../utils/validate');
const service = require('../services/scheduleService');

const base = crudController(service, 'Schedule entry');

module.exports = {
  ...base,
  byCrn: asyncHandler(async (req, res) => {
    res.json({ data: await service.byCrn(parseId(req.params.crn, 'crn')) });
  }),
};
