'use strict';

const baseRepository = require('./baseRepository');
const db = require('../db');

const SECTION_COLUMNS = `
  cs.crn, cs.course_id, cs.instructor_id, cs.term_id, cs.section_number,
  cs.capacity, cs.enrolled_count, cs.room_id, cs.delivery_mode, cs.status, cs.parent_crn,
  (cs.capacity - cs.enrolled_count) AS seats_remaining,
  c.course_code, c.course_name, c.credits, c.course_level,
  d.department_name AS subject,
  i.first_name AS instructor_first_name, i.last_name AS instructor_last_name,
  r.building, r.room_number, r.campus,
  t.term_name,
  (SELECT GROUP_CONCAT(
            CONCAT(sch.day_of_week, ' ',
                   TIME_FORMAT(sch.start_time, '%H:%i'), '-', TIME_FORMAT(sch.end_time, '%H:%i'))
            ORDER BY sch.start_time SEPARATOR ', ')
     FROM ClassSchedule sch WHERE sch.crn = cs.crn) AS meeting_times`;

const SECTION_JOINS = `
  FROM CourseSections cs
  LEFT JOIN Courses c ON c.course_id = cs.course_id
  LEFT JOIN Departments d ON d.department_id = c.department_id
  LEFT JOIN Instructors i ON i.instructor_id = cs.instructor_id
  LEFT JOIN Rooms r ON r.room_id = cs.room_id
  LEFT JOIN AcademicTerms t ON t.term_id = cs.term_id`;

const repo = baseRepository('CourseSections', 'crn', [
  'course_id',
  'instructor_id',
  'term_id',
  'section_number',
  'capacity',
  'enrolled_count',
  'room_id',
  'delivery_mode',
  'status',
  'parent_crn',
]);

// section listing for the registration table, with filters (US-02/03/19/20)
repo.search = (filters = {}) => {
  const where = [];
  const params = [];
  if (filters.q) {
    where.push('(c.course_code LIKE ? OR c.course_name LIKE ?)');
    params.push(`%${filters.q}%`, `%${filters.q}%`);
  }
  if (filters.courseId) {
    where.push('cs.course_id = ?');
    params.push(Number(filters.courseId));
  }
  if (filters.termId) {
    where.push('cs.term_id = ?');
    params.push(Number(filters.termId));
  }
  if (filters.level) {
    where.push('c.course_level = ?');
    params.push(Number(filters.level));
  }
  if (filters.departmentId) {
    where.push('c.department_id = ?');
    params.push(Number(filters.departmentId));
  }
  if (filters.facultyId) {
    where.push('d.faculty_id = ?');
    params.push(Number(filters.facultyId));
  }
  if (filters.parentCrn) {
    where.push('cs.parent_crn = ?');
    params.push(Number(filters.parentCrn));
  }
  if (filters.availableOnly === 'true' || filters.availableOnly === true) {
    where.push('(cs.capacity IS NULL OR cs.enrolled_count < cs.capacity)');
  }
  // meeting time band: morning before noon, afternoon to 5pm, evening after (US-03)
  const bands = {
    morning: "sch.start_time < '12:00:00'",
    afternoon: "sch.start_time >= '12:00:00' AND sch.start_time < '17:00:00'",
    evening: "sch.start_time >= '17:00:00'",
  };
  const band = filters.timeBand && bands[String(filters.timeBand).toLowerCase()];
  if (band) {
    where.push(`EXISTS (SELECT 1 FROM ClassSchedule sch WHERE sch.crn = cs.crn AND ${band})`);
  }
  const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
  const lim = Number.parseInt(filters.limit, 10) || 100;
  const off = Number.parseInt(filters.offset, 10) || 0;
  return db.query(
    `SELECT ${SECTION_COLUMNS} ${SECTION_JOINS} ${whereClause}
      ORDER BY c.course_code, cs.section_number
      LIMIT ${lim} OFFSET ${off}`,
    params
  );
};

repo.findDetail = async (crn) => {
  const section = await db.queryOne(
    `SELECT ${SECTION_COLUMNS} ${SECTION_JOINS} WHERE cs.crn = ?`,
    [crn]
  );
  if (!section) {
    return null;
  }
  section.schedule = await db.query(
    'SELECT schedule_id, day_of_week, start_time, end_time FROM ClassSchedule WHERE crn = ?',
    [crn]
  );
  // linked labs or tutorials for the "Select Lab" picker
  section.labs = await db.query(
    `SELECT ${SECTION_COLUMNS} ${SECTION_JOINS} WHERE cs.parent_crn = ?`,
    [crn]
  );
  return section;
};

repo.findSeats = (crn) =>
  db.queryOne(
    `SELECT capacity, enrolled_count, (capacity - enrolled_count) AS seats_remaining
       FROM CourseSections WHERE crn = ?`,
    [crn]
  );

repo.findEnrolledStudents = (crn) =>
  db.query(
    `SELECT s.student_id, s.first_name, s.last_name, a.email, e.status, e.enrollment_date
       FROM Enrollments e
       JOIN Students s ON s.student_id = e.student_id
       LEFT JOIN Accounts a ON a.account_id = s.account_id
      WHERE e.crn = ? AND e.status = 'Registered'
      ORDER BY s.last_name, s.first_name`,
    [crn]
  );

module.exports = repo;
