'use strict';

const baseRepository = require('./baseRepository');
const db = require('../db');

const repo = baseRepository('Departments', 'department_id', ['department_name', 'faculty_id']);

repo.findCourses = (departmentId) =>
  db.query('SELECT * FROM Courses WHERE department_id = ? ORDER BY course_code', [departmentId]);

module.exports = repo;
