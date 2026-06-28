'use strict';

const crudService = require('./crudService');
const repo = require('../repositories/facultyRepository');

const service = crudService(repo, 'Faculty');

service.departments = async (facultyId) => {
  await service.get(facultyId);
  return repo.findDepartments(facultyId);
};

module.exports = service;
