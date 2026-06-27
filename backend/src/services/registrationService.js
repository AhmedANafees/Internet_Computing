'use strict';

const db = require('../db');
const ApiError = require('../utils/ApiError');

const RESULT = { REGISTERED: 'registered', WAITLISTED: 'waitlisted', FAILED: 'failed' };
const ENROLLMENT = { REGISTERED: 'Registered', DROPPED: 'Dropped' };

const PASSING = "e.final_grade IS NOT NULL AND e.final_grade NOT IN ('F', 'WF', 'DNW')";

function timesOverlap(startA, endA, startB, endB) {
  return startA < endB && startB < endA;
}

function schedulesConflict(entriesA, entriesB) {
  for (const a of entriesA) {
    for (const b of entriesB) {
      if (
        a.day_of_week === b.day_of_week &&
        timesOverlap(a.start_time, a.end_time, b.start_time, b.end_time)
      ) {
        return true;
      }
    }
  }
  return false;
}

async function getSchedulesForCrns(crns) {
  const map = new Map();
  if (!crns || crns.length === 0) {
    return map;
  }
  const placeholders = crns.map(() => '?').join(', ');
  const rows = await db.query(
    `SELECT crn, day_of_week, start_time, end_time
       FROM ClassSchedule
      WHERE crn IN (${placeholders})`,
    crns
  );
  for (const row of rows) {
    if (!map.has(row.crn)) {
      map.set(row.crn, []);
    }
    map.get(row.crn).push(row);
  }
  return map;
}

async function findConflicts(crns) {
  const schedules = await getSchedulesForCrns(crns);
  const conflicts = [];
  for (let i = 0; i < crns.length; i += 1) {
    for (let j = i + 1; j < crns.length; j += 1) {
      const a = schedules.get(crns[i]) || [];
      const b = schedules.get(crns[j]) || [];
      if (schedulesConflict(a, b)) {
        conflicts.push({ crnA: crns[i], crnB: crns[j] });
      }
    }
  }
  return conflicts;
}

async function getRegisteredCrns(studentId) {
  const rows = await db.query(
    'SELECT crn FROM Enrollments WHERE student_id = ? AND status = ?',
    [studentId, ENROLLMENT.REGISTERED]
  );
  return rows.map((row) => row.crn);
}

async function conflictsWithRegistered(studentId, crn, options = {}) {
  const { excludeCrn = null } = options;
  const registered = (await getRegisteredCrns(studentId)).filter(
    (id) => id !== crn && id !== excludeCrn
  );
  if (registered.length === 0) {
    return { conflict: false, conflictingCrns: [] };
  }
  const schedules = await getSchedulesForCrns([crn, ...registered]);
  const target = schedules.get(crn) || [];
  const conflictingCrns = registered.filter((id) =>
    schedulesConflict(target, schedules.get(id) || [])
  );
  return { conflict: conflictingCrns.length > 0, conflictingCrns };
}

async function getMissingPrerequisites(studentId, courseId) {
  const rows = await db.query(
    `SELECT p.required_course_id
       FROM Prerequisites p
      WHERE p.course_id = ?
        AND NOT EXISTS (
          SELECT 1
            FROM Enrollments e
            JOIN CourseSections cs ON cs.crn = e.crn
           WHERE e.student_id = ?
             AND cs.course_id = p.required_course_id
             AND ${PASSING}
        )`,
    [courseId, studentId]
  );
  return rows.map((row) => row.required_course_id);
}

async function getBlockingAntirequisites(studentId, courseId) {
  const rows = await db.query(
    `SELECT DISTINCT cs.course_id
       FROM Enrollments e
       JOIN CourseSections cs ON cs.crn = e.crn
      WHERE e.student_id = ?
        AND (e.status = ? OR (${PASSING}))
        AND cs.course_id IN (
          SELECT antirequisite_course_id FROM Antirequisites WHERE course_id = ?
          UNION
          SELECT course_id FROM Antirequisites WHERE antirequisite_course_id = ?
        )`,
    [studentId, ENROLLMENT.REGISTERED, courseId, courseId]
  );
  return rows.map((row) => row.course_id);
}

async function isRegisteredInCourse(studentId, courseId, options = {}) {
  const { excludeCrn = null } = options;
  const params = [studentId, courseId, ENROLLMENT.REGISTERED];
  let exclude = '';
  if (excludeCrn !== null) {
    exclude = ' AND e.crn <> ?';
    params.push(excludeCrn);
  }
  const row = await db.queryOne(
    `SELECT 1
       FROM Enrollments e
       JOIN CourseSections cs ON cs.crn = e.crn
      WHERE e.student_id = ? AND cs.course_id = ? AND e.status = ?${exclude}
      LIMIT 1`,
    params
  );
  return row !== null;
}

async function getActiveHold(studentId) {
  return db.queryOne(
    'SELECT hold_id, hold_type, reason FROM Holds WHERE student_id = ? AND active = TRUE LIMIT 1',
    [studentId]
  );
}

async function recordAttempt(executor, studentId, crn, result, reason) {
  await executor.execute(
    `INSERT INTO RegistrationAttempts (student_id, crn, result, failure_reason)
     VALUES (?, ?, ?, ?)`,
    [studentId, crn, result, reason || null]
  );
}

