'use strict';

const baseRepository = require('./baseRepository');
const db = require('../db');

const DETAIL = `
  SELECT e.enrollment_id, e.student_id, e.crn, e.enrollment_date, e.final_grade, e.status,
         s.first_name, s.last_name,
         cs.section_number, c.course_id, c.course_code, c.course_name
    FROM Enrollments e
    JOIN Students s ON s.student_id = e.student_id
    JOIN CourseSections cs ON cs.crn = e.crn
    JOIN Courses c ON c.course_id = cs.course_id`;

const repo = baseRepository('Enrollments', 'enrollment_id', [
  'student_id',
  'crn',
  'enrollment_date',
  'final_grade',
  'status',
]);

repo.findAllDetailed = ({ limit = 100, offset = 0 } = {}) => {
  const lim = Number.parseInt(limit, 10) || 100;
  const off = Number.parseInt(offset, 10) || 0;
  return db.query(`${DETAIL} ORDER BY e.enrollment_id LIMIT ${lim} OFFSET ${off}`);
};

repo.findByIdDetailed = (id) => db.queryOne(`${DETAIL} WHERE e.enrollment_id = ?`, [id]);

module.exports = repo;
