'use strict';

const repos = require('../repositories/requisiteRepository');
const courseRepo = require('../repositories/courseRepository');
const ApiError = require('../utils/ApiError');

async function ensureCourse(id, label = 'Course') {
  const course = await courseRepo.findById(id);
  if (!course) {
    throw ApiError.notFound(`${label} not found`);
  }
}

function requisiteService(kind, label) {
  const repo = repos[kind];
  return {
    list: async (courseId) => {
      await ensureCourse(courseId);
      return repo.list(courseId);
    },

    add: async (courseId, targetId) => {
      await ensureCourse(courseId);
      await ensureCourse(targetId, 'Target course');
      if (courseId === targetId) {
        throw ApiError.badRequest(`A course cannot be its own ${label}`);
      }
      try {
        await repo.add(courseId, targetId);
      } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          throw ApiError.conflict(`That ${label} is already set`);
        }
        throw err;
      }
      return repo.list(courseId);
    },

    remove: async (courseId, targetId) => {
      const removed = await repo.remove(courseId, targetId);
      if (!removed) {
        throw ApiError.notFound(`${label} not found`);
      }
      return repo.list(courseId);
    },
  };
}

module.exports = {
  prerequisite: requisiteService('prerequisite', 'prerequisite'),
  corequisite: requisiteService('corequisite', 'corequisite'),
  antirequisite: requisiteService('antirequisite', 'antirequisite'),
};
