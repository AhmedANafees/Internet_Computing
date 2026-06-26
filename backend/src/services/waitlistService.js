'use strict';

const crudService = require('./crudService');
const repo = require('../repositories/waitlistRepository');
const db = require('../db');
const ApiError = require('../utils/ApiError');

const service = crudService(repo, 'Waitlist entry');

service.bySection = (sectionId) => repo.findBySection(sectionId);
service.byStudent = (studentId) => repo.findByStudent(studentId);

service.add = async (studentId, crn) => {
  const next = await db.queryOne(
    'SELECT COALESCE(MAX(position), 0) + 1 AS nextPos FROM Waitlists WHERE crn = ?',
    [crn]
  );
  const today = new Date().toISOString().slice(0, 10);
  try {
    return await repo.create({
      student_id: studentId,
      crn,
      position: next.nextPos,
      date_joined: today,
    });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      throw ApiError.conflict('Already on the waitlist for this section');
    }
    throw err;
  }
};

module.exports = service;
