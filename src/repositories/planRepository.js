'use strict';

const baseRepository = require('./baseRepository');
const db = require('../db');

const repo = baseRepository('CoursePlans', 'plan_id', ['student_id', 'plan_name', 'active']);

repo.findByStudent = (studentId) =>
  db.query('SELECT * FROM CoursePlans WHERE student_id = ? ORDER BY created_at DESC', [studentId]);

repo.findItems = (planId) =>
  db.query(
    `SELECT cpi.plan_item_id, cpi.date_added,
            cs.crn, cs.section_number, cs.delivery_mode,
            c.course_id, c.course_code, c.course_name, c.credits,
            d.department_name, f.faculty_name
       FROM CoursePlanItems cpi
       JOIN CourseSections cs ON cs.crn = cpi.crn
       JOIN Courses c ON c.course_id = cs.course_id
       LEFT JOIN Departments d ON d.department_id = c.department_id
       LEFT JOIN Faculties f ON f.faculty_id = d.faculty_id
      WHERE cpi.plan_id = ?
      ORDER BY cpi.date_added`,
    [planId]
  );

repo.addItem = async (planId, crn) => {
  const result = await db.query('INSERT INTO CoursePlanItems (plan_id, crn) VALUES (?, ?)', [
    planId,
    crn,
  ]);
  return result.insertId;
};

repo.removeItem = async (planId, crn) => {
  const result = await db.query('DELETE FROM CoursePlanItems WHERE plan_id = ? AND crn = ?', [
    planId,
    crn,
  ]);
  return result.affectedRows > 0;
};

module.exports = repo;
