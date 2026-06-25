'use strict';

const crudService = require('./crudService');
const repo = require('../repositories/enrollmentRepository');
const registrationService = require('./registrationService');
const ApiError = require('../utils/ApiError');

const service = crudService(repo, 'Enrollment');

service.list = (options) => repo.findAllDetailed(options);

service.get = async (id) => {
  const enrollment = await repo.findByIdDetailed(id);
  if (!enrollment) {
    throw ApiError.notFound('Enrollment not found');
  }
  return enrollment;
};

// raw row (student_id, crn) used for ownership checks before drop/swap
service.findRaw = (id) => repo.findById(id);

service.register = (studentId, crn) => registrationService.registerSection(studentId, crn);
service.drop = (studentId, crn) => registrationService.dropSection(studentId, crn);
service.swap = (studentId, fromCrn, toCrn) =>
  registrationService.swapSection(studentId, fromCrn, toCrn);

module.exports = service;
