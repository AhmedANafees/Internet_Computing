'use strict';

const crudController = require('./crudController');
const asyncHandler = require('../utils/asyncHandler');
const { parseId } = require('../utils/validate');
const service = require('../services/courseService');

const base = crudController(service, 'Course');

module.exports = {
  ...base,
  list: asyncHandler(async (req, res) => {
    res.json({ data: await service.search(req.query) });
  }),
  getById: asyncHandler(async (req, res) => {
    res.json({ data: await service.detail(parseId(req.params.id, 'course id')) });
  }),
};
