'use strict';

const asyncHandler = require('../utils/asyncHandler');
const { parseId, parsePagination } = require('../utils/validate');

function crudController(service, label) {
  return {
    list: asyncHandler(async (req, res) => {
      const data = await service.list(parsePagination(req.query));
      res.json({ data });
    }),

    getById: asyncHandler(async (req, res) => {
      const data = await service.get(parseId(req.params.id, `${label} id`));
      res.json({ data });
    }),

    create: asyncHandler(async (req, res) => {
      const data = await service.create(req.body);
      res.status(201).json({ data });
    }),

    update: asyncHandler(async (req, res) => {
      const data = await service.update(parseId(req.params.id, `${label} id`), req.body);
      res.json({ data });
    }),

    remove: asyncHandler(async (req, res) => {
      const data = await service.remove(parseId(req.params.id, `${label} id`));
      res.json({ data });
    }),
  };
}

module.exports = crudController;
