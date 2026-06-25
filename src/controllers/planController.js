'use strict';

const asyncHandler = require('../utils/asyncHandler');
const { parseId, requireFields } = require('../utils/validate');
const { requireStudent } = require('../utils/access');
const service = require('../services/planService');

const list = asyncHandler(async (req, res) => {
  res.json({ data: await service.listForStudent(requireStudent(req)) });
});

const getById = asyncHandler(async (req, res) => {
  res.json({ data: await service.getForStudent(parseId(req.params.id, 'plan id'), requireStudent(req)) });
});

const create = asyncHandler(async (req, res) => {
  res.status(201).json({ data: await service.createForStudent(requireStudent(req), req.body.planName) });
});

const addItem = asyncHandler(async (req, res) => {
  requireFields(req.body, ['crn']);
  const data = await service.addItem(
    parseId(req.params.id, 'plan id'),
    requireStudent(req),
    parseId(req.body.crn, 'crn')
  );
  res.status(201).json({ data });
});

const removeItem = asyncHandler(async (req, res) => {
  const data = await service.removeItem(
    parseId(req.params.id, 'plan id'),
    requireStudent(req),
    parseId(req.params.crn, 'crn')
  );
  res.json({ data });
});

const submit = asyncHandler(async (req, res) => {
  res.json({ data: await service.submit(parseId(req.params.id, 'plan id'), requireStudent(req)) });
});

module.exports = { list, getById, create, addItem, removeItem, submit };
