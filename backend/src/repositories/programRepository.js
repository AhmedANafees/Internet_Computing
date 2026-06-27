'use strict';

const baseRepository = require('./baseRepository');
const db = require('../db');

const repo = baseRepository('Programs', 'program_id', [
  'program_name',
  'degree_type',
  'department_id',
]);

repo.findRequiredCourses = (programId) =>
  db.query(
    `SELECT DISTINCT c.*
       FROM RequirementCourses rc
       JOIN DegreeRequirements dr ON dr.requirement_id = rc.requirement_id
       JOIN Courses c ON c.course_id = rc.course_id
      WHERE dr.program_id = ?
      ORDER BY c.course_code`,
    [programId]
  );

module.exports = repo;
