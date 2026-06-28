'use strict';

const baseRepository = require('./baseRepository');
const db = require('../db');

const repo = baseRepository('Instructors', 'instructor_id', [
  'first_name',
  'last_name',
  'email',
  'department_id',
]);

repo.findSections = (instructorId) =>
  db.query(
    `SELECT cs.crn, cs.section_number, cs.status,
            c.course_code, c.course_name, t.term_name
       FROM CourseSections cs
       JOIN Courses c ON c.course_id = cs.course_id
       LEFT JOIN AcademicTerms t ON t.term_id = cs.term_id
      WHERE cs.instructor_id = ?
      ORDER BY t.year DESC, c.course_code`,
    [instructorId]
  );

module.exports = repo;
