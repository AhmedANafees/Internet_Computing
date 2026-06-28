'use strict';

// seeds sample data (npm run db:seed). students log in with Password123!, admins with Admin123!

const db = require('../src/db');
const authService = require('../src/services/authService');
const logger = require('../src/utils/logger');

const STUDENT_PASSWORD = 'Password123!';
const ADMIN_PASSWORD = 'Admin123!';

const faculties = ['Faculty of Science', 'Faculty of Arts'];

const departments = [
  { name: 'Physics and Computer Science', faculty: 'Faculty of Science' },
  { name: 'Mathematics', faculty: 'Faculty of Science' },
  { name: 'Psychology', faculty: 'Faculty of Arts' },
  { name: 'English', faculty: 'Faculty of Arts' },
];

const programs = [
  { name: 'Computer Science', degree: 'BSc', dept: 'Physics and Computer Science' },
  { name: 'Mathematics', degree: 'BSc', dept: 'Mathematics' },
  { name: 'Psychology', degree: 'BA', dept: 'Psychology' },
  { name: 'English', degree: 'BA', dept: 'English' },
];

const rooms = [
  { key: 'LH1001', building: 'Lazaridis Hall', number: '1001', capacity: 120, campus: 'Waterloo' },
  { key: 'LH2002', building: 'Lazaridis Hall', number: '2002', capacity: 80, campus: 'Waterloo' },
  { key: 'BA201', building: 'Bricker Academic', number: '201', capacity: 60, campus: 'Waterloo' },
  { key: 'BA304', building: 'Bricker Academic', number: '304', capacity: 45, campus: 'Waterloo' },
  { key: 'SN1001', building: 'Science Building', number: 'N1001', capacity: 200, campus: 'Waterloo' },
  { key: 'AA102', building: 'Arts Building', number: 'A102', capacity: 90, campus: 'Brantford' },
];

const instructors = [
  { key: 'lovelace', first: 'Ada', last: 'Lovelace', email: 'alovelace@example.edu', dept: 'Physics and Computer Science' },
  { key: 'turing', first: 'Alan', last: 'Turing', email: 'aturing@example.edu', dept: 'Physics and Computer Science' },
  { key: 'hopper', first: 'Grace', last: 'Hopper', email: 'ghopper@example.edu', dept: 'Physics and Computer Science' },
  { key: 'gauss', first: 'Carl', last: 'Gauss', email: 'cgauss@example.edu', dept: 'Mathematics' },
  { key: 'noether', first: 'Emmy', last: 'Noether', email: 'enoether@example.edu', dept: 'Mathematics' },
  { key: 'james', first: 'William', last: 'James', email: 'wjames@example.edu', dept: 'Psychology' },
  { key: 'austen', first: 'Jane', last: 'Austen', email: 'jausten@example.edu', dept: 'English' },
];

const terms = [
  { name: 'Winter 2026', semester: 'Winter', year: 2026, start: '2026-01-06', end: '2026-04-10', regOpen: '2025-10-01', regClose: '2026-01-13' },
  { name: 'Fall 2026', semester: 'Fall', year: 2026, start: '2026-09-08', end: '2026-12-05', regOpen: '2026-06-01', regClose: '2026-09-15' },
  { name: 'Winter 2027', semester: 'Winter', year: 2027, start: '2027-01-05', end: '2027-04-09', regOpen: '2026-11-01', regClose: '2027-01-12' },
];

