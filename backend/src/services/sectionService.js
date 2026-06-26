'use strict';

const crudService = require('./crudService');
const repo = require('../repositories/sectionRepository');
const ApiError = require('../utils/ApiError');
const { requireFields } = require('../utils/validate');

const service = crudService(repo, 'Section');

service.search = (filters) => repo.search(filters);

service.detail = async (sectionId) => {
  const section = await repo.findDetail(sectionId);
  if (!section) {
    throw ApiError.notFound('Section not found');
  }
  return section;
};

service.seats = async (sectionId) => {
  const seats = await repo.findSeats(sectionId);
  if (!seats) {
    throw ApiError.notFound('Section not found');
  }
  return seats;
};

service.enrolledStudents = async (sectionId) => {
  await service.seats(sectionId);
  return repo.findEnrolledStudents(sectionId);
};

service.create = (data) => {
  requireFields(data, ['course_id', 'term_id', 'section_number', 'capacity']);
  return repo.create(data);
};

module.exports = service;
