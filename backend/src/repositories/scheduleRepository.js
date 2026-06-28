'use strict';

const baseRepository = require('./baseRepository');
const db = require('../db');

const DAY_ORDER =
  'FIELD(day_of_week, "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday")';

const repo = baseRepository('ClassSchedule', 'schedule_id', [
  'crn',
  'day_of_week',
  'start_time',
  'end_time',
]);

repo.findByCrn = (crn) =>
  db.query(
    `SELECT * FROM ClassSchedule WHERE crn = ? ORDER BY ${DAY_ORDER}, start_time`,
    [crn]
  );

module.exports = repo;