const courses = [
  { code: 'CP102', name: 'Information Processing', desc: 'Computing concepts for non majors.', level: 100, credits: 1, dept: 'Physics and Computer Science' },
  { code: 'CP104', name: 'Introduction to Programming', desc: 'Fundamentals of programming.', level: 100, credits: 1, dept: 'Physics and Computer Science' },
  { code: 'CP164', name: 'Data Structures I', desc: 'Introduction to data structures.', level: 100, credits: 1, dept: 'Physics and Computer Science' },
  { code: 'CP213', name: 'Introduction to Object Oriented Programming', desc: 'Object oriented programming with Java.', level: 200, credits: 1, dept: 'Physics and Computer Science' },
  { code: 'CP264', name: 'Data Structures II', desc: 'Data structures and the C language.', level: 200, credits: 1, dept: 'Physics and Computer Science' },
  { code: 'CP312', name: 'Algorithm Design and Analysis I', desc: 'Algorithm design techniques.', level: 300, credits: 1, dept: 'Physics and Computer Science' },
  { code: 'CP317', name: 'Software Engineering', desc: 'Principles of software engineering.', level: 300, credits: 1, dept: 'Physics and Computer Science' },
  { code: 'CP411', name: 'Computer Graphics', desc: 'Interactive computer graphics.', level: 400, credits: 1, dept: 'Physics and Computer Science' },
  { code: 'MA103', name: 'Calculus I', desc: 'Differential calculus.', level: 100, credits: 1, dept: 'Mathematics' },
  { code: 'MA122', name: 'Introductory Linear Algebra', desc: 'Vectors and matrices.', level: 100, credits: 1, dept: 'Mathematics' },
  { code: 'MA238', name: 'Discrete Mathematics', desc: 'Discrete structures and proofs.', level: 200, credits: 1, dept: 'Mathematics' },
  { code: 'PS101', name: 'Introduction to Psychology', desc: 'Foundations of psychology.', level: 100, credits: 1, dept: 'Psychology' },
  { code: 'PS261', name: 'Research Methods', desc: 'Research methods in psychology.', level: 200, credits: 1, dept: 'Psychology' },
  { code: 'EN101', name: 'Literature and Composition', desc: 'Introduction to literature.', level: 100, credits: 1, dept: 'English' },
];

const prerequisites = [
  ['CP164', 'CP104'],
  ['CP264', 'CP164'],
  ['CP213', 'CP104'],
  ['CP312', 'CP264'],
  ['CP312', 'MA238'],
  ['CP317', 'CP213'],
  ['CP411', 'CP312'],
  ['MA238', 'MA103'],
  ['PS261', 'PS101'],
];

const antirequisites = [['CP104', 'CP102']];

const corequisites = [['MA238', 'MA122']];

