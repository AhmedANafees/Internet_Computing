'use strict';

const baseRepository = require('./baseRepository');
const db = require('../db');

const PASSING = "e.final_grade IS NOT NULL AND e.final_grade NOT IN ('F', 'WF', 'DNW')";
const DAY_ORDER =
  'FIELD(sch.day_of_week, "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday")';

const repo = baseRepository('Students', 'student_id', [
  'account_id',
  'first_name',
  'last_name',
  'student_phone',
  'date_of_birth',
  'program_id',
  'GPA',
]);

repo.findProfile = (studentId) =>
  db.queryOne(
    `SELECT s.*, a.email, p.program_name, p.degree_type, d.department_name, f.faculty_name
       FROM Students s
       LEFT JOIN Accounts a ON a.account_id = s.account_id
       LEFT JOIN Programs p ON p.program_id = s.program_id
       LEFT JOIN Departments d ON d.department_id = p.department_id
       LEFT JOIN Faculties f ON f.faculty_id = d.faculty_id
      WHERE s.student_id = ?`,
    [studentId]
  );

// weekly schedule of registered sections, one row per meeting. enrollment_id is
// included so the timetable can drop a course (US-06, US-08, US-16).
repo.findSchedule = (studentId) =>
  db.query(
    `SELECT e.enrollment_id, c.course_code, c.course_name, cs.crn, cs.section_number,
            sch.day_of_week, sch.start_time, sch.end_time, r.building, r.room_number, r.campus
       FROM Enrollments e
       JOIN CourseSections cs ON cs.crn = e.crn
       JOIN Courses c ON c.course_id = cs.course_id
       JOIN ClassSchedule sch ON sch.crn = cs.crn
       LEFT JOIN Rooms r ON r.room_id = cs.room_id
      WHERE e.student_id = ? AND e.status = 'Registered'
      ORDER BY ${DAY_ORDER}, sch.start_time`,
    [studentId]
  );

repo.findEnrollments = (studentId) =>
  db.query(
    `SELECT e.enrollment_id, e.status, e.final_grade, e.enrollment_date,
            cs.crn, cs.section_number,
            c.course_id, c.course_code, c.course_name, c.credits, t.term_name
       FROM Enrollments e
       JOIN CourseSections cs ON cs.crn = e.crn
       JOIN Courses c ON c.course_id = cs.course_id
       LEFT JOIN AcademicTerms t ON t.term_id = cs.term_id
      WHERE e.student_id = ?
      ORDER BY t.year DESC, c.course_code`,
    [studentId]
  );

repo.findRequirementProgress = (studentId) =>
  db.query(
    `SELECT dr.requirement_id, dr.requirement_name, dr.requirement_category, dr.required_credits,
            c.course_id, c.course_code, c.course_name, c.credits,
            EXISTS (
              SELECT 1 FROM Enrollments e
                JOIN CourseSections cs ON cs.crn = e.crn
               WHERE e.student_id = ? AND cs.course_id = c.course_id AND ${PASSING}
            ) AS completed
       FROM Students s
       JOIN DegreeRequirements dr ON dr.program_id = s.program_id
       JOIN RequirementCourses rc ON rc.requirement_id = dr.requirement_id
       JOIN Courses c ON c.course_id = rc.course_id
      WHERE s.student_id = ?
      ORDER BY dr.requirement_id, c.course_code`,
    [studentId, studentId]
  );

module.exports = repo;
