'use strict';

const baseRepository = require('./baseRepository');

module.exports = baseRepository('AcademicTerms', 'term_id', [
  'term_name',
  'semester',
  'year',
  'start_date',
  'end_date',
  'registration_open_date',
  'registration_close_date',
]);
