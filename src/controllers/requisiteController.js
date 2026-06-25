'use strict';

const asyncHandler = require('../utils/asyncHandler');
const { parseId, requireFields } = require('../utils/validate');
const services = require('../services/requisiteService');

function handlers(kind) {
  const service = services[kind];
  return {
    list: asyncHandler(async (req, res) => {
      res.json({ data: await service.list(parseId(req.params.id, 'course id')) });
    }),
    add: asyncHandler(async (req, res) => {
      requireFields(req.body, ['targetCourseId']);
      const data = await service.add(
        parseId(req.params.id, 'course id'),
        parseId(req.body.targetCourseId, 'targetCourseId')
      );
      res.status(201).json({ data });
    }),
    remove: asyncHandler(async (req, res) => {
      const data = await service.remove(
        parseId(req.params.id, 'course id'),
        parseId(req.params.targetId, 'target course id')
      );
      res.json({ data });
    }),
  };
}

module.exports = {
  prerequisite: handlers('prerequisite'),
  corequisite: handlers('corequisite'),
  antirequisite: handlers('antirequisite'),
};