const sections = [
  { key: 'CP104-A-F', code: 'CP104', sec: 'A', instr: 'hopper', term: 'Fall 2026', room: 'LH1001', cap: 120, status: 'Open', schedule: [['Monday', '09:00:00', '10:20:00'], ['Wednesday', '09:00:00', '10:20:00']] },
  { key: 'CP164-A-F', code: 'CP164', sec: 'A', instr: 'lovelace', term: 'Fall 2026', room: 'LH1001', cap: 120, status: 'Open', schedule: [['Monday', '10:30:00', '11:50:00'], ['Wednesday', '10:30:00', '11:50:00']] },
  { key: 'CP164-B-F', code: 'CP164', sec: 'B', instr: 'turing', term: 'Fall 2026', room: 'BA201', cap: 60, status: 'Open', schedule: [['Tuesday', '13:00:00', '14:20:00'], ['Thursday', '13:00:00', '14:20:00']] },
  { key: 'CP213-A-F', code: 'CP213', sec: 'A', instr: 'hopper', term: 'Fall 2026', room: 'LH2002', cap: 80, status: 'Open', schedule: [['Monday', '13:00:00', '14:20:00'], ['Wednesday', '13:00:00', '14:20:00']] },
  { key: 'CP264-A-F', code: 'CP264', sec: 'A', instr: 'turing', term: 'Fall 2026', room: 'BA201', cap: 60, status: 'Open', schedule: [['Tuesday', '10:00:00', '11:20:00'], ['Thursday', '10:00:00', '11:20:00']] },
  { key: 'CP312-A-F', code: 'CP312', sec: 'A', instr: 'lovelace', term: 'Fall 2026', room: 'BA304', cap: 1, status: 'Open', schedule: [['Monday', '14:30:00', '15:50:00'], ['Wednesday', '14:30:00', '15:50:00']] },
  { key: 'CP317-A-F', code: 'CP317', sec: 'A', instr: 'hopper', term: 'Fall 2026', room: 'LH2002', cap: 80, mode: 'Hybrid', status: 'Open', schedule: [['Tuesday', '14:30:00', '15:50:00'], ['Thursday', '14:30:00', '15:50:00']] },
  { key: 'CP411-A-F', code: 'CP411', sec: 'A', instr: 'lovelace', term: 'Fall 2026', room: 'BA304', cap: 30, status: 'Open', schedule: [['Friday', '13:00:00', '15:50:00']] },
  { key: 'MA103-A-F', code: 'MA103', sec: 'A', instr: 'gauss', term: 'Fall 2026', room: 'SN1001', cap: 200, status: 'Open', schedule: [['Monday', '08:00:00', '08:50:00'], ['Wednesday', '08:00:00', '08:50:00'], ['Friday', '08:00:00', '08:50:00']] },
  { key: 'MA122-A-F', code: 'MA122', sec: 'A', instr: 'noether', term: 'Fall 2026', room: 'SN1001', cap: 200, mode: 'Online', status: 'Open', schedule: [['Tuesday', '09:00:00', '10:20:00'], ['Thursday', '09:00:00', '10:20:00']] },
  { key: 'MA238-A-F', code: 'MA238', sec: 'A', instr: 'gauss', term: 'Fall 2026', room: 'BA304', cap: 45, status: 'Open', schedule: [['Monday', '11:00:00', '12:20:00'], ['Wednesday', '11:00:00', '12:20:00']] },
  { key: 'PS101-A-F', code: 'PS101', sec: 'A', instr: 'james', term: 'Fall 2026', room: 'AA102', cap: 90, status: 'Open', schedule: [['Tuesday', '11:00:00', '12:20:00'], ['Thursday', '11:00:00', '12:20:00']] },
  { key: 'PS261-A-F', code: 'PS261', sec: 'A', instr: 'james', term: 'Fall 2026', room: 'AA102', cap: 90, status: 'Open', schedule: [['Monday', '15:00:00', '16:20:00'], ['Wednesday', '15:00:00', '16:20:00']] },
  { key: 'EN101-A-F', code: 'EN101', sec: 'A', instr: 'austen', term: 'Fall 2026', room: 'AA102', cap: 90, status: 'Open', schedule: [['Tuesday', '15:00:00', '16:20:00'], ['Thursday', '15:00:00', '16:20:00']] },
  { key: 'CP264-LAB-F', code: 'CP264', sec: 'L1', instr: 'turing', term: 'Fall 2026', room: 'BA201', cap: 30, status: 'Open', parent: 'CP264-A-F', schedule: [['Friday', '10:00:00', '11:50:00']] },
  { key: 'CP104-A-W', code: 'CP104', sec: 'A', instr: 'hopper', term: 'Winter 2026', room: 'LH1001', cap: 120, status: 'Closed', schedule: [['Monday', '09:00:00', '10:20:00'], ['Wednesday', '09:00:00', '10:20:00']] },
  { key: 'CP164-A-W', code: 'CP164', sec: 'A', instr: 'lovelace', term: 'Winter 2026', room: 'LH1001', cap: 120, status: 'Closed', schedule: [['Tuesday', '10:00:00', '11:20:00']] },
  { key: 'CP264-A-W', code: 'CP264', sec: 'A', instr: 'turing', term: 'Winter 2026', room: 'BA201', cap: 60, status: 'Closed', schedule: [['Tuesday', '13:00:00', '14:20:00']] },
  { key: 'MA103-A-W', code: 'MA103', sec: 'A', instr: 'gauss', term: 'Winter 2026', room: 'SN1001', cap: 200, status: 'Closed', schedule: [['Monday', '08:00:00', '08:50:00']] },
  { key: 'MA238-A-W', code: 'MA238', sec: 'A', instr: 'gauss', term: 'Winter 2026', room: 'BA304', cap: 45, status: 'Closed', schedule: [['Wednesday', '11:00:00', '12:20:00']] },
  { key: 'PS101-A-W', code: 'PS101', sec: 'A', instr: 'james', term: 'Winter 2026', room: 'AA102', cap: 90, status: 'Closed', schedule: [['Thursday', '11:00:00', '12:20:00']] },
  { key: 'CP312-A-W27', code: 'CP312', sec: 'A', instr: 'lovelace', term: 'Winter 2027', room: 'BA304', cap: 45, status: 'Open', schedule: [['Tuesday', '10:00:00', '11:20:00'], ['Thursday', '10:00:00', '11:20:00']] },
];

