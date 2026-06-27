'use strict';

const baseRepository = require('./baseRepository');
const db = require('../db');

const repo = baseRepository('Faculties', 'faculty_id', ['faculty_name']);

repo.findDepartments = (facultyId) =>
  db.query('SELECT * FROM Departments WHERE faculty_id = ? ORDER BY department_name', [facultyId]);

module.exports = repo;
