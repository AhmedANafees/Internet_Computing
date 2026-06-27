'use strict';

const crudService = require('./crudService');
const repo = require('../repositories/courseRepository');
const ApiError = require('../utils/ApiError');
const { requireFields } = require('../utils/validate');

const service = crudService(repo, 'Course');

service.search = (filters) => repo.search(filters);

service.detail = async (courseId) => {
  const course = await repo.findDetail(courseId);
  if (!course) {
    throw ApiError.notFound('Course not found');
  }
  return course;
};

service.create = (data) => {
  requireFields(data, ['course_code', 'course_name']);
  return repo.create(data);
};

module.exports = service;
