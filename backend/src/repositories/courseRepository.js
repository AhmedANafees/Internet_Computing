'use strict';

const baseRepository = require('./baseRepository');
const db = require('../db');

const repo = baseRepository('Courses', 'course_id', [
  'course_code',
  'course_name',
  'course_description',
  'course_level',
  'credits',
  'department_id',
]);

// catalog search and filtering (US-02, US-03, US-20)
repo.search = (filters = {}) => {
  const { q, level, departmentId, facultyId } = filters;
  const where = [];
  const params = [];
  if (q) {
    where.push('(c.course_code LIKE ? OR c.course_name LIKE ?)');
    params.push(`%${q}%`, `%${q}%`);
  }
  if (level) {
    where.push('c.course_level = ?');
    params.push(Number(level));
  }
  if (departmentId) {
    where.push('c.department_id = ?');
    params.push(Number(departmentId));
  }
  if (facultyId) {
    where.push('d.faculty_id = ?');
    params.push(Number(facultyId));
  }
  const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
  const lim = Number.parseInt(filters.limit, 10) || 100;
  const off = Number.parseInt(filters.offset, 10) || 0;
  return db.query(
    `SELECT c.*, d.department_name, d.faculty_id, f.faculty_name
       FROM Courses c
       LEFT JOIN Departments d ON d.department_id = c.department_id
       LEFT JOIN Faculties f ON f.faculty_id = d.faculty_id
       ${whereClause}
       ORDER BY c.course_code
       LIMIT ${lim} OFFSET ${off}`,
    params
  );
};

// full course detail with prerequisites and antirequisites (US-04, US-15)
repo.findDetail = async (courseId) => {
  const course = await db.queryOne(
    `SELECT c.*, d.department_name, d.faculty_id, f.faculty_name
       FROM Courses c
       LEFT JOIN Departments d ON d.department_id = c.department_id
       LEFT JOIN Faculties f ON f.faculty_id = d.faculty_id
      WHERE c.course_id = ?`,
    [courseId]
  );
  if (!course) {
    return null;
  }
  course.prerequisites = await db.query(
    `SELECT c.course_id, c.course_code, c.course_name
       FROM Prerequisites p
       JOIN Courses c ON c.course_id = p.required_course_id
      WHERE p.course_id = ?`,
    [courseId]
  );
  course.antirequisites = await db.query(
    `SELECT c.course_id, c.course_code, c.course_name
       FROM Antirequisites a
       JOIN Courses c ON c.course_id = a.antirequisite_course_id
      WHERE a.course_id = ?
      UNION
     SELECT c.course_id, c.course_code, c.course_name
       FROM Antirequisites a
       JOIN Courses c ON c.course_id = a.course_id
      WHERE a.antirequisite_course_id = ?`,
    [courseId, courseId]
  );
  course.corequisites = await db.query(
    `SELECT c.course_id, c.course_code, c.course_name
       FROM Corequisites co
       JOIN Courses c ON c.course_id = co.corequisite_course_id
      WHERE co.course_id = ?
      UNION
     SELECT c.course_id, c.course_code, c.course_name
       FROM Corequisites co
       JOIN Courses c ON c.course_id = co.course_id
      WHERE co.corequisite_course_id = ?`,
    [courseId, courseId]
  );
  return course;
};

module.exports = repo;
