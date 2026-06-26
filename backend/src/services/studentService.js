'use strict';

const crudService = require('./crudService');
const repo = require('../repositories/studentRepository');
const waitlistRepo = require('../repositories/waitlistRepository');
const registrationService = require('./registrationService');
const ApiError = require('../utils/ApiError');

const service = crudService(repo, 'Student');

service.profile = async (studentId) => {
  const profile = await repo.findProfile(studentId);
  if (!profile) {
    throw ApiError.notFound('Student not found');
  }
  return profile;
};

service.schedule = async (studentId) => {
  await service.profile(studentId);
  return repo.findSchedule(studentId);
};

service.enrollments = async (studentId) => {
  await service.profile(studentId);
  return repo.findEnrollments(studentId);
};

service.waitlist = async (studentId) => {
  await service.profile(studentId);
  return waitlistRepo.findByStudent(studentId);
};

// whether a section conflicts with the student's current registrations (US-06/18)
service.conflicts = async (studentId, crn) => {
  await service.profile(studentId);
  return registrationService.conflictsWithRegistered(studentId, crn);
};

service.degreeProgress = async (studentId) => {
  await service.profile(studentId);
  const rows = await repo.findRequirementProgress(studentId);
  const byRequirement = new Map();
  for (const row of rows) {
    if (!byRequirement.has(row.requirement_id)) {
      byRequirement.set(row.requirement_id, {
        requirementId: row.requirement_id,
        name: row.requirement_name,
        category: row.requirement_category,
        requiredCredits: Number(row.required_credits),
        completedCredits: 0,
        courses: [],
      });
    }
    const requirement = byRequirement.get(row.requirement_id);
    const completed = Boolean(row.completed);
    requirement.courses.push({
      courseId: row.course_id,
      courseCode: row.course_code,
      courseName: row.course_name,
      credits: row.credits,
      completed,
    });
    if (completed) {
      requirement.completedCredits += Number(row.credits);
    }
  }
  return Array.from(byRequirement.values());
};

module.exports = service;