const students = [
  { key: 'teststudent', email: 'teststudent@example.edu', first: 'Test', last: 'Student', phone: '5195550001', dob: '2003-04-15', program: 'Computer Science', gpa: 3.5 },
  { key: 'astudent', email: 'aanderson@example.edu', first: 'Alice', last: 'Anderson', phone: '5195550002', dob: '2002-09-01', program: 'Computer Science', gpa: 3.9 },
  { key: 'bstudent', email: 'bbrown@example.edu', first: 'Bob', last: 'Brown', phone: '5195550003', dob: '2003-11-20', program: 'Computer Science', gpa: 2.1 },
  { key: 'cstudent', email: 'cclark@example.edu', first: 'Carol', last: 'Clark', phone: '5195550004', dob: '2004-02-10', program: 'Mathematics', gpa: 3.2 },
  { key: 'dstudent', email: 'ddavis@example.edu', first: 'Dan', last: 'Davis', phone: '5195550005', dob: '2003-07-07', program: 'Psychology', gpa: 3.0 },
];

const admins = [
  { email: 'admin@example.edu', first: 'Site', last: 'Admin' },
  { email: 'registrar@example.edu', first: 'Reg', last: 'Istrar' },
];

const completed = [
  { student: 'teststudent', section: 'CP104-A-W', grade: 'A' },
  { student: 'teststudent', section: 'MA103-A-W', grade: 'B+' },
  { student: 'astudent', section: 'CP104-A-W', grade: 'A+' },
  { student: 'astudent', section: 'CP164-A-W', grade: 'A' },
  { student: 'astudent', section: 'CP264-A-W', grade: 'A-' },
  { student: 'astudent', section: 'MA103-A-W', grade: 'A' },
  { student: 'astudent', section: 'MA238-A-W', grade: 'B+' },
  { student: 'bstudent', section: 'CP104-A-W', grade: 'C' },
  { student: 'cstudent', section: 'MA103-A-W', grade: 'B' },
  { student: 'dstudent', section: 'PS101-A-W', grade: 'B+' },
];

const registered = [
  { student: 'teststudent', section: 'CP164-A-F' },
  { student: 'astudent', section: 'CP213-A-F' },
  { student: 'astudent', section: 'CP312-A-F' },
  { student: 'cstudent', section: 'MA122-A-F' },
  { student: 'cstudent', section: 'MA238-A-F' },
  { student: 'dstudent', section: 'PS261-A-F' },
];

const holds = [
  { student: 'bstudent', type: 'Financial', reason: 'Outstanding tuition balance', start: '2026-05-01', end: null, active: true },
];

const degreeRequirements = [
  { program: 'Computer Science', name: 'Core Computer Science', category: 'Core', credits: 6.0, courses: ['CP104', 'CP164', 'CP213', 'CP264', 'CP312', 'CP317'] },
  { program: 'Computer Science', name: 'Required Mathematics', category: 'Required', credits: 3.0, courses: ['MA103', 'MA122', 'MA238'] },
  { program: 'Computer Science', name: 'Electives', category: 'Elective', credits: 3.0, courses: ['CP411', 'PS101', 'EN101'] },
];

