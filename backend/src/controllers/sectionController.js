'use strict';

const crudController = require('./crudController');
const asyncHandler = require('../utils/asyncHandler');
const { parseId } = require('../utils/validate');
const service = require('../services/sectionService');

const base = crudController(service, 'Section');

module.exports = {
  ...base,
  list: asyncHandler(async (req, res) => {
    res.json({ data: await service.search(req.query) });
  }),
  getById: asyncHandler(async (req, res) => {
    res.json({ data: await service.detail(parseId(req.params.id, 'section id')) });
  }),
  seats: asyncHandler(async (req, res) => {
    res.json({ data: await service.seats(parseId(req.params.id, 'section id')) });
  }),
  enrolledStudents: asyncHandler(async (req, res) => {
    res.json({ data: await service.enrolledStudents(parseId(req.params.id, 'section id')) });
  }),
};
