'use strict';

const crudService = require('./crudService');
const repo = require('../repositories/instructorRepository');

const service = crudService(repo, 'Instructor');

service.sections = async (instructorId) => {
  await service.get(instructorId);
  return repo.findSections(instructorId);
};

module.exports = service;
