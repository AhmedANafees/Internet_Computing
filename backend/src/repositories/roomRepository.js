'use strict';

const baseRepository = require('./baseRepository');

module.exports = baseRepository('Rooms', 'room_id', [
  'building',
  'room_number',
  'capacity',
  'campus',
]);
