'use strict';

const baseRepository = require('./baseRepository');
const db = require('../db');

const repo = baseRepository('Waitlists', 'waitlist_id', [
  'student_id',
  'crn',
  'position',
  'date_joined',
]);

repo.findBySection = (crn) =>
  db.query(
    `SELECT w.waitlist_id, w.position, w.date_joined,
            s.student_id, s.first_name, s.last_name
       FROM Waitlists w
       JOIN Students s ON s.student_id = w.student_id
      WHERE w.crn = ?
      ORDER BY w.position`,
    [crn]
  );

repo.findByStudent = (studentId) =>
  db.query(
    `SELECT w.waitlist_id, w.position, w.date_joined,
            cs.crn, cs.section_number, c.course_code, c.course_name
       FROM Waitlists w
       JOIN CourseSections cs ON cs.crn = w.crn
       JOIN Courses c ON c.course_id = cs.course_id
      WHERE w.student_id = ?
      ORDER BY c.course_code`,
    [studentId]
  );

module.exports = repo;
