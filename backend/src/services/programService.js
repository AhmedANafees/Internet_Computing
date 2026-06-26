'use strict';

const crudService = require('./crudService');
const repo = require('../repositories/programRepository');

const service = crudService(repo, 'Program');

service.requiredCourses = async (programId) => {
  await service.get(programId);
  return repo.findRequiredCourses(programId);
};

module.exports = service;
