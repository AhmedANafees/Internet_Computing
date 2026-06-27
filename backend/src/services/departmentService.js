'use strict';

const crudService = require('./crudService');
const repo = require('../repositories/departmentRepository');

const service = crudService(repo, 'Department');

service.courses = async (departmentId) => {
  await service.get(departmentId);
  return repo.findCourses(departmentId);
};

module.exports = service;