const plans = [
  { student: 'teststudent', name: 'My Fall Plan', items: ['CP213-A-F', 'CP264-A-F'] },
  { student: 'astudent', name: 'My Fall Plan', items: ['CP317-A-F'] },
];

const savedFilters = [
  { student: 'teststudent', term: 'Fall 2026', faculty: 'Faculty of Science', level: 200, band: 'morning' },
  { student: 'astudent', term: 'Fall 2026', faculty: 'Faculty of Science', level: 300, band: 'afternoon' },
];

async function main() {
  const existing = await db.queryOne('SELECT COUNT(*) AS count FROM Faculties');
  if (existing && existing.count > 0) {
    logger.warn('Database already contains data. Skipping seed to avoid duplicates.');
    logger.warn('Drop and re-initialize the database first if you want a clean seed.');
    return;
  }

  const studentHash = await authService.hashPassword(STUDENT_PASSWORD);
  const adminHash = await authService.hashPassword(ADMIN_PASSWORD);

  await db.withTransaction(async (conn) => {
    const insert = async (sql, params) => {
      const [result] = await conn.execute(sql, params);
      return result.insertId;
    };

    const facultyId = {};
    for (const name of faculties) {
      facultyId[name] = await insert('INSERT INTO Faculties (faculty_name) VALUES (?)', [name]);
    }

    const departmentId = {};
    for (const d of departments) {
      departmentId[d.name] = await insert(
        'INSERT INTO Departments (department_name, faculty_id) VALUES (?, ?)',
        [d.name, facultyId[d.faculty]]
      );
    }

    const programId = {};
    for (const p of programs) {
      programId[p.name] = await insert(
        'INSERT INTO Programs (program_name, degree_type, department_id) VALUES (?, ?, ?)',
        [p.name, p.degree, departmentId[p.dept]]
      );
    }

    const roomId = {};
    for (const r of rooms) {
      roomId[r.key] = await insert(
        'INSERT INTO Rooms (building, room_number, capacity, campus) VALUES (?, ?, ?, ?)',
        [r.building, r.number, r.capacity, r.campus]
      );
    }

    const instructorId = {};
    for (const i of instructors) {
      instructorId[i.key] = await insert(
        'INSERT INTO Instructors (first_name, last_name, email, department_id) VALUES (?, ?, ?, ?)',
        [i.first, i.last, i.email, departmentId[i.dept]]
      );
    }

    const termId = {};
    for (const t of terms) {
      termId[t.name] = await insert(
        `INSERT INTO AcademicTerms
           (term_name, semester, year, start_date, end_date, registration_open_date, registration_close_date)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [t.name, t.semester, t.year, t.start, t.end, t.regOpen, t.regClose]
      );
    }

    const courseId = {};
    for (const c of courses) {
      courseId[c.code] = await insert(
        `INSERT INTO Courses
           (course_code, course_name, course_description, course_level, credits, department_id)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [c.code, c.name, c.desc, c.level, c.credits, departmentId[c.dept]]
      );
    }

    for (const [course, required] of prerequisites) {
      await insert('INSERT INTO Prerequisites (course_id, required_course_id) VALUES (?, ?)', [
        courseId[course],
        courseId[required],
      ]);
    }

    for (const [course, anti] of antirequisites) {
      await insert('INSERT INTO Antirequisites (course_id, antirequisite_course_id) VALUES (?, ?)', [
        courseId[course],
        courseId[anti],
      ]);
    }

    for (const [course, coreq] of corequisites) {
      await insert('INSERT INTO Corequisites (course_id, corequisite_course_id) VALUES (?, ?)', [
        courseId[course],
        courseId[coreq],
      ]);
    }

    const sectionId = {};
    for (const s of sections) {
      const id = await insert(
        `INSERT INTO CourseSections
           (course_id, instructor_id, term_id, section_number, capacity, enrolled_count,
            room_id, delivery_mode, status, parent_crn)
         VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?, ?)`,
        [courseId[s.code], instructorId[s.instr], termId[s.term], s.sec, s.cap, roomId[s.room], s.mode || 'In-Person', s.status, s.parent ? sectionId[s.parent] : null]
      );
      sectionId[s.key] = id;
      for (const [day, start, end] of s.schedule) {
        await insert(
          'INSERT INTO ClassSchedule (crn, day_of_week, start_time, end_time) VALUES (?, ?, ?, ?)',
          [id, day, start, end]
        );
      }
    }

    const studentId = {};
    for (const st of students) {
      const accountId = await insert(
        'INSERT INTO Accounts (email, password_hash) VALUES (?, ?)',
        [st.email, studentHash]
      );
      studentId[st.key] = await insert(
        `INSERT INTO Students
           (account_id, first_name, last_name, student_phone, date_of_birth, program_id, GPA)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [accountId, st.first, st.last, st.phone, st.dob, programId[st.program], st.gpa]
      );
    }

    for (const ad of admins) {
      const accountId = await insert(
        'INSERT INTO Accounts (email, password_hash) VALUES (?, ?)',
        [ad.email, adminHash]
      );
      await insert(
        'INSERT INTO Administrators (account_id, first_name, last_name) VALUES (?, ?, ?)',
        [accountId, ad.first, ad.last]
      );
    }

    for (const e of completed) {
      await insert(
        'INSERT INTO Enrollments (student_id, crn, enrollment_date, final_grade, status) VALUES (?, ?, ?, ?, ?)',
        [studentId[e.student], sectionId[e.section], '2026-01-10', e.grade, 'Completed']
      );
    }

    for (const e of registered) {
      await insert(
        'INSERT INTO Enrollments (student_id, crn, enrollment_date, final_grade, status) VALUES (?, ?, ?, NULL, ?)',
        [studentId[e.student], sectionId[e.section], '2026-06-10', 'Registered']
      );
    }

    await conn.execute(
      `UPDATE CourseSections cs
          SET enrolled_count = (
            SELECT COUNT(*) FROM Enrollments e
             WHERE e.crn = cs.crn AND e.status = 'Registered'
          )`
    );

    for (const h of holds) {
      await insert(
        'INSERT INTO Holds (student_id, hold_type, reason, start_date, end_date, active) VALUES (?, ?, ?, ?, ?, ?)',
        [studentId[h.student], h.type, h.reason, h.start, h.end, h.active]
      );
    }

    for (const dr of degreeRequirements) {
      const requirementId = await insert(
        'INSERT INTO DegreeRequirements (program_id, requirement_name, requirement_category, required_credits) VALUES (?, ?, ?, ?)',
        [programId[dr.program], dr.name, dr.category, dr.credits]
      );
      for (const code of dr.courses) {
        await insert('INSERT INTO RequirementCourses (requirement_id, course_id) VALUES (?, ?)', [
          requirementId,
          courseId[code],
        ]);
      }
    }

    for (const pl of plans) {
      const planId = await insert(
        'INSERT INTO CoursePlans (student_id, plan_name) VALUES (?, ?)',
        [studentId[pl.student], pl.name]
      );
      for (const key of pl.items) {
        await insert('INSERT INTO CoursePlanItems (plan_id, crn) VALUES (?, ?)', [
          planId,
          sectionId[key],
        ]);
      }
    }

    for (const f of savedFilters) {
      await insert(
        'INSERT INTO SavedFilters (student_id, term_id, faculty_id, course_level, time_band) VALUES (?, ?, ?, ?, ?)',
        [studentId[f.student], termId[f.term], facultyId[f.faculty], f.level, f.band]
      );
    }
  });

  logger.info('Seed complete.');
  logger.info(`Students (password ${STUDENT_PASSWORD}): ${students.map((s) => s.email).join(', ')}`);
  logger.info(`Admins (password ${ADMIN_PASSWORD}): ${admins.map((a) => a.email).join(', ')}`);
}

main()
  .catch((err) => {
    logger.error('Failed to seed the database:', err.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.close();
  });