async function recordAudit(executor, studentId, crn, actionType, details) {
  await executor.execute(
    `INSERT INTO AuditLog (student_id, action_type, crn, details)
     VALUES (?, ?, ?, ?)`,
    [studentId, actionType, crn, details || null]
  );
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

async function registerSection(studentId, crn) {
  const section = await db.queryOne(
    `SELECT cs.crn, cs.course_id, cs.status,
            t.registration_open_date, t.registration_close_date
       FROM CourseSections cs
       LEFT JOIN AcademicTerms t ON t.term_id = cs.term_id
      WHERE cs.crn = ?`,
    [crn]
  );

  if (!section) {
    return { result: RESULT.FAILED, reason: 'Section not found' };
  }

  const fail = async (reason) => {
    await recordAttempt(db.pool, studentId, crn, RESULT.FAILED, reason);
    return { result: RESULT.FAILED, reason };
  };

  if (section.status && section.status !== 'Open') {
    return fail('Section is not open');
  }

  const today = todayIso();
  if (section.registration_open_date && today < section.registration_open_date) {
    return fail('Registration has not opened');
  }
  if (section.registration_close_date && today > section.registration_close_date) {
    return fail('Registration is closed');
  }

  if (await getActiveHold(studentId)) {
    return fail('Active hold on account');
  }

  if (await isRegisteredInCourse(studentId, section.course_id)) {
    return fail('Already registered in this course');
  }

  if ((await getMissingPrerequisites(studentId, section.course_id)).length > 0) {
    return fail('Prerequisite not met');
  }

  if ((await getBlockingAntirequisites(studentId, section.course_id)).length > 0) {
    return fail('Antirequisite restriction');
  }

  const { conflict, conflictingCrns } = await conflictsWithRegistered(studentId, crn);
  if (conflict) {
    await recordAttempt(db.pool, studentId, crn, RESULT.FAILED, 'Time conflict');
    return { result: RESULT.FAILED, reason: 'Time conflict', conflictingCrns };
  }

  return db.withTransaction(async (conn) => {
    const [secRows] = await conn.execute(
      'SELECT capacity, enrolled_count FROM CourseSections WHERE crn = ? FOR UPDATE',
      [crn]
    );
    const seat = secRows[0];
    const isFull = seat.capacity !== null && seat.enrolled_count >= seat.capacity;

    if (isFull) {
      const [already] = await conn.execute(
        'SELECT position FROM Waitlists WHERE student_id = ? AND crn = ?',
        [studentId, crn]
      );
      if (already.length > 0) {
        return { result: RESULT.WAITLISTED, position: already[0].position };
      }
      const [posRows] = await conn.execute(
        'SELECT COALESCE(MAX(position), 0) + 1 AS nextPos FROM Waitlists WHERE crn = ?',
        [crn]
      );
      const position = posRows[0].nextPos;
      await conn.execute(
        'INSERT INTO Waitlists (student_id, crn, position, date_joined) VALUES (?, ?, ?, ?)',
        [studentId, crn, position, today]
      );
      await recordAttempt(conn, studentId, crn, RESULT.WAITLISTED, 'Section full');
      await recordAudit(conn, studentId, crn, 'WAITLIST', `Joined waitlist at position ${position}`);
      return { result: RESULT.WAITLISTED, position };
    }

    const [existing] = await conn.execute(
      'SELECT enrollment_id FROM Enrollments WHERE student_id = ? AND crn = ?',
      [studentId, crn]
    );
    if (existing.length > 0) {
      await conn.execute(
        'UPDATE Enrollments SET status = ?, enrollment_date = ?, final_grade = NULL WHERE enrollment_id = ?',
        [ENROLLMENT.REGISTERED, today, existing[0].enrollment_id]
      );
    } else {
      await conn.execute(
        'INSERT INTO Enrollments (student_id, crn, enrollment_date, status) VALUES (?, ?, ?, ?)',
        [studentId, crn, today, ENROLLMENT.REGISTERED]
      );
    }
    await conn.execute(
      'UPDATE CourseSections SET enrolled_count = enrolled_count + 1 WHERE crn = ?',
      [crn]
    );
    await recordAttempt(conn, studentId, crn, RESULT.REGISTERED, null);
    await recordAudit(conn, studentId, crn, 'REGISTER', 'Registered for section');
    return { result: RESULT.REGISTERED };
  });
}

async function registerPlan(studentId, planId) {
  const owned = await db.queryOne(
    'SELECT plan_id FROM CoursePlans WHERE plan_id = ? AND student_id = ?',
    [planId, studentId]
  );
  if (!owned) {
    throw ApiError.notFound('Plan not found');
  }

  const items = await db.query(
    'SELECT crn FROM CoursePlanItems WHERE plan_id = ? ORDER BY date_added ASC',
    [planId]
  );

  const results = [];
  for (const item of items) {
    // eslint-disable-next-line no-await-in-loop
    const outcome = await registerSection(studentId, item.crn);
    results.push({ crn: item.crn, ...outcome });
  }
  return { items: results };
}

async function dropSection(studentId, crn) {
  return db.withTransaction(async (conn) => {
    const [rows] = await conn.execute(
      'SELECT enrollment_id FROM Enrollments WHERE student_id = ? AND crn = ? AND status = ? FOR UPDATE',
      [studentId, crn, ENROLLMENT.REGISTERED]
    );
    if (rows.length === 0) {
      throw ApiError.badRequest('You are not registered in this section');
    }
    await conn.execute('UPDATE Enrollments SET status = ? WHERE enrollment_id = ?', [
      ENROLLMENT.DROPPED,
      rows[0].enrollment_id,
    ]);
    await conn.execute(
      'UPDATE CourseSections SET enrolled_count = GREATEST(enrolled_count - 1, 0) WHERE crn = ?',
      [crn]
    );
    await recordAudit(conn, studentId, crn, 'DROP', 'Dropped section');
    return { result: 'dropped' };
  });
}

async function swapSection(studentId, fromCrn, toCrn) {
  if (fromCrn === toCrn) {
    throw ApiError.badRequest('Cannot swap a section for itself');
  }

  const sections = await db.query(
    'SELECT crn, course_id, status FROM CourseSections WHERE crn IN (?, ?)',
    [fromCrn, toCrn]
  );
  const from = sections.find((s) => s.crn === fromCrn);
  const to = sections.find((s) => s.crn === toCrn);
  if (!from || !to) {
    throw ApiError.notFound('Section not found');
  }
  if (from.course_id !== to.course_id) {
    throw ApiError.badRequest('Swap must be within the same course');
  }

  const fail = async (reason) => {
    await recordAttempt(db.pool, studentId, toCrn, RESULT.FAILED, reason);
    return { result: RESULT.FAILED, reason };
  };

  if (to.status && to.status !== 'Open') {
    return fail('Section is not open');
  }
  if (await getActiveHold(studentId)) {
    return fail('Active hold on account');
  }
  const { conflict, conflictingCrns } = await conflictsWithRegistered(studentId, toCrn, {
    excludeCrn: fromCrn,
  });
  if (conflict) {
    await recordAttempt(db.pool, studentId, toCrn, RESULT.FAILED, 'Time conflict');
    return { result: RESULT.FAILED, reason: 'Time conflict', conflictingCrns };
  }

  const today = todayIso();
  return db.withTransaction(async (conn) => {
    const [fromRows] = await conn.execute(
      'SELECT enrollment_id FROM Enrollments WHERE student_id = ? AND crn = ? AND status = ? FOR UPDATE',
      [studentId, fromCrn, ENROLLMENT.REGISTERED]
    );
    if (fromRows.length === 0) {
      throw ApiError.badRequest('You are not registered in the section you are swapping out');
    }

    const [toRows] = await conn.execute(
      'SELECT capacity, enrolled_count FROM CourseSections WHERE crn = ? FOR UPDATE',
      [toCrn]
    );
    const seat = toRows[0];
    if (seat.capacity !== null && seat.enrolled_count >= seat.capacity) {
      await recordAttempt(conn, studentId, toCrn, RESULT.FAILED, 'Section full');
      return { result: RESULT.FAILED, reason: 'Section full' };
    }

    await conn.execute('UPDATE Enrollments SET status = ? WHERE enrollment_id = ?', [
      ENROLLMENT.DROPPED,
      fromRows[0].enrollment_id,
    ]);
    await conn.execute(
      'UPDATE CourseSections SET enrolled_count = GREATEST(enrolled_count - 1, 0) WHERE crn = ?',
      [fromCrn]
    );

    const [existing] = await conn.execute(
      'SELECT enrollment_id FROM Enrollments WHERE student_id = ? AND crn = ?',
      [studentId, toCrn]
    );
    if (existing.length > 0) {
      await conn.execute(
        'UPDATE Enrollments SET status = ?, enrollment_date = ?, final_grade = NULL WHERE enrollment_id = ?',
        [ENROLLMENT.REGISTERED, today, existing[0].enrollment_id]
      );
    } else {
      await conn.execute(
        'INSERT INTO Enrollments (student_id, crn, enrollment_date, status) VALUES (?, ?, ?, ?)',
        [studentId, toCrn, today, ENROLLMENT.REGISTERED]
      );
    }
    await conn.execute(
      'UPDATE CourseSections SET enrolled_count = enrolled_count + 1 WHERE crn = ?',
      [toCrn]
    );

    await recordAttempt(conn, studentId, toCrn, RESULT.REGISTERED, null);
    await recordAudit(conn, studentId, fromCrn, 'SWAP', `Swapped to CRN ${toCrn}`);
    return { result: RESULT.REGISTERED };
  });
}

module.exports = {
  RESULT,
  timesOverlap,
  schedulesConflict,
  getSchedulesForCrns,
  findConflicts,
  getRegisteredCrns,
  conflictsWithRegistered,
  getMissingPrerequisites,
  getBlockingAntirequisites,
  isRegisteredInCourse,
  getActiveHold,
  registerSection,
  registerPlan,
  dropSection,
  swapSection,
};
